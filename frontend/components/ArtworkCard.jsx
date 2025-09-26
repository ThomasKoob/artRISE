import { useState } from "react";
import { useLoginModal } from "../context/LoginModalContext.jsx";

export default function ArtworkCard({ artwork }) {
  const [open, setOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [showBidForm, setShowBidForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [bidError, setBidError] = useState("");

  const { user, openLogin } = useLoginModal();

  // Aktueller Preis (höchstes Gebot oder Startpreis)
  const currentPrice = artwork.price || artwork.startPrice || 0;

  // Mindest-Gebot berechnen
  const minBid = currentPrice + (artwork.minIncrement || 5);

  const handleBidSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      openLogin();
      return;
    }

    if (user.role === "seller" || user.role === "artist") {
      setBidError(
        "Als Verkäufer/Künstler kannst du nicht auf eigene Werke bieten"
      );
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
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          artworkId: artwork._id,
          userId: user._id,
          amount: amount,
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

      // Erfolgsmeldung nach 3 Sekunden ausblenden
      setTimeout(() => {
        setBidSuccess(false);
      }, 3000);
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
      <div className="card bg-base-100 w-80 shadow-md">
        <figure>
          <img
            src={artwork.images || "https://via.placeholder.com/400x300"}
            alt={artwork.title}
            className="h-60 w-full object-cover rounded-t-lg"
          />
        </figure>

        <div className="card-body">
          <h2 className="card-title text-lg font-bold">
            {artwork.title}
            <span className={`badge ${getStatusColor(artwork.status)}`}>
              {artwork.status === "live" && "Live"}
              {artwork.status === "draft" && "Draft"}
              {artwork.status === "ended" && "Ended"}
              {artwork.status === "canceled" && "Canceled"}
            </span>
          </h2>

          <p className="text-sm text-gray-600 line-clamp-2">
            {artwork.description}
          </p>

          {/* Preis-Information */}
          <div className="mt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Aktueller Preis:
              </span>
              <span className="badge badge-outline font-bold text-lg">
                {currentPrice.toLocaleString("de-DE")}{" "}
                {artwork.currency || "EUR"}
              </span>
            </div>

            {artwork.startPrice && artwork.endPrice && (
              <div className="text-xs text-gray-500">
                Start: {artwork.startPrice} € • Max: {artwork.endPrice} €
              </div>
            )}
          </div>

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
          {showBidForm && isAuctionActive && (
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
                    className="input input-bordered input-sm flex-1"
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
              className="btn btn-outline btn-sm"
            >
              Ansehen
            </button>

            {/* Bid Button */}
            {isAuctionActive && !showBidForm && (
              <button
                onClick={() => {
                  if (!user) {
                    openLogin();
                    return;
                  }
                  if (user.role === "seller" || user.role === "artist") {
                    setBidError(
                      "Als Verkäufer/Künstler kannst du nicht bieten"
                    );
                    return;
                  }
                  setShowBidForm(true);
                  setBidError("");
                }}
                className="btn btn-primary btn-sm"
              >
                Bieten
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
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
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
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white rounded-b-lg">
              <h3 className="text-xl font-bold mb-2">{artwork.title}</h3>
              <p className="text-sm opacity-90 mb-2">{artwork.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">
                  {currentPrice.toLocaleString("de-DE")}{" "}
                  {artwork.currency || "EUR"}
                </span>
                <span className={`badge ${getStatusColor(artwork.status)}`}>
                  {artwork.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
