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

    // Array von Strings / Objekten
    if (Array.isArray(c)) {
      for (const item of c) {
        if (!item) continue;
        if (typeof item === "string") {
          urls.push(item);
        } else if (typeof item === "object") {
          // gängige Felder
          const u = item.url || item.src || item.link || item.path;
          if (u) urls.push(u);
        }
      }
      continue;
    }

    // String
    if (typeof c === "string") {
      // JSON-Array im String?
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
      } catch {
        /* ignore */
      }
      // Kommagetrennt
      const parts = c
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length) {
        urls.push(...parts);
        continue;
      }
      // sonst die Roh-URL
      urls.push(c);
      continue;
    }

    // Objekt (z.B. {url:...})
    if (typeof c === "object") {
      // media/files können Arrays sein – oben schon behandelt
      const u = c.url || c.src || c.link || c.path;
      if (u) urls.push(u);
    }
  }

  // Fallback
  if (!urls.length) {
    urls.push("https://via.placeholder.com/800x600?text=Artwork");
  }

  // Deduplizieren
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

  const [bidAmount, setBidAmount] = useState("");
  const [showBidForm, setShowBidForm] = useState(false);
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
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowRight") {
        next();
      } else if (e.key === "ArrowLeft") {
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length]);

  const userBid = user
    ? offers.find(
        (offer) => offer.userId?._id === user._id || offer.userId === user._id
      )
    : null;

  const handleBidSubmit = async (e) => {
    e.preventDefault();

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
      setShowBidForm(false);
      await fetchOffers();
      onBidSuccess?.(data.offer, artwork);
      setTimeout(() => setBidSuccess(false), 2500);
    } catch (error) {
      setBidError(error.message);
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

  // ======= Mouse Zoom & Pan (Modal) =======
  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY; // hoch = Zoom in
    const factor = delta > 0 ? 1.1 : 0.9;
    setScale((s) => {
      const ns = Math.min(8, Math.max(1, s * factor));
      return ns;
    });
  };

  const onMouseDown = (e) => {
    if (scale === 1) return; // nur Pan wenn gezoomt
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
      // Pinch-Start
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchStartRef.current = { dist, scale };
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      // Pinch Zoom
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / Math.max(1, pinchStartRef.current.dist);
      const newScale = Math.min(
        8,
        Math.max(1, pinchStartRef.current.scale * ratio)
      );
      setScale(newScale);
      e.preventDefault();
      return;
    }

    // Pan mit einem Finger, wenn gezoomt
    if (e.touches.length === 1 && scale > 1) {
      const t = e.touches[0];
      const prev = touchStartRef.current || { x: t.clientX, y: t.clientY };
      const dx = t.clientX - prev.x;
      const dy = t.clientY - prev.y;
      touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
      setTranslate((tr) => ({ x: tr.x + dx, y: tr.y + dy }));
      e.preventDefault();
    }
  };

  const onTouchEnd = (e) => {
    // Swipe zum Bildwechsel nur, wenn nicht gezoomt
    if (scale === 1 && touchStartRef.current) {
      const endTime = Date.now();
      const dt = endTime - touchStartRef.current.time;
      const dx =
        (touchStartRef.current.lastX || 0) - (touchStartRef.current.x || 0);
      // Alternativ: finale Touchpositionen aus e.changedTouches nutzen
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

      // einfache Swipe-Heuristik
      if (dt < 500 && adx > 40 && adx > ady) {
        if (dx < 0) next();
        else prev();
      }
    }

    // Reset Startpunkte, Pinch-Ende
    touchStartRef.current = null;
    pinchStartRef.current = null;
  };

  // Beim Öffnen/Wechsel Bild Reset Zoom
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [open, index]);

  const isCompact = variant === "compact";

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

            {/* kurze Beschreibung nur ab md */}
            {/* {artwork.description ? (
              <p className="hidden md:block -mt-1 text-xs text-gray-300 line-clamp-1">
                {artwork.description}
              </p>
            ) : null} */}

            {/* Preiszeile */}
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-sans font-extralight text-white">
                Top bid
              </span>
              <span className="badge badge-outline font-bold text-xs sm:text-sm">
                {displayPrice.toLocaleString("de-DE")}{" "}
                {artwork.currency || "EUR"}
              </span>
            </div>
          </div>

          {/* Aktionen */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => openModalAt(0)}
              className="btn btn-outline btn-xs sm:btn-sm font-sans font-extralight rounded-2xl"
            >
              Ansehen
            </button>

            {isAuctionActive && isBuyer && !showBidForm && (
              <button
                onClick={() => {
                  if (!user) {
                    openLogin();
                    return;
                  }
                  setShowBidForm(true);
                  setBidError("");
                  setBidAmount(
                    (displayPrice + (artwork.minIncrement || 5)).toString()
                  );
                }}
                className="btn btn-primary btn-xs sm:btn-sm rounded-2xl bg-coldYellow text-darkBackground hover:bg-coldYellow/80 font-extralight"
              >
                {userBid ? "Gebot erhöhen" : "Bieten"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vollbild-Modal: Swipe, Zoom, Pan, Klick außerhalb schließt */}
      {open && (
        <div
          className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-[6px] flex items-center justify-center"
          onClick={() => setOpen(false)} // Klick außerhalb schließt
        >
          {/* Innen-Container: blockt Clicks zum Schließen ab */}
          <div
            className="relative w-screen h-screen flex items-center justify-center select-none"
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
            {/* Bild */}
            <img
              src={images[index]}
              alt={artwork.title}
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/1600x1200?text=Artwork";
              }}
              className="
                w-auto h-auto
                max-w-[100svw] max-h-[100svh]
                object-contain
                transition-transform
                ease-out
              "
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              }}
              draggable={false}
            />

            {/* Prev / Next Controls */}
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

                {/* kleines Index-Badge */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-black/60 text-white text-xs">
                  {index + 1} / {images.length}
                </div>
              </>
            )}

            {/* Close-Button */}
            <button
              onClick={() => setOpen(false)}
              className="
                absolute top-3 right-3
                inline-flex items-center justify-center
                h-10 w-10 rounded-full
                bg-black/60 hover:bg-black/80
                text-white text-xl
                transition
                focus:outline-none
              "
              aria-label="Close"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Inline-Gebotsformular */}
      {showBidForm && isAuctionActive && isBuyer && (
        <form onSubmit={handleBidSubmit} className="mt-2 space-y-2">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs">
                Gebot (min. {minBid} €)
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={minBid}
                step="0.01"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`${minBid}`}
                className="input input-bordered input-sm flex-1 text-black placeholder-black/60 bg-white"
                required
                disabled={submitting}
              />
              <span className="self-center text-xs text-gray-500">€</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-sm flex-1"
              disabled={submitting}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : userBid ? (
                "Gebot erhöhen"
              ) : (
                "Bieten"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowBidForm(false);
                setBidError("");
                setBidAmount("");
              }}
              className="btn btn-ghost btn-sm"
              disabled={submitting}
            >
              Abbrechen
            </button>
          </div>

          {/* Meldungen */}
          {bidSuccess && (
            <div className="alert alert-success alert-sm">
              <span className="text-xs">✓ Gebot erfolgreich abgegeben!</span>
            </div>
          )}
          {bidError && (
            <div className="alert alert-error alert-sm">
              <span className="text-xs">{bidError}</span>
            </div>
          )}
        </form>
      )}
    </>
  );
}
