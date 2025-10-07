// frontend/components/ArtworkCard.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useLoginModal } from "../context/LoginModalContext.jsx";
import { getArtworkOffers, createOffer } from "../api/api";

/** Alle Bild-URLs aus einem Artwork robust extrahieren */
function getImageList(aw) {
  if (!aw) return [];
  const candidates = [
    aw.images,
    aw.photos,
    aw.image,
    aw.imageUrl,
    aw.coverUrl,
    aw.bannerImageUrl,
    aw.photo,
    aw.picture,
    aw.media,
    aw.files,
  ];

  const urls = [];
  for (const c of candidates) {
    if (!c) continue;

    if (Array.isArray(c)) {
      for (const item of c) {
        if (!item) continue;
        if (typeof item === "string") urls.push(item);
        else if (typeof item === "object") {
          const u = item.url || item.src || item.link || item.path;
          if (u) urls.push(u);
        }
      }
      continue;
    }

    if (typeof c === "string") {
      try {
        const parsed = JSON.parse(c);
        if (Array.isArray(parsed)) {
          for (const v of parsed) {
            if (typeof v === "string") urls.push(v);
            else if (v && typeof v === "object" && (v.url || v.src)) {
              urls.push(v.url || v.src);
            }
          }
          continue;
        }
      } catch {}
      const parts = c
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length) {
        urls.push(...parts);
        continue;
      }
      urls.push(c);
      continue;
    }

    if (typeof c === "object") {
      const u = c.url || c.src || c.link || c.path;
      if (u) urls.push(u);
    }
  }

  if (!urls.length)
    urls.push("https://via.placeholder.com/800x600?text=Artwork");
  return Array.from(new Set(urls));
}

