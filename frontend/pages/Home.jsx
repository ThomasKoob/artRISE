// frontend/pages/Home.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router";
import ArtworkSlideshow from "../components/ArtworkSlideshow.jsx";

// Import API functions
import {
  getAllArtworks,
  getAllAuctions,
  listFromApi,
  formatDateTime,
  getTimeLeft,
  getStatusBadgeClass,
} from "../api/api";

// Extract a usable image URL from various shapes (array, string, JSON, comma, nested)
const getFirstImageUrl = (obj) => {
  if (!obj) return null;
  const raw =
    obj.images ??
    obj.photos ??
    obj.image ??
    obj.imageUrl ??
    obj.coverUrl ??
    obj.bannerImageUrl ??
    obj.photo ??
    obj.picture ??
    // common nested shapes
    obj.media?.[0]?.url ??
    obj.files?.[0]?.url ??
    null;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] || null;
  if (typeof raw === "string") {
    // try JSON array in string
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed[0];
    } catch {
      // ignore
    }
    // try comma-separated list
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return parts[0] || raw;
  }
  return null;
};

// Normalize any id (ObjectId/object/string) to a stable comparable string
const toIdStr = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object")
    return String(v._id || v.id || v.$oid || JSON.stringify(v));
  return String(v);
};

const Home = () => {
  const navigate = useNavigate();

  const [allArtworks, setAllArtworks] = useState([]);
  const [allAuctions, setAllAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const randomIndexMapRef = useRef(new Map());

  useEffect(() => {
    (async () => {
      setLoading(true);
      // ✅ Use API functions instead of direct fetch
      const [artsRaw, auctionsRaw] = await Promise.all([
        getAllArtworks(),
        getAllAuctions(),
      ]);
      setAllArtworks(listFromApi(artsRaw));
      setAllAuctions(listFromApi(auctionsRaw));
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
      return { ...a, auctionId: toIdStr(fallbackAid) };
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

  // 4. Latest 4 Live Auctions
  const latest4LiveAuctions = useMemo(() => {
    const toTime = (x) => {
      const c = x?.createdAt ? new Date(x.createdAt).getTime() : 0;
      const e = x?.endDate ? new Date(x.endDate).getTime() : 0;
      return Math.max(c, e);
    };
    return [...liveAuctions].sort((a, b) => toTime(b) - toTime(a)).slice(0, 4);
  }, [liveAuctions]);

  const handleSlideshowClick = (item) => {
    if (item?.auctionId) navigate(`/auction/${item.auctionId}`);
  };

  const AuctionCard = ({ auction }) => {
    const aIdStr = useMemo(
      () => toIdStr(auction?._id || auction?.id),
      [auction]
    );

    const relatedArtworks = useMemo(() => {
      if (!aIdStr) return [];
      return normalizedArtworks.filter(
        (aw) => toIdStr(aw.auctionId) === aIdStr
      );
    }, [aIdStr, normalizedArtworks]);

    // 2) choose one artwork deterministically and get its image
    let chosenArtwork = null;
    const map = randomIndexMapRef.current;
    if (relatedArtworks.length) {
      if (!map.has(aIdStr)) {
        const baseIdx = Math.floor(Math.random() * relatedArtworks.length);
        map.set(aIdStr, baseIdx);
      }
      const baseIdx = map.get(aIdStr);

      const idx = baseIdx % relatedArtworks.length;
      chosenArtwork = relatedArtworks[idx];
    }
    const artworkImg = getFirstImageUrl(chosenArtwork);

    // 3) fallback to auction banner if no artwork image
    const cover =
      artworkImg ||
      getFirstImageUrl(auction) ||
      auction?.bannerImageUrl ||
      auction?.banner ||
      auction?.image ||
      auction?.imageUrl ||
      auction?.coverUrl ||
      "https://via.placeholder.com/800x400?text=Auction+Banner";

    //  Use helper from api.js
    const { label } = getTimeLeft(auction?.endDate);

    return (
      <button
        type="button"
        onClick={() => navigate(`/auction/${auction._id || auction.id}`)}
        className="group relative block w-full p-0 appearance-none text-left overflow-hidden rounded-2xl border-2 border-black/10 bg-whiteWarm/50 shadow-sm hover:shadow-xl hover:border-black/70 transition-all duration-300 focus:outline-none"
        title="Zur Auktion"
      >
        <div className="relative aspect-[16/9] w-full">
          <img
            src={cover}
            alt={auction?.title || "Auction banner"}
            className="absolute inset-0 w-full h-full object-cover block"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/800x400?text=Auction+Banner";
            }}
          />
          <span
            className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
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
            {/* Use helper from api.js */}
            {auction?.endDate && <span>{formatDateTime(auction.endDate)}</span>}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* HERO */}
      <section className=" bg-darkBackground/90 rounded-2xl border-2 border-black text-white p-8 md:p-10 shadow-lg">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div>
            <h1 className=" m-5  md:text-8xl text-center font-sans font-extralight">
              A stage for every artist, everywhere.
            </h1>
            <p className="m-10 text-xl font-extralight text-white/90">
              On artRise, creativity has no boundaries. From first steps to
              established work – upload your art, start your auction, and share
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
                Keine Kunstwerke verfügbar oder keine zugehörige Auktion
                gefunden.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Live Auctions */}
      <section className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl text-white font-bold">Live Auktionen</h2>
            <p className="text-sm text-gray-300">
              {liveAuctions.length} live · {allAuctions.length} gesamt
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-56 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : latest4LiveAuctions.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {latest4LiveAuctions.map((a) => (
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
