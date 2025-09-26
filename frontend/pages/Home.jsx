import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ArtworkSlideshow from "../components/ArtworkSlideshow.jsx";
const API_BASE = "http://localhost:3001";
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
  return d.toLocaleString("de-DE");
};
const getTimeLeft = (endDate) => {
  if (!endDate) return { label: "—", ended: false };
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return { label: "Beendet", ended: true };
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / (60 * 24));
  const hours = Math.floor((mins % (60 * 24)) / 60);
  const minutes = mins % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return { label: `Noch ${parts.join(" ")}`, ended: false };
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
      const artworks = smartList(artsRaw);
      const auctions = smartList(auctionsRaw);
      // Debug
      console.debug("[Home] artworks raw:", artworks);
      console.debug("[Home] auctions raw:", auctions);
      setAllArtworks(artworks);
      setAllAuctions(auctions);
      setLoading(false);
    })();
  }, []);
  const auctionById = useMemo(() => {
    const m = new Map();
    for (const a of allAuctions) {
      const id = a?._id || a?.id;
      if (id) m.set(id, a);
    }
    return m;
  }, [allAuctions]);
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
      return {
        ...a,
        auctionId: fallbackAid,
      };
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
    const result = allAuctions.filter((a) => {
      const s = String(a?.status || "").toLowerCase();
      if (liveNames.has(s)) return true;
      if (a?.endDate) {
        return (
          new Date(a.endDate).getTime() > now && s !== "ended" && s !== "closed"
        );
      }
      return false;
    });
    return result;
  }, [allAuctions]);
  const handleSlideshowClick = (item) => {
    if (item?.auctionId) navigate(`/auction/${item.auctionId}`);
  };
  const AuctionCard = ({ auction }) => {
    const cover =
      auction?.bannerImageUrl ||
      auction?.banner ||
      auction?.image ||
      auction?.imageUrl ||
      auction?.coverUrl ||
      "https://via.placeholder.com/800x400?text=Auction+Banner";
    const { label } = getTimeLeft(auction?.endDate);
    return (
      <button
        type="button"
        onClick={() => navigate(`/auction/${auction._id || auction.id}`)}
        className="text-left border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300"
        title="Zur Auktion"
      >
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
            className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusPill(
              auction?.status
            )}`}
          >
            {auction?.status || "draft"}
          </span>
        </div>
        <div className="p-4 space-y-1">
          <h3 className="text-lg font-semibold text-black line-clamp-1">
            {auction?.title || "Ohne Titel"}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {auction?.description || "—"}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
            <span>{label}</span>
            {auction?.endDate && <span>{formatDateTime(auction.endDate)}</span>}
          </div>
        </div>
      </button>
    );
  };
  return (
       <div className="mx-auto px-6 py-10 space-y-10">
      {/* HERO with compact slideshow */}
      <section className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-8 md:p-10 shadow-lg">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6 md:gap-10 items-center">
          {/* Text side */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Willkommen bei Art Auctions
            </h1>
            <p className="mt-2 text-white/90">
              Entdecke einzigartige Kunstwerke &amp; nimm an Live-Auktionen teil.
            </p>
          </div>

          {/* Compact slideshow side */}
          <div className="md:justify-self-end w-full">
            {loading ? (
              <div className="h-40 md:h-48 rounded-xl bg-white/20 animate-pulse" />
            ) : slideshowItems.length ? (
              <ArtworkSlideshow
                items={slideshowItems}
                onItemClick={handleSlideshowClick}
                variant="compact"         // <— see component below
                className="w-full max-w-xl ml-auto"
              />
            ) : (
              <div className="text-white/80">
                Keine Kunstwerke verfügbar oder keine zugehörige Auktion gefunden.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* “Entdecke Kunstwerke” (optional small strip under hero) */}
      <section className="my-2">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-2xl font-bold">Entdecke Kunstwerke</h2>
          <span className="text-xs text-gray-500">
            (artworks: {allArtworks.length} | slideshow: {slideshowItems.length})
          </span>
        </div>
       

      {/* Live Auctions */}
      <section className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Live Auktionen</h2>
            <span className="text-xs text-gray-500">
              (auctions: {allAuctions.length} | live: {liveAuctions.length})
            </span>
          </div>
          <button
            className="text-indigo-600 hover:underline"
            onClick={() => navigate("/auctions")}
          >
            Alle ansehen
          </button>
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
          <p className="text-gray-600">Zurzeit keine Live-Auktionen.</p>
        )}
      </section>
    </div>
  );
};

export default Home;