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
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed[0];
    } catch {
      // ignore
    }
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

  // Live auctions
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

  // Set mit Live-Auktions-IDs (für Slideshow-Filter)
  const liveAuctionIdSet = useMemo(() => {
    const s = new Set();
    for (const a of liveAuctions) {
      const id = toIdStr(a?._id || a?.id);
      if (id) s.add(id);
    }
    return s;
  }, [liveAuctions]);

  // Slideshow: NUR Artworks aus laufenden Auktionen + random Reihenfolge
  // Zusätzlich _priceLabel / _priceAmount: Top bid (falls offers>0) sonst Start Price
  const slideshowItems = useMemo(() => {
    const onlyLive = normalizedArtworks.filter((a) => {
      const hasAuction =
        !!a.auctionId && liveAuctionIdSet.has(toIdStr(a.auctionId));
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

    const mapped = onlyLive.map((a) => {
      const offers = Array.isArray(a?.offers) ? a.offers : [];
      const topBid = offers.length
        ? Math.max(...offers.map((o) => Number(o?.amount || 0)))
        : null;

      const start = Number(a?.startPrice || 0);
      const priceLabel = topBid && topBid > 0 ? "Top bid" : "Start price";
      const priceAmount = topBid && topBid > 0 ? topBid : start;

      return {
        ...a,
        _priceLabel: priceLabel,
        _priceAmount: priceAmount,
      };
    });

    // randomize order
    return mapped.sort(() => Math.random() - 0.5);
  }, [normalizedArtworks, liveAuctionIdSet]);

  // 4. Latest 4 Live Auctions (unverändert — nur Anzeige unten erweitert)
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

  // Hilfszähler für Cards: Anzahl Artworks + Summe der Bids (offers.length)
  const countForAuction = useMemo(() => {
    const map = new Map(); // idStr -> {artworks: n, bids: m}
    for (const aw of normalizedArtworks) {
      const aId = toIdStr(aw.auctionId);
      if (!aId) continue;
      const prev = map.get(aId) || { artworks: 0, bids: 0 };
      prev.artworks += 1;
      if (Array.isArray(aw.offers)) {
        prev.bids += aw.offers.length;
      } else if (typeof aw.offersCount === "number") {
        prev.bids += aw.offersCount;
      }
      map.set(aId, prev);
    }
    return map;
  }, [normalizedArtworks]);

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

    // choose one artwork deterministically and get its image
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

    // fallback to auction banner if no artwork image
    const cover =
      artworkImg ||
      getFirstImageUrl(auction) ||
      auction?.bannerImageUrl ||
      auction?.banner ||
      auction?.image ||
      auction?.imageUrl ||
      auction?.coverUrl ||
      "https://via.placeholder.com/800x400?text=Auction+Banner";

    // Use helper from api.js
    const { label } = getTimeLeft(auction?.endDate);

    // Zusatz: Anzahl Artworks + Gesamtbids
    const stats = countForAuction.get(aIdStr) || { artworks: 0, bids: 0 };

    return (
      <button
        type="button"
        onClick={() => navigate(`/auction/${auction._id || auction.id}`)}
        className="group relative block w-full p-0 appearance-none shadow-md text-left overflow-hidden rounded-2xl border-2 border-black/10 hover:bg-violetHeader/ hover:shadow-lg hover:shadow-black/70 hover:border-black/70 transition-all duration-300 focus:outline-none"
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
          <h3 className="text-xl text-whiteLetter/80 font-sans font-extralight line-clamp-1">
            {auction?.title || "Ohne Titel"}
          </h3>
          {/* Zusatzinfos: Artworks + Bids */}
          <div className="text-xs text-white/70">
            {stats.artworks === 1 ? "1 artwork" : `${stats.artworks} artworks`}{" "}
            ·{" "}
            {stats.bids === 0
              ? "no bids"
              : stats.bids === 1
              ? "1 bid"
              : `${stats.bids} bids`}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
            <span>{label}</span>
            {auction?.endDate && <span>{formatDateTime(auction.endDate)}</span>}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* HERO */}
      <section className="bg-darkBackground/90 rounded-2xl border border-black text-white p-6 md:p-10 shadow-lg shadow-black/50 hover:shadow-lg hover:shadow-buttonPink/30 hover:border-r-2 hover:border-b-2">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div>
            <h1 className=" m-5  md:text-8xl text-center font-sans font-extralight">
              A stage for every artist, everywhere.
            </h1>
            <p className="m-10 text-xl font-extralight text-white/90">
              Not a gallery. Not social media. popAUC is pop-up auctions—fast,
              fair, and accessible.
            </p>
          </div>

          <div className="md:justify-self-end w-full border-1 border-black rounded-2xl shadow-lg shadow-black">
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
                No artworks or auctions found.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Live Auctions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl text-white font-sans font-extralight">
              Live auctions
            </h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
