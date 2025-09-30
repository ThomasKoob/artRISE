import { useState, useEffect } from "react";
import { useLoginModal } from "../context/LoginModalContext.jsx";



export default function ArtworkCard({
  artwork: initialArtwork,
  onBidSuccess,
  variant = "default", // "default" | "compact"
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

  // Nur Käufer dürfen Herz + Bieten sehen
  const isBuyer = !!user && user.role === "buyer";
  const isCompact = variant === "compact";

  // Aktueller Preis (höchstes Gebot oder Startpreis)
  const currentPrice = artwork.price || artwork.startPrice || 0;
  const highestBid = offers.length > 0 ? offers[0].amount : 0;
  const displayPrice = Math.max(currentPrice, highestBid);

  // Mindest-Gebot berechnen
  const minBid = displayPrice + (artwork.minIncrement || 5);

  // Aktuelle Gebote laden
  const fetchOffers = async () => {
    if (!artwork._id) return;

    setLoadingOffers(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/offers/artwork/${artwork._id}`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOffers(data.offers || []);
          // Update artwork price if we got new info
          if (data.stats?.highestBid > 0) {
            setArtwork((prev) => ({
              ...prev,
              price: data.stats.highestBid,
            }));
          }
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

  // Hat aktueller Nutzer bereits geboten?
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
      const response = await fetch("http://localhost:3001/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          artworkId: artwork._id,
          userId: user._id,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gebot fehlgeschlagen");
      }

      // Erfolg
      setBidSuccess(true);
      setBidAmount("");
      setShowBidForm(false);

      // Reload offers to show updated state
      await fetchOffers();

      // Parent informieren
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
        className={`card bg-black/50 border-20 border-black/50 ${
          isCompact ? "w-64" : "w-80"
        } shadow-md rounded-2xl relative`}
      >
       
        <figure>
          <img
            src={artwork.images || "https://via.placeholder.com/400x300"}
            alt={artwork.title}
            className={`${isCompact ? "h-44" : "h-60"} w-full object-cover rounded-t-lg`}
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/400x300?text=Artwork";
            }}
          />
        </figure>

        <div className="card-body">
          <h2 className={`card-title ${isCompact ? "text-base" : "text-lg"} font-extralight font-sans`}>
            {artwork.title}
            <span className={`badge ${getStatusColor(artwork.status)}`}>
              {artwork.status === "live" && "Live"}
              {artwork.status === "draft" && "Draft"}
              {artwork.status === "ended" && "Ended"}
              {artwork.status === "canceled" && "Canceled"}
            </span>
          </h2>

          {!isCompact && (
            <p className="text-sm text-gray-300 line-clamp-2">
              {artwork.description}
            </p>
          )}

          {/* Preis-Information */}
          <div className="mt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-200">
                Aktueller Preis:
              </span>
              <span className={`badge badge-outline font-bold ${isCompact ? "text-base" : "text-lg"}`}>
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
                <span className="text-green-700 font-medium">Höchstes Gebot:</span>
                <span className="text-green-800 font-bold">
                  {offers[0].amount} € von {offers[0].userId?.userName || "Anonym"}
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

            {/* Bid Button – nur Buyer & aktive Auktion */}
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

            {isAuctionEnded && <span className="badge badge-error">Beendet</span>}
            {!isAuctionActive && !isAuctionEnded && (
              <span className="badge badge-warning">Nicht aktiv</span>
            )}
          </div>
        </div>
      </div>

      {/* Modal für Vollbild-Ansicht */}
      {open && (
        <div
          className="fixed border-2 inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setOpen(false)}
        >
          <div className="max-w-4xl max-h-[90vh] p-4 relative">
            <img
              src={artwork.images}
              alt={artwork.title}
              className="rounded-lg shadow-lg max-h-[80vh] object-contain"
            />

            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 btn btn-circle btn-sm"
            >
              ✕
            </button>

            {/* Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg from-black/80 to-transparent p-6 text-white rounded-b-lg">
              <h3 className="text-xl font-bold mb-2">{artwork.title}</h3>
              <p className="text-sm opacity-90 mb-2">{artwork.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">
                  {displayPrice.toLocaleString("de-DE")} {artwork.currency || "EUR"}
                </span>
                <div className="flex gap-2 items-center">
                  <span className="text-sm">
                    {offers.length} Gebot{offers.length !== 1 ? "e" : ""}
                  </span>
                  <span className={`badge ${getStatusColor(artwork.status)}`}>
                    {artwork.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
