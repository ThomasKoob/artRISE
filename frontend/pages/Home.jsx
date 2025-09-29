// pages/Home.jsx
// DE: Startseite – UI auf Englisch + "View"-Button auf jeder Auktionskarte.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router";
import ArtworkSlideshow from "../components/ArtworkSlideshow.jsx";
import { useLoginModal } from "../context/LoginModalContext.jsx";

const API_BASE = "http://localhost:3001";

// --- FAVORITES (Auktionen) lokal ---
const LS_AUCTION_FAV_KEY = "ar_favorites_auctions";
function readFavAuctions() {
  try {
    const raw = localStorage.getItem(LS_AUCTION_FAV_KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function writeFavAuctions(arr) {
  try {
    localStorage.setItem(LS_AUCTION_FAV_KEY, JSON.stringify(arr));
  } catch {}
}
function isFavAuction(id) {
  const ids = readFavAuctions();
  return ids.includes(id);
}
function toggleFavAuction(id) {
  const ids = readFavAuctions();
  const has = ids.includes(id);
  const next = has ? ids.filter((x) => x !== id) : [...ids, id];
  writeFavAuctions(next);
  return !has;
}

// DE: Hilfsfunktionen
const smartList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.data)) return payload.data;
  for (const k of Object.keys(payload)) {
    if (Array.isArray(payload[k])) return payload[k];
  }
  return [];
};
const fetchJson = async (url, opts) => {
  try {
    const r = await fetch(url, { credentials: "include", ...(opts || {}) });
    const j = await r.json().catch(() => ({}));
    return j;
  } catch {
    return {};
  }
};
const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB");
};
const getTimeLeft = (endDate) => {
  if (!endDate) return { label: "—", ended: false };
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return { label: "Ended", ended: true };
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / (60 * 24));
  const hours = Math.floor((mins % (60 * 24)) / 60);
  const minutes = mins % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return { label: `Ends in ${parts.join(" ")}`, ended: false };
};
const statusPill = (status = "draft") => {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "live":
    case "active":
    case "open":
      return "bg-green-100 text-green-800";
    case "upcoming":
      return "bg-blue-100 text-blue-800";
    case "ended":
    case "closed":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useLoginModal();
  const isBuyer = !!user && user.role === "buyer";

  const [allArtworks, setAllArtworks] = useState([]);
  const [allAuctions, setAllAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [artsRaw, auctionsRaw] = await Promise.all([
        fetchJson(`${API_BASE}/api/artworks`),
        fetchJson(`${API_BASE}/api/auctions`),
      ]);
      setAllArtworks(smartList(artsRaw));
      setAllAuctions(smartList(auctionsRaw));
      setLoading(false);
    })();
  }, []);

  const normalizedArtworks = useMemo(() => {
    return allArtworks.map((a) => {
      const aid =
        a?.auctionId ||
        a?.auction?.id ||
        a?.auction?._id ||
        a?.auctionId?._id ||
        a?.auctionID ||
        null;
      let fallbackAid = aid;
      if (!fallbackAid && a?.auction && typeof a.auction === "object") {
        const maybe = a.auction._id || a.auction.id;
        if (maybe) fallbackAid = maybe;
      }
      return { ...a, auctionId: fallbackAid };
    });
  }, [allArtworks]);

  const slideshowItems = useMemo(() => {
    return normalizedArtworks.filter((a) => {
      const hasAuction = !!a.auctionId;
      const hasAnyImage =
        !!a.images ||
        !!a.image ||
        !!a.imageUrl ||
        !!a.photo ||
        !!a.picture ||
        (Array.isArray(a.photos) && a.photos.length > 0) ||
        !!a.coverUrl ||
        !!a.bannerImageUrl;
      return hasAuction && hasAnyImage;
    });
  }, [normalizedArtworks]);

  const liveAuctions = useMemo(() => {
    const now = Date.now();
    const liveNames = new Set(["live", "active", "open"]);
    return allAuctions.filter((a) => {
      const s = String(a?.status || "").toLowerCase();
      if (liveNames.has(s)) return true;
      if (a?.endDate) {
        return new Date(a.endDate).getTime() > now && s !== "ended" && s !== "closed";
      }
      return false;
    });
  }, [allAuctions]);

  const handleSlideshowClick = (item) => {
    if (item?.auctionId) navigate(`/auction/${item.auctionId}`);
  };

  // DE: Karte für einzelne Auktion mit "View"-Button unten
  const AuctionCard = ({ auction }) => {
    const cover =
      auction?.bannerImageUrl ||
      auction?.banner ||
      auction?.image ||
      auction?.imageUrl ||
      auction?.coverUrl ||
      "https://via.placeholder.com/800x400?text=Auction+Banner";
    const { label } = getTimeLeft(auction?.endDate);

    // DE: Favorit-Status (nur Buyer)
    const [favA, setFavA] = React.useState(() =>
      isFavAuction(auction._id || auction.id)
    );
    const [favBusy, setFavBusy] = React.useState(false);
    const toggleA = async (e) => {
      e.stopPropagation();
      if (!isBuyer) return;
      try {
        setFavBusy(true);
        const now = toggleFavAuction(auction._id || auction.id);
        setFavA(now);
      } finally {
        setFavBusy(false);
      }
    };

    return (
      <div className="relative text-left border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300">
        {/* DE: Favoriten-Herz */}
        {isBuyer && (
          <span className="absolute top-2 right-2 z-10">
            <button
              onClick={toggleA}
              disabled={favBusy}
              className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center"
              title={favA ? "Remove from favorites" : "Add to favorites"}
            >
              <span className={`text-xl ${favA ? "text-rose-600" : "text-gray-700"}`}>
                {favA ? "♥" : "♡"}
              </span>
            </button>
          </span>
        )}

        {/* DE: Bild + Status */}
        <div className="relative">
          <img
            src={cover}
            alt={auction?.title || "Auction banner"}
            className="w-full h-40 object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/800x400?text=Auction+Banner";
            }}
          />
          <span
            className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${statusPill(
              auction?.status
            )}`}
          >
            {auction?.status || "draft"}
          </span>
        </div>

        {/* DE: Text */}
        <div className="p-4 space-y-1">
          <h3 className="text-lg font-semibold text-black line-clamp-1">
            {auction?.title || "Untitled"}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {auction?.description || "—"}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
            <span>{label}</span>
            {auction?.endDate && <span>{formatDateTime(auction.endDate)}</span>}
          </div>
        </div>

        {/* DE: Footer mit View-Button */}
        <div className="p-4 pt-0">
          <Link
            to={`/auction/${auction._id || auction.id}`}
            className="btn btn-sm btn-outline w-full"
            title="View auction"
          >
            View
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* HERO */}
      <section className="bg-darkBackground/90 rounded-2xl border-2 border-coldYellow text-white p-8 md:p-10 shadow-lg">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div>
            <h1 className="m-5 md:text-8xl text-center font-sans font-extralight">
              A stage for every artist, everywhere.
            </h1>
            <p className="m-10 text-xl font-extralight text-white/90">
              On artRise, creativity has no boundaries. From first steps to
              established work — upload your art, start your auction, and share
              it with the world.
            </p>
          </div>

          <div className="md:justify-self-end w-full">
            {loading ? (
              <div className="h-40 md:h-48 rounded-xl bg-white/20 animate-pulse" />
            ) : slideshowItems.length ? (
              <ArtworkSlideshow
                items={slideshowItems}
                onItemClick={handleSlideshowClick}
                variant="compact"
                className="w-full max-w-xl ml-auto"
              />
            ) : (
              <div className="text-white/80">
                No artworks available or no related auction found.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Live Auctions */}
      <section className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Live Auctions</h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : liveAuctions.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {liveAuctions.map((a) => (
              <AuctionCard key={a._id || a.id || Math.random()} auction={a} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No live auctions at the moment.</p>
        )}
      </section>
    </div>
  );
};

export default Home;
