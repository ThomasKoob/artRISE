import { useEffect, useMemo, useRef, useState } from "react";
function getImageUrl(item) {
  if (!item) return null;
  const cand = [
    item.images,
    item.image,
    item.imageUrl,
    item.photo,
    item.picture,
    item.photos && item.photos[0],
    item.coverUrl,
    item.bannerImageUrl,
  ].filter(Boolean);
  const first = cand[0];
  if (Array.isArray(first)) return first[0] || null;
  return first || null;
}
export default function ArtworkSlideshow({
  items = [],
  interval = 3500,
  onItemClick,
}) {
  const safeItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items
      .map((it) => ({ ...it, __image: getImageUrl(it) }))
      .filter((x) => !!x.__image);
  }, [items]);
  const [i, setI] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    if (safeItems.length <= 1) return;
    timerRef.current = setInterval(() => {
      setI((p) => (p + 1) % safeItems.length);
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [safeItems.length, interval]);
  if (!safeItems.length) return null;
  const cur = safeItems[i];
  const handleClick = () => {
    if (typeof onItemClick === "function") onItemClick(cur);
  };
  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-lg bg-black/5">
      <button
        type="button"
        onClick={handleClick}
        className="block w-full text-left focus:outline-none"
        title={cur?.auctionId ? "Zur Auktion" : ""}
      >
        <img
          src={cur.__image}
          alt={cur.title || "Artwork"}
          className="w-full h-80 md:h-[420px] object-cover cursor-pointer"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/1200x420?text=Artwork";
          }}
        />
      </button>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
        <div className="max-w-4xl">
          <h3 className="text-xl font-semibold line-clamp-1">
            {cur.title || "Ohne Titel"}
          </h3>
          {cur?.price != null && (
            <p className="opacity-90">
              {new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: cur.currency || "EUR",
                minimumFractionDigits: 0,
              }).format(Number(cur.price))}
            </p>
          )}
        </div>
      </div>
      {safeItems.length > 1 && (
        <>
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center"
            onClick={() =>
              setI((p) => (p - 1 + safeItems.length) % safeItems.length)
            }
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center"
            onClick={() => setI((p) => (p + 1) % safeItems.length)}
            aria-label="Next"
          >
            ›
          </button>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1">
            {safeItems.map((_, idx) => (
              <span
                key={idx}
                className={`w-2.5 h-2.5 rounded-full ${
                  i === idx ? "bg-white" : "bg-white/50"
                }`}
                onClick={() => setI(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
