// frontend/components/ArtworkCard.jsx
import { useState, useEffect } from "react";
import { useLoginModal } from "../context/LoginModalContext.jsx";
import { getArtworkOffers, createOffer, getFirstImageUrl } from "../api/api";

export default function ArtworkCard({
  artwork: initialArtwork,
  onBidSuccess,
  variant = "default",
}) {
  const [artwork, setArtwork] = useState(initialArtwork);
  const [offers, setOffers] = useState([]);
  const [open, setOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [showBidForm, setShowBidForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [bidError, setBidError] = useState("");
  const [loadingOffers, setLoadingOffers] = useState(false);

  const { user, openLogin } = useLoginModal();
  const isBuyer = !!user && user.role === "buyer";
  const isCompact = variant === "compact";

  const currentPrice = artwork.price || artwork.startPrice || 0;
  const highestBid = offers.length > 0 ? offers[0].amount : 0;
  const displayPrice = Math.max(currentPrice, highestBid);
  const minBid = displayPrice + (artwork.minIncrement || 5);

  // Aktuelle Gebote laden
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
          setArtwork((prev) => ({
            ...prev,
            price: data.stats.highestBid,
          }));
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

  return (
    <>
      {/* Card */}
      <div
        className={`card bg-black/30 border-10 border-black ${
          isCompact ? "w-64" : "w-80"
        } shadow-md rounded-2xl relative`}
      >
        <figure>
          <img
            src={
              getFirstImageUrl(artwork) || "https://via.placeholder.com/400x300"
            }
            alt={artwork.title}
            className={`${
              isCompact ? "h-44" : "h-60"
            } w-full object-cover rounded-t-lg`}
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/400x300?text=Artwork";
            }}
          />
        </figure>

        <div className="card-body">
          <h2
            className={`card-title ${
              isCompact ? "text-base" : "text-lg"
            } font-extralight font-sans`}
          >
            {artwork.title}
          </h2>

          {!isCompact && (
            <p className="text-sm text-gray-300 line-clamp-2">
              {artwork.description}
            </p>
          )}

          {/* Preis-Information */}
          <div className="mt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-whiteLetter">
                Aktueller Preis:
              </span>
              <span
                className={`badge badge-outline font-bold ${
                  isCompact ? "text-base" : "text-lg"
                }`}
              >
                {displayPrice.toLocaleString("de-DE")}{" "}
                {artwork.currency || "EUR"}
              </span>
            </div>

            {!isCompact && (
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Start: {artwork.startPrice} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Gebote: {offers.length}</span>
                  {userBid && (
                    <span className="text-blue-300 font-medium">
                      Dein Gebot: {userBid.amount} €
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Höchstes Gebot Anzeige */}
          {!isCompact && offers.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-medium">
                  Höchstes Gebot:
                </span>
                <span className="text-green-800 font-bold">
                  {offers[0].amount} € von{" "}
                  {offers[0].userId?.userName || "Anonym"}
                </span>
              </div>
            </div>
          )}

          {/* Erfolgs- oder Fehlermeldung */}
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

          {/* Bid Form */}
          {showBidForm && isAuctionActive && isBuyer && (
            <form onSubmit={handleBidSubmit} className="space-y-2">
              <div className="form-control">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={minBid}
                    step="1"
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Gebot (min. ${minBid} €)`}
                    className="input input-bordered input-sm flex-1 text-white placeholder-white/60 bg-white"
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
            </form>
          )}

          {/* Action Buttons */}
          <div className="card-actions justify-end mt-4">
            <button
              onClick={() => setOpen(true)}
              className="btn btn-outline btn-sm font-sans font-extralight rounded-2xl"
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
                  setBidAmount(minBid.toString());
                }}
                className="btn rounded-2xl btn-primary bg-coldYellow text-darkBackground hover:bg-coldYellow/80 font-extralight btn-l"
              >
                {userBid ? "Gebot erhöhen" : "Bieten"}
              </button>
            )}

            {isAuctionEnded && (
              <span className="badge badge-error">Beendet</span>
            )}
            {!isAuctionActive && !isAuctionEnded && (
              <span className="badge badge-warning">Nicht aktiv</span>
            )}
          </div>
        </div>
      </div>

      {/* Modal für Vollbild-Ansicht */}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-transparent backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobil: vertikal | Desktop: horizontal */}
            <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
              {/* Info links (Desktop) / unten (Mobil) */}
              <aside className="w-full md:w-64 bg-white/95 text-black rounded-xl shadow-xl p-3 md:p-4 md:self-end md:order-first">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold leading-snug line-clamp-2">
                    {artwork.title}
                  </h3>
                  <span
                    className={`badge ${getStatusColor(
                      artwork.status
                    )} badge-sm`}
                  >
                    {artwork.status}
                  </span>
                </div>
                {artwork.description && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-4">
                    {artwork.description}
                  </p>
                )}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Preis</span>
                    <span className="font-semibold">
                      {displayPrice.toLocaleString("de-DE")}{" "}
                      {artwork.currency || "EUR"}
                    </span>
                  </div>
                  {artwork.startPrice != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Start</span>
                      <span>{artwork.startPrice} €</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gebote</span>
                    <span>{offers.length}</span>
                  </div>
                  {offers.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-[11px] mt-2">
                      <div className="flex justify-between">
                        <span className="text-green-700">Höchstes Gebot</span>
                        <span className="text-green-800 font-semibold">
                          {offers[0].amount} €
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              {/* Bild rechts (Desktop) / oben (Mobil) */}
              <div className="relative w-full md:flex-1 rounded-2xl overflow-hidden md:order-last">
                <img
                  src={
                    getFirstImageUrl(artwork) ||
                    "https://via.placeholder.com/800x600?text=Artwork"
                  }
                  alt={artwork.title}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/800x600?text=Artwork";
                  }}
                  className="w-full max-h-[80vh] md:max-h-[85vh] object-contain bg-transparent block"
                />
                {/* close button*/}
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-3 right-3 btn btn-circle btn-sm z-20"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
