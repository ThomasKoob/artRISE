import React, { useEffect, useMemo, useState } from "react";
import { useLoginModal } from "../context/LoginModalContext.jsx";
import CreateAuctionModal from "../components/CreateAuctionModal.jsx";
import CreateArtworkModal from "../components/CreateArtworkModal.jsx";

// Import the new dashboard components
import AdminDashboard from "../components/AdminDashboard.jsx";
import SellerDashboard from "../components/SellerDashboard.jsx";
import BuyerDashboard from "../components/BuyerDashboard.jsx";

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

const idOf = (v) => v?._id || v?.id || (typeof v === "string" ? v : null);

export default function Dashboard() {
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
          new Date(a.endDate || 0).getTime() -
          new Date(b.endDate || 0).getTime()
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

  // Loading and Authentication States
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

  // Render appropriate dashboard based on user role
  const renderDashboardByRole = () => {
    switch (user.role) {
      case "admin":
        return (
          <AdminDashboard
            user={user}
            allUsers={allUsers}
            allAuctions={allAuctions}
          />
        );
      case "seller":
      case "artist":
        return (
          <SellerDashboard
            user={user}
            activeMyAuction={activeMyAuction}
            onCreateAuction={() => setShowCreateAuction(true)}
            onCreateArtwork={() => setShowCreateArtwork(true)}
            onDeleteAuction={handleDeleteAuction}
          />
        );
      case "buyer":
      default:
        return <BuyerDashboard user={user} myOffers={myOffers} />;
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderDashboardByRole()}
      </div>

      {/* Modals for Seller/Artist */}
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
