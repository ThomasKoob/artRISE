import { useState, useEffect } from "react";
import { useLoginModal } from "../context/LoginModalContext.jsx";

export default function ArtworkCard({ artwork: initialArtwork, onBidSuccess }) {
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
        {
          credentials: "include",
        }
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

  // Lade Gebote beim ersten Mount
  useEffect(() => {
    fetchOffers();
  }, [artwork._id]);

  // Check if current user has already bid
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

      // Reload offers to show updated state
      await fetchOffers();

      // Call parent callback if provided
      if (onBidSuccess) {
        onBidSuccess(data.offer, artwork);
      }

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
                {displayPrice.toLocaleString("de-DE")}{" "}
                {artwork.currency || "EUR"}
              </span>
            </div>

            {/* Gebots-Statistiken */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Start: {artwork.startPrice} €</span>
                <span>Max: {artwork.endPrice} €</span>
              </div>
              <div className="flex justify-between">
                <span>Gebote: {offers.length}</span>
                {userBid && (
                  <span className="text-blue-600 font-medium">
                    Dein Gebot: {userBid.amount} €
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Höchstes Gebot Anzeige */}
          {offers.length > 0 && (
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
              className="btn btn-outline btn-sm"
            >
              Ansehen
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchOffers}
              disabled={loadingOffers}
              className="btn btn-ghost btn-sm"
              title="Gebote aktualisieren"
            >
              {loadingOffers ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "🔄"
              )}
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
                  setBidAmount(minBid.toString());
                }}
                className="btn btn-primary btn-sm"
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
                  {displayPrice.toLocaleString("de-DE")}{" "}
                  {artwork.currency || "EUR"}
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
