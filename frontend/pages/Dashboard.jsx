import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Users,
  Gavel,
  Palette,
  BarChart3,
  Settings,
  Eye,
  Trash2,
  Images,
} from "lucide-react";
import CreateAuctionModal from "../components/CreateAuctionModal.jsx";
import CreateArtworkModal from "../components/CreateArtworkModal.jsx";
import { useLoginModal } from "../context/LoginModalContext.jsx";

const API_BASE = "http://localhost:3001";

const fetchJson = async (url, opts) => {
  const res = await fetch(url, { credentials: "include", ...(opts || {}) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
  return json;
};
const listFromApi = (p) => {
  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.data)) return p.data;
  if (Array.isArray(p?.items)) return p.items;
  return [];
};
const idOf = (v) =>
  v?._id || v?.id || (typeof v === "string" ? v : null);

const avatarFallback =
  "https://api.dicebear.com/7.x/initials/svg?radius=50&seed=User";

const UserHeader = ({ user }) => {
  const created =
    user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—";
  const avatar = user?.avatarUrl || avatarFallback;
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center gap-4">
      <img
        src={avatar}
        alt={user?.userName || user?.email || "User"}
        className="w-12 h-12 rounded-full object-cover"
        onError={(e) => (e.currentTarget.src = avatarFallback)}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-black">
            {user?.userName || user?.email || "User"}
          </h2>
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              user?.role === "admin"
                ? "bg-red-100 text-red-700"
                : user?.role === "seller" || user?.role === "artist"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {user?.role || "—"}
          </span>
        </div>
        <p className="text-xs text-gray-600">Mitglied seit: {created}</p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isInitializing } = useLoginModal();

  const [loading, setLoading] = useState(true);

  // seller/artist
  const [myAuctionsRaw, setMyAuctionsRaw] = useState([]);
  const [showCreateAuction, setShowCreateAuction] = useState(false);
  const [showCreateArtwork, setShowCreateArtwork] = useState(false);

  // buyer
  const [myOffers, setMyOffers] = useState([]);

  // admin
  const [allUsers, setAllUsers] = useState([]);
  const [allAuctions, setAllAuctions] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        if (user.role === "seller" || user.role === "artist") {
          const raw = await fetchJson(`${API_BASE}/api/auctions/me`);
          const list = listFromApi(raw);
          if (!cancelled) setMyAuctionsRaw(list);
        } else if (user.role === "buyer") {
          const raw = await fetchJson(`${API_BASE}/api/offers/me`);
          let offers = listFromApi(raw);
          const uid = idOf(user);
          if (uid) {
            offers = offers.filter(
              (o) =>
                idOf(o?.buyer) === uid ||
                o?.buyerId === uid ||
                o?.userId === uid ||
                idOf(o?.bidder) === uid ||
                o?.bidderId === uid
            );
          }
          if (!cancelled) setMyOffers(offers);
        } else if (user.role === "admin") {
          const [u, a] = await Promise.all([
            fetchJson(`${API_BASE}/api/users`),
            fetchJson(`${API_BASE}/api/auctions`),
          ]);
          if (!cancelled) {
            setAllUsers(listFromApi(u));
            setAllAuctions(listFromApi(a));
          }
        }
      } catch (e) {
        console.error("Dashboard load error:", e);
        if (!cancelled) {
          setMyAuctionsRaw([]);
          setMyOffers([]);
          setAllUsers([]);
          setAllAuctions([]);
        }
      } finally {
        !cancelled && setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // hard filter by artistId === current user
  const myAuctions = useMemo(() => {
    if (!user) return [];
    const uid = idOf(user);
    return myAuctionsRaw.filter((a) => {
      const aid =
        idOf(a?.artistId) ||
        idOf(a?.artist) ||
        idOf(a?.owner) ||
        (a?.artistId && typeof a.artistId === "object"
          ? idOf(a.artistId)
          : null);
      return aid === uid;
    });
  }, [myAuctionsRaw, user]);

  const now = Date.now();
  const activeMyAuction = useMemo(() => {
    const actives = myAuctions
      .filter((a) => {
        const s = String(a?.status || "").toLowerCase();
        const isActive = s === "live" || s === "upcoming" || s === "active";
        const notEnded =
          a?.endDate && new Date(a.endDate).getTime() > now && s !== "ended";
        return isActive || notEnded;
      })
      .sort(
        (a, b) =>
          new Date(a.endDate || 0).getTime() - new Date(b.endDate || 0).getTime()
      );
    return actives[0] || null;
  }, [myAuctions, now]);

  const handleCreateAuction = async ({ auction, artworks }) => {
    const created = await fetchJson(`${API_BASE}/api/auctions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...auction,
        artistId: idOf(user),
        endDate: new Date(auction.endDate).toISOString(),
      }),
    });
    const createdAuction = created?.data || created;
    const auctionId = idOf(createdAuction);
    if (!auctionId) throw new Error("Keine Auction-ID erhalten");

    if (Array.isArray(artworks) && artworks.length) {
      await Promise.all(
        artworks.map((aw) =>
          fetchJson(`${API_BASE}/api/artworks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...aw,
              startPrice: parseFloat(aw.startPrice),
              endPrice: parseFloat(aw.endPrice),
              price: parseFloat(aw.price || aw.startPrice),
              currency: aw.currency || "EUR",
              endDate: new Date(auction.endDate).toISOString(),
              auctionId,
            }),
          })
        )
      );
    }

    const raw = await fetchJson(`${API_BASE}/api/auctions/me`);
    setMyAuctionsRaw(listFromApi(raw));
    setShowCreateAuction(false);
    alert("✅ Auktion erstellt");
  };

  const handleDeleteAuction = async (auction) => {
    if (!auction?._id) return;
    if (!window.confirm(`"${auction.title}" löschen?`)) return;
    await fetchJson(`${API_BASE}/api/auctions/${auction._id}`, {
      method: "DELETE",
    });
    setMyAuctionsRaw((prev) => prev.filter((a) => a._id !== auction._id));
  };

  const handleCreateArtwork = async (auctionId, artworks) => {
    if (!auctionId || !Array.isArray(artworks) || !artworks.length) return;
    await Promise.all(
      artworks.map((aw) =>
        fetchJson(`${API_BASE}/api/artworks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...aw,
            startPrice: parseFloat(aw.startPrice),
            endPrice: parseFloat(aw.endPrice),
            price: parseFloat(aw.price || aw.startPrice),
            currency: aw.currency || "EUR",
            auctionId,
          }),
        })
      )
    );
    alert("✅ Kunstwerk(e) hinzugefügt");
  };

  const AdminView = () => (
    <div className="space-y-6">
      <UserHeader user={user} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <Users className="text-blue-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-black">Benutzer</h3>
              <p className="text-2xl font-bold text-blue-600">
                {allUsers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <Gavel className="text-green-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-black">Auktionen</h3>
              <p className="text-2xl font-bold text-green-600">
                {allAuctions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-purple-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-black">Aktivität</h3>
              <p className="text-2xl font-bold text-purple-600">Live</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Benutzer verwalten
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 text-black font-semibold">Name</th>
                <th className="text-left p-2 text-black font-semibold">
                  E-Mail
                </th>
                <th className="text-left p-2 text-black font-semibold">
                  Rolle
                </th>
              </tr>
            </thead>
            <tbody>
              {allUsers.slice(0, 20).map((u) => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-black">{u.userName}</td>
                  <td className="p-2 text-black">{u.email}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        u.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : u.role === "seller" || u.role === "artist"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
              {!allUsers.length && (
                <tr>
                  <td colSpan={3} className="p-4 text-gray-500">
                    Keine Benutzer gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const SellerView = () => (
    <div className="space-y-6">
      <UserHeader user={user} />

      {!activeMyAuction ? (
        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Neue Auktion
              </h3>
              <p className="text-green-700">
                Erstellen Sie eine neue Auktion. Sie können später Kunstwerke
                hinzufügen.
              </p>
            </div>
            <button
              onClick={() => setShowCreateAuction(true)}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Auktion erstellen
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {activeMyAuction.bannerImageUrl && (
            <img
              src={activeMyAuction.bannerImageUrl}
              alt={activeMyAuction.title}
              className="w-full h-44 object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/800x300?text=Auction";
              }}
            />
          )}

          <div className="p-5">
            <h2 className="text-xl font-semibold text-black">
              {activeMyAuction.title}
            </h2>
            <p className="text-gray-700 mt-1 line-clamp-3">
              {activeMyAuction.description}
            </p>
            {activeMyAuction.endDate && (
              <p className="text-sm text-gray-600 mt-2">
                Ende: {new Date(activeMyAuction.endDate).toLocaleString()}
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded flex items-center justify-center gap-1"
                onClick={() => navigate(`/auction/${activeMyAuction._id}`)}
              >
                <Eye size={16} /> Ansehen
              </button>
              <button
                className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-3 rounded flex items-center justify-center gap-1"
                onClick={() => setShowCreateArtwork(true)}
              >
                <Images size={16} /> Kunstwerk hinzufügen
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded flex items-center justify-center gap-1"
                onClick={() => handleDeleteAuction(activeMyAuction)}
              >
                <Trash2 size={16} /> Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const BuyerView = () => (
    <div className="space-y-6">
      <UserHeader user={user} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-blue-800">Meine Gebote</h3>
          <p className="text-3xl font-bold text-blue-600">
            {Array.isArray(myOffers) ? myOffers.length : 0}
          </p>
          <p className="text-blue-700 text-sm">Aktive/letzte Gebote</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-green-800">
            Gewonnene Auktionen
          </h3>
          <p className="text-3xl font-bold text-green-600">0</p>
          <p className="text-green-700 text-sm">Erfolgreich ersteigert</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Meine Gebote</h2>
        {Array.isArray(myOffers) && myOffers.length > 0 ? (
          <div className="space-y-3">
            {myOffers.map((offer) => (
              <div
                key={offer._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h3 className="font-medium text-black">
                    Kunstwerk #{offer.artworkId}
                  </h3>
                  <p className="text-sm text-gray-700">
                    Gebot: {offer.amount}€
                  </p>
                  {offer.createdAt && (
                    <p className="text-xs text-gray-500">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Aktiv
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <Gavel size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-black font-medium">Noch keine Gebote abgegeben</p>
            <p className="text-sm text-gray-700">
              Besuchen Sie die Auktionsseite um Gebote abzugeben
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (isInitializing) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-black mb-2">
          Bitte melden Sie sich an
        </h1>
        <p className="text-gray-700">
          Sie müssen eingeloggt sein, um das Dashboard zu verwenden.
        </p>
      </div>
    );
  }

  const renderByRole = () => {
    switch (user.role) {
      case "admin":
        return <AdminView />;
      case "seller":
      case "artist":
        return <SellerView />;
      case "buyer":
      default:
        return <BuyerView />;
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-8">{renderByRole()}</div>

      {(user.role === "seller" || user.role === "artist") && (
        <>
          <CreateAuctionModal
            isOpen={showCreateAuction}
            onClose={() => setShowCreateAuction(false)}
            onSubmit={handleCreateAuction}
          />

          {activeMyAuction && (
            <CreateArtworkModal
              isOpen={showCreateArtwork}
              onClose={() => setShowCreateArtwork(false)}
              onSubmit={async (artworks) => {
                await handleCreateArtwork(activeMyAuction._id, artworks);
                setShowCreateArtwork(false);
              }}
            />
          )}
        </>
      )}
    </>
  );
}
