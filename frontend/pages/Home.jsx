// frontend/pages/Home.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router";
import ArtworkSlideshow from "../components/ArtworkSlideshow.jsx";

// Import API functions
import {
  getAllArtworks,
  getAllAuctions,
  getArtworkOffers,
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
  const [offersMap, setOffersMap] = useState(new Map()); // 🆕 Map: artworkId -> offers[]
  const [isShuffled, setIsShuffled] = useState(false); // 🆕 Shuffle State
  const [shuffleKey, setShuffleKey] = useState(0); // 🆕 Für Animation Trigger
  const randomIndexMapRef = useRef(new Map());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [artsRaw, auctionsRaw] = await Promise.all([
        getAllArtworks(),
        getAllAuctions(),
      ]);
      const artworks = listFromApi(artsRaw);
      const auctions = listFromApi(auctionsRaw);

      setAllArtworks(artworks);
      setAllAuctions(auctions);

      // 🆕 Lade Gebote für alle Artworks parallel
      await loadAllOffers(artworks);

      setLoading(false);
    })();
  }, []);

  // 🆕 Funktion zum Laden aller Gebote
  const loadAllOffers = async (artworks) => {
    if (!artworks || artworks.length === 0) return;

    try {
      // Lade Gebote für alle Artworks parallel
      const offerPromises = artworks.map(async (artwork) => {
        if (!artwork._id) return null;
        try {
          const data = await getArtworkOffers(artwork._id);
          if (data.success && data.offers) {
            return {
              artworkId: toIdStr(artwork._id),
              offers: data.offers || [],
            };
          }
        } catch (error) {
          console.error(`Error fetching offers for ${artwork._id}:`, error);
        }
        return null;
      });

      const results = await Promise.all(offerPromises);

      // Erstelle Map: artworkId -> offers[]
      const newOffersMap = new Map();
      results.forEach((result) => {
        if (result) {
          newOffersMap.set(result.artworkId, result.offers);
        }
      });

      setOffersMap(newOffersMap);
    } catch (error) {
      console.error("Error loading offers:", error);
    }
  };

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

  // Set mit Live-Auktions-IDs
  const liveAuctionIdSet = useMemo(() => {
    const s = new Set();
    for (const a of liveAuctions) {
      const id = toIdStr(a?._id || a?.id);
      if (id) s.add(id);
    }
    return s;
  }, [liveAuctions]);

  // Slideshow: NUR Artworks aus laufenden Auktionen + random Reihenfolge
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
      const artworkId = toIdStr(a._id || a.id);
      const offers = offersMap.get(artworkId) || [];
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
  }, [normalizedArtworks, liveAuctionIdSet, offersMap]);

  // Latest 4 Live Auctions - sortiert nach frühestem Enddatum oder shuffled
  const latest4LiveAuctions = useMemo(() => {
    const filtered = [...liveAuctions].filter((a) => a.endDate);

    if (isShuffled) {
      // Fisher-Yates Shuffle für echte Zufälligkeit
      const shuffled = [...filtered];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.slice(0, 4);
    }

    // Standard: Nach frühestem Enddatum
    return filtered
      .sort((a, b) => {
        const timeA = new Date(a.endDate).getTime();
        const timeB = new Date(b.endDate).getTime();
        return timeA - timeB; // Aufsteigend: frühestes Enddatum zuerst
      })
      .slice(0, 4);
  }, [liveAuctions, isShuffled, shuffleKey]); // shuffleKey triggert Neuberechnung

  // Shuffle-Funktion
  const handleShuffle = () => {
    setIsShuffled(true);
    setShuffleKey((prev) => prev + 1); // Trigger re-calculation
  };

  // Reset zu Standard-Sortierung
  const handleResetSort = () => {
    setIsShuffled(false);
    setShuffleKey((prev) => prev + 1);
  };

  const handleSlideshowClick = (item) => {
    if (item?.auctionId) navigate(`/auction/${item.auctionId}`);
  };

  // 🆕 Hilfszähler für Cards: Anzahl Artworks + Summe der Bids (aus offersMap)
  const countForAuction = useMemo(() => {
    const map = new Map(); // idStr -> {artworks: n, bids: m}

    for (const aw of normalizedArtworks) {
      const aId = toIdStr(aw.auctionId);
      if (!aId) continue;

      const prev = map.get(aId) || { artworks: 0, bids: 0 };
      prev.artworks += 1;

      // 🆕 Hole Gebote aus offersMap
      const artworkId = toIdStr(aw._id || aw.id);
      const offers = offersMap.get(artworkId) || [];
      prev.bids += offers.length;

      map.set(aId, prev);
    }

    return map;
  }, [normalizedArtworks, offersMap]);

  const AuctionCard = ({ auction }) => {
    const aIdStr = useMemo(
      () => toIdStr(auction?._id || auction?.id),
      [auction]
    );

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const relatedArtworks = useMemo(() => {
      if (!aIdStr) return [];
      return normalizedArtworks.filter(
        (aw) => toIdStr(aw.auctionId) === aIdStr
      );
    }, [aIdStr]);

    // Sammle alle Bilder von allen Artworks dieser Auktion
    const allImages = useMemo(() => {
      const images = [];
      for (const artwork of relatedArtworks) {
        const img = getFirstImageUrl(artwork);
        if (img) images.push(img);
      }
      // Fallback zu Auction Banner wenn keine Artwork-Bilder
      if (images.length === 0) {
        const fallback =
          getFirstImageUrl(auction) ||
          auction?.bannerImageUrl ||
          auction?.banner ||
          auction?.image ||
          auction?.imageUrl ||
          auction?.coverUrl ||
          "https://via.placeholder.com/800x400?text=Auction+Banner";
        images.push(fallback);
      }
      return images;
    }, [relatedArtworks, auction]);

    const { label } = getTimeLeft(auction?.endDate);

    // Anzahl Artworks + Gesamtbids
    const stats = countForAuction.get(aIdStr) || { artworks: 0, bids: 0 };

    const nextImage = (e) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = (e) => {
      e.stopPropagation();
      setCurrentImageIndex(
        (prev) => (prev - 1 + allImages.length) % allImages.length
      );
    };

    return (
      <div
        onClick={() => navigate(`/auction/${auction._id || auction.id}`)}
        className="group relative hover:scale-[1.03] block w-full p-0 shadow-md text-left overflow-hidden rounded-2xl border-2 border-black/10 hover:bg-violetHeader/ hover:shadow-lg hover:shadow-black/70 hover:border-black/70 transition-all duration-300 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/auction/${auction._id || auction.id}`);
          }
        }}
        aria-label={`Zur Auktion: ${auction?.title || "Ohne Titel"}`}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {/* Bild-Container mit Transition */}
          <div className="relative w-full h-full">
            <img
              src={allImages[currentImageIndex]}
              alt={auction?.title || "Auction banner"}
              className="absolute inset-0 w-full h-full object-cover block transition-opacity duration-300"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/800x400?text=Auction+Banner";
              }}
            />
          </div>

          {/* Navigation Pfeile - nur wenn mehr als 1 Bild */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 z-10 shadow-lg"
                aria-label="Vorheriges Bild"
                type="button"
              >
                ‹
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 z-10 shadow-lg"
                aria-label="Nächstes Bild"
                type="button"
              >
                ›
              </button>

              {/* Bild-Indikator Dots - IMMER sichtbar */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      idx === currentImageIndex
                        ? "bg-white w-5 scale-110"
                        : "bg-white/60 hover:bg-white/90 hover:scale-110"
                    }`}
                    aria-label={`Bild ${idx + 1}`}
                    type="button"
                  />
                ))}
              </div>

              {/* Bilder-Counter Badge - NEU */}
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {currentImageIndex + 1}/{allImages.length}
              </div>
            </>
          )}

          {/* Status Badge */}
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
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* HERO */}
      <section className="bg-darkBackground/90 rounded-2xl border border-black text-white p-6 md:p-10 shadow-lg shadow-black/50 hover:shadow-lg hover:shadow-buttonPink/30 hover:border-r-2 hover:border-b-2">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div>
            <h1 className=" m-10 ml-15 text-4xl md:text-6xl gap-2 text-justify  font-sans font-thin text-whiteLetter/90">
              YOUR ARTWORK. <br /> YOUR MOMENT. <br /> KEEP IT SIMPLE.
            </h1>
            <p className="m-10 text-2xl font-sans text-justify  font-thin text-whiteLetter/90">
              Start a one-time pop-up auction and promote it where your
              community lives.
            </p>
          </div>

          <div className="md:justify-self-end w-full border-1 border-darkBackground rounded-2xl shadow-lg shadow-black">
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
              {liveAuctions.length} live · {allAuctions.length} gesamt ·
              {isShuffled ? " random order" : " ending soon first"}
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {latest4LiveAuctions.map((a) => (
                <AuctionCard key={a._id || a.id || Math.random()} auction={a} />
              ))}
            </div>

            {/* Shuffle Button Section */}
            {liveAuctions.length > 4 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleShuffle}
                    disabled={loading}
                    className="group relative px-3 py-2 rounded-2xl btn btn-sm bg-buttonPink/60 text-whiteLetter/80 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Random auction</span>
                  </button>

                  {isShuffled && (
                    <button
                      onClick={handleResetSort}
                      className="px-2 py-1 rounded-2xl btn btn-sm bg-white/10 hover:bg-white/20 text-white text-sm font-light border border-white/20 hover:border-white/40 transition-all duration-300 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Show ending soon
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-600">Zurzeit keine Live-Auktionen.</p>
        )}
      </section>
    </div>
  );
};

export default Home;
