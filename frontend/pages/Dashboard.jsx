// frontend/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLoginModal } from "../context/LoginModalContext.jsx";
import CreateAuctionModal from "../components/CreateAuctionModal.jsx";
import CreateArtworkModal from "../components/CreateArtworkModal.jsx";
import AdminDashboard from "../components/AdminDashboard.jsx";
import SellerDashboard from "../components/SellerDashboard.jsx";
import BuyerDashboard from "../components/BuyerDashboard.jsx";

// Import API functions
import {
  getMyAuctions,
  getMyOffers,
  getAllUsers,
  getAllAuctions,
  createAuction,
  createArtwork,
  deleteAuction,
  listFromApi,
  idOf,
} from "../api/api";

export default function Dashboard() {
  const { user, isInitializing } = useLoginModal();

  const [loading, setLoading] = useState(true);
  const [myAuctionsRaw, setMyAuctionsRaw] = useState([]);
  const [showCreateAuction, setShowCreateAuction] = useState(false);
  const [showCreateArtwork, setShowCreateArtwork] = useState(false);
  const [myOffers, setMyOffers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allAuctions, setAllAuctions] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        if (user.role === "seller" || user.role === "artist") {
          const raw = await getMyAuctions();
          const list = listFromApi(raw);
          if (!cancelled) setMyAuctionsRaw(list);
        } else if (user.role === "buyer") {
          const raw = await getMyOffers();
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
          const [u, a] = await Promise.all([getAllUsers(), getAllAuctions()]);
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
    const created = await createAuction({
      ...auction,
      artistId: idOf(user),
      endDate: new Date(auction.endDate).toISOString(),
    });

    const createdAuction = created?.data || created;
    const auctionId = idOf(createdAuction);
    if (!auctionId) throw new Error("Keine Auction-ID erhalten");

    if (Array.isArray(artworks) && artworks.length) {
      await Promise.all(
        artworks.map((aw) =>
          createArtwork({
            ...aw,
            startPrice: parseFloat(aw.startPrice),
            endPrice: parseFloat(aw.endPrice),
            price: parseFloat(aw.price || aw.startPrice),
            currency: aw.currency || "EUR",
            endDate: new Date(auction.endDate).toISOString(),
            auctionId,
          })
        )
      );
    }

    const raw = await getMyAuctions();
    setMyAuctionsRaw(listFromApi(raw));
    setShowCreateAuction(false);
    alert("✅ Auktion erstellt");
  };

  const handleDeleteAuction = async (auction) => {
    if (!auction?._id) return;
    if (!window.confirm(`"${auction.title}" löschen?`)) return;

    await deleteAuction(auction._id);
    setMyAuctionsRaw((prev) => prev.filter((a) => a._id !== auction._id));
  };

  const handleCreateArtwork = async (auctionId, artworks) => {
    if (!auctionId || !Array.isArray(artworks) || !artworks.length) return;

    await Promise.all(
      artworks.map((aw) =>
        createArtwork({
          ...aw,
          startPrice: parseFloat(aw.startPrice),
          endPrice: parseFloat(aw.endPrice),
          price: parseFloat(aw.price || aw.startPrice),
          currency: aw.currency || "EUR",
          auctionId,
        })
      )
    );
    alert("✅ Kunstwerk(e) hinzugefügt");
  };

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