export default function ArtworkCard({
  artwork: initialArtwork,
  onBidSuccess,
  variant = "default",
}) {
  const [artwork, setArtwork] = useState(initialArtwork);
  const [offers, setOffers] = useState([]);
  const [open, setOpen] = useState(false);

  // Galerie-State
  const images = useMemo(() => getImageList(artwork), [artwork]);
  const [index, setIndex] = useState(0);

  // Zoom & Pan State (nur im Modal)
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);

  // Touch / Swipe / Pinch
  const touchStartRef = useRef(null);
  const pinchStartRef = useRef(null);

  // 🔁 Gebots-Flow (Modal + Bestätigung)
  const [bidAmount, setBidAmount] = useState("");
  const [showBidModal, setShowBidModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [bidError, setBidError] = useState("");
  const [loadingOffers, setLoadingOffers] = useState(false);

  const { user, openLogin } = useLoginModal();
  const isBuyer = !!user && user.role === "buyer";

  const currentPrice = artwork.price || artwork.startPrice || 0;
  const highestBid = offers.length > 0 ? offers[0].amount : 0;
  const displayPrice = Math.max(currentPrice, highestBid);
  const minBid = displayPrice + (artwork.minIncrement || 5);

  //  NEU: Anzeige-Helfer
  const startPrice = artwork?.startPrice ?? 0;
  const topBidAmount = offers.length > 0 ? offers[0].amount : null;
  const bidsCount = offers.length;

  //  NEU: Artist & Auktionsbeschreibung (rein für Anzeige)
  const artistName =
    artwork?.artistName ||
    artwork?.artist?.name ||
    artwork?.artistId?.name ||
    artwork?.artist ||
    "";
  const artworkDescription = artwork?.description || "";

  const auctionDescription =
    artwork?.auction?.description ||
    artwork?.artistId?.description ||
    artwork?.artistDescription ||
    artwork?.auctionDescription ||
    artwork?.auctionDesc ||
    "";

  // Gebote laden
  const fetchOffers = async () => {
    if (!artwork._id) return;
    setLoadingOffers(true);
    try {
      const data = await getArtworkOffers(artwork._id);
      if (data.success) {
        const sorted = [...(data.offers || [])].sort(
          (a, b) => (b.amount || 0) - (a.amount || 0)
        );
        setOffers(sorted);
        if (data.stats?.highestBid > 0) {
          setArtwork((prev) => ({ ...prev, price: data.stats.highestBid }));
        }
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artwork._id]);

  // Body-Scroll sperren, solange das Vollbild-Modal offen ist
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Tastatursteuerung im Modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length]);

  const userBid = user
    ? offers.find(
        (offer) => offer.userId?._id === user._id || offer.userId === user._id
      )
    : null;

  // nur noch aus Confirm-Modal
  const handleSubmitBid = async () => {
    if (!user) {
      openLogin();
      return;
    }
    if (!isBuyer) {
      setBidError("Nur Käufer dürfen bieten.");
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minBid) {
      setBidError(`Gebot muss mindestens ${minBid} € betragen`);
      return;
    }

    setSubmitting(true);
    setBidError("");

    try {
      const data = await createOffer({
        artworkId: artwork._id,
        userId: user._id,
        amount,
      });

      setBidSuccess(true);
      setBidAmount("");
      setShowConfirmModal(false);
      setShowBidModal(false);
      await fetchOffers();
      onBidSuccess?.(data.offer, artwork);
      setTimeout(() => setBidSuccess(false), 2500);
    } catch (error) {
      setBidError(error.message || "Gebot fehlgeschlagen");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
        return "badge-success";
      case "draft":
        return "badge-warning";
      case "ended":
        return "badge-error";
      case "canceled":
        return "badge-neutral";
      default:
        return "badge-outline";
    }
  };

  const isAuctionActive = artwork.status === "live";
  const isAuctionEnded =
    artwork.status === "ended" || artwork.status === "canceled";

  const openModalAt = (i = 0) => {
    setIndex(i);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setOpen(true);
  };

  const prev = () =>
    setIndex((i) => (i - 1 + images.length) % Math.max(images.length, 1));
  const next = () => setIndex((i) => (i + 1) % Math.max(images.length, 1));

  // ======= Mouse Zoom & Pan (Bild-Modal) =======
  const onWheel = (e) => {
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.1 : 0.9;
    setScale((s) => Math.min(8, Math.max(1, s * factor)));
  };

  const onMouseDown = (e) => {
    if (scale === 1) return;
    isPanningRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
  };
  const onMouseUp = () => {
    isPanningRef.current = false;
  };

  // ======= Touch: Swipe / Pinch / Pan =======
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    } else if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchStartRef.current = { dist, scale };
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / Math.max(1, pinchStartRef.current.dist);
      const newScale = Math.min(
        8,
        Math.max(1, pinchStartRef.current.scale * ratio)
      );
      setScale(newScale);
      return;
    }

    if (e.touches.length === 1 && scale > 1) {
      const t = e.touches[0];
      const prev = touchStartRef.current || { x: t.clientX, y: t.clientY };
      const dx = t.clientX - prev.x;
      const dy = t.clientY - prev.y;
      touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
      setTranslate((tr) => ({ x: tr.x + dx, y: tr.y + dy }));
    }
  };

  const onTouchEnd = (e) => {
    if (scale === 1 && touchStartRef.current) {
      const endTime = Date.now();
      const dt = endTime - touchStartRef.current.time;
      const dx =
        (touchStartRef.current.lastX || 0) - (touchStartRef.current.x || 0);
    }

    if (
      scale === 1 &&
      e.changedTouches &&
      e.changedTouches[0] &&
      touchStartRef.current
    ) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - touchStartRef.current.x;
      const dy = endY - touchStartRef.current.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      const dt = Date.now() - touchStartRef.current.time;
      if (dt < 500 && adx > 40 && adx > ady) {
        if (dx < 0) next();
        else prev();
      }
    }
    touchStartRef.current = null;
    pinchStartRef.current = null;
  };

  // Beim Öffnen/Wechsel Bild Reset Zoom
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [open, index]);

  const isCompact = variant === "compact";

  // =========================
  // ✅ NEU: Intent-Flow-Helfer
  // =========================
  const startBidFlow = () => {
    setBidError("");
    setBidAmount((displayPrice + (artwork.minIncrement || 5)).toString());
    setShowBidModal(true);
  };

  const triggerBidFlow = () => {
    if (!isAuctionActive) return;

    if (!user) {
      openLogin({
        // 👉 WICHTIG: auf der aktuellen Seite bleiben
        redirectTo:
          (typeof window !== "undefined" && window.location?.pathname) || "/",
        afterLogin: (loggedInUser) => {
          if (loggedInUser?.role !== "buyer") {
            setBidError("Nur Käufer dürfen bieten.");
            return;
          }
          startBidFlow();
        },
      });
      return;
    }

    if (!isBuyer) {
      setBidError("Nur Käufer dürfen bieten.");
      return;
    }

    startBidFlow();
  };

  return (
    <>
      {/* CARD — volle Breite; Bild 75% Höhe, Info 25% */}
      <div
        className="
          w-full
          h-[22rem] sm:h-[24rem] md:h-[26rem]
          grid grid-rows-[3fr_1fr]
          rounded-2xl overflow-hidden
          bg-black/30 shadow-md
        "
      >
        {/* Bildbereich (75%) – Klick öffnet Modal */}
        <button
          type="button"
          className="relative w-full overflow-hidden block"
          onClick={() => openModalAt(0)}
          title="Bild in Vollbild öffnen"
        >
          <img
            src={
              images[0] || "https://via.placeholder.com/800x600?text=Artwork"
            }
            alt={artwork.title}
            className="absolute inset-0 w-full h-full object-cover object-center select-none"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/800x600?text=Artwork";
            }}
            draggable={false}
          />
        </button>

        {/* Info/Buttons (25%) — nur dünner Divider oben */}
        <div className="p-3 sm:p-4 flex flex-col justify-between border-t border-white/10">
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-extralight font-sans flex items-center gap-2">
              {artwork.title}
              <span
                className={`badge ${getStatusColor(
                  artwork.status
                )} hidden sm:inline-flex`}
              >
                {artwork.status}
              </span>
            </h2>

            {/*  NEU: Artist + Auktionsbeschreibung */}
            {(artistName || artworkDescription) && (
              <div className="mt-0.5">
                {artistName && (
                  <div className="text-[11px] sm:text-xs text-white/80 font-sans">
                    {artistName}
                  </div>
                )}

                {(artistName || artworkDescription) && (
                  <p className="text-[11px] sm:text-xs text-white/60 line-clamp-2">
                    {artworkDescription}
                  </p>
                )}
              </div>
            )}

            {/* Preise */}
            <div className="mt-2 space-y-1">
              {/*  NEU: Startpreis immer zeigen */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-sans font-extralight text-white/80">
                  Start price
                </span>
                <span className="badge badge-ghost  font-bold text-xs sm:text-sm">
                  {Number(startPrice || 0).toLocaleString("de-DE")}{" "}
                  {artwork.currency || "EUR"}
                </span>
              </div>

              {/* Top bid: nur echte Gebote, sonst „—“ */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-sans font-extralight text-white">
                  Top bid
                </span>
                <span className="badge badge-outline  text-xs badge-ghost  sm:text-sm">
                  {topBidAmount != null
                    ? `${topBidAmount.toLocaleString("de-DE")} ${
                        artwork.currency || "EUR"
                      }`
                    : "—"}
                </span>
              </div>

              {/*  NEU: Anzahl Gebote als Fußnote */}
              <div className="text-[10px] sm:text-[11px] text-white/50 mt-0.5">
                {bidsCount === 0
                  ? "No bids yet"
                  : bidsCount === 1
                  ? "1 bid"
                  : `${bidsCount} bids`}
              </div>
            </div>
          </div>

          {/* Aktionen */}
          <div className="flex mt-2 items-center justify-end gap-2">
            <button
              onClick={() => openModalAt(0)}
              className="btn btn-xs sm:btn-sm rounded-2xl bg-pink-50 text-pink-500 border border-pink-300 hover:bg-pink-400 hover:border-pink-400 hover:shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
            >
              View
            </button>

            {isAuctionActive && (
              <button
                onClick={triggerBidFlow}
                className="btn btn-primary font-medium btn-xs sm:btn-sm rounded-2xl bg-coldYellow text-darkBackground hover:bg-coldYellow/80"
              >
                {user && userBid ? "Raise bid" : "Bid"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vollbild-Modal: Swipe, Zoom, Pan */}
      {open && (
        <div
          className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-[6px] flex items-center justify-center overscroll-contain"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-screen h-screen flex items-center justify-center select-none touch-none"
            onClick={(e) => e.stopPropagation()}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={images[index]}
              alt={artwork.title}
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/1600x1200?text=Artwork";
              }}
              className="w-auto h-auto max-w-[100svw] max-h-[100svh] object-contain transition-transform ease-out"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              }}
              draggable={false}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/50 hover:bg-black/70 text-white text-xl md:text-2xl flex items-center justify-center"
                  aria-label="Vorheriges Bild"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/50 hover:bg-black/70 text-white text-xl md:text-2xl flex items-center justify-center"
                  aria-label="Nächstes Bild"
                >
                  ›
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-black/60 text-white text-xs">
                  {index + 1} / {images.length}
                </div>
              </>
            )}

            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 inline-flex items-center justify-center h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white text-xl transition focus:outline-none"
              aria-label="Close"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Eingabe-Modal */}
      {showBidModal && (
        <div
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setShowBidModal(false)}
        >
          <div
            className="relative w-full sm:max-w-sm mx-2 sm:mx-0 rounded-2xl border border-black/20 bg-darkBackground/50 text-white p-4 shadow-xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-sans font-light mb-3">New bid</h3>

            <div className="text-sm text-white/70 mb-3">
              Current bid:{" "}
              <span className="text-white font-medium">
                {displayPrice.toLocaleString("de-DE")}{" "}
                {artwork.currency || "EUR"}
              </span>
              <span className="opacity-70">
                {" "}
                · Minimum bid: {minBid.toLocaleString("de-DE")}{" "}
                {artwork.currency || "EUR"}
              </span>
            </div>

            <label className="text-xl opacity-80 mb-1 block">Bid amount</label>
            <input
              type="number"
              min={minBid}
              step="5.0"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`${minBid}`}
              className="input input-bordered w-full rounded-xl bg-white text-black placeholder-black/60 focus:bg-white"
              autoFocus
            />

            {bidError && (
              <div className="alert alert-error mt-3 py-2">
                <span className="text-xl">{bidError}</span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm rounded-xl text-white/80 hover:text-white"
                onClick={() => setShowBidModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    openLogin();
                    return;
                  }
                  if (!isBuyer) {
                    setBidError("Nur Käufer dürfen bieten.");
                    return;
                  }
                  const amount = parseFloat(bidAmount);
                  if (isNaN(amount) || amount < minBid) {
                    setBidError(`Gebot muss mindestens ${minBid} € betragen`);
                    return;
                  }
                  setBidError("");
                  setShowBidModal(false);
                  setShowConfirmModal(true);
                }}
                className="btn btn-sm rounded-2xl bg-hellPink text-gruenOlive hover:bg-buttonPink hover:text-darkBackground shadow"
              >
                Confirm bid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bestätigungs-Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[1001] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="relative w-full sm:max-w-sm mx-2 sm:mx-0 rounded-2xl block border border-black/20 bg-darkBackground/50 text-white p-4 shadow-xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-sans font-extrabold">Place bid?</h3>
            <p className="text-sm font-bold opacity-90 mt-2">
              You’re placing a bid of{" "}
              <span className="font-medium text-white">
                {parseFloat(bidAmount || 0).toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {artwork.currency || "EUR"}
              </span>{" "}
              on <span className="font-extralight">{artwork.title}</span>. Are
              you sure?
              <p className="font-extralight">
                {" "}
                Bids are binding. You´ll be charged if you win.
              </p>
            </p>

            {bidError && (
              <div className="alert alert-error mt-3 py-2">
                <span className="text-xs">{bidError}</span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm rounded-xl text-white/80 hover:text-white"
                onClick={() => {
                  setShowConfirmModal(false);
                  setShowBidModal(true);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitBid}
                disabled={submitting}
                className="btn btn-sm rounded-2xl bg-hellPink text-gruenOlive hover:bg-buttonPink hover:text-darkBackground shadow disabled:opacity-60"
              >
                {submitting ? "Sende…" : "Bieten"}
              </button>
            </div>
          </div>
        </div>
      )}

      {bidSuccess && (
        <div className="mt-2">
          <div className="alert alert-success alert-sm">
            <span className="text-xs">✓ A new bid has been placed!</span>
          </div>
        </div>
      )}
    </>
  );
}
