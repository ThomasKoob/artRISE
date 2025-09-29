// pages/Auction.jsx
// DE: Seite "Auction" – UI auf Englisch + kompakte Artwork-Karten mit einfachem Bieten.

import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import CountdownTimer from "../components/CountdownTimer";

const API_BASE = "http://localhost:3001";

/** DE: Kompakte Artwork-Karte innerhalb der Auktionsseite
 * - Zeigt Bild, Titel, aktuellen Preis
 * - Inline-Bieten (einfacher Flow: Betrag eingeben -> POST /api/offers)
 * - Ruft onBidSuccess auf, damit übergeordnete Liste aktuell bleibt
 */
function CompactArtworkCard({ artwork, onBidSuccess }) {
  // DE: UI-State für Bieten
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // DE: Mindestgebot bestimmen (Fallbacks wie im restlichen Code)
  const highest = Number(artwork?.price || 0);
  const base = Number(
    highest || artwork?.startPrice || artwork?.price || 0
  );
  const inc = Number(artwork?.minIncrement || 5);
  const minBid = base + inc;

  // DE: Öffnen → vorbefüllen
  const openBid = () => {
    setAmount(String(minBid));
    setErr("");
    setIsOpen(true);
  };

  const cancelBid = () => {
    setIsOpen(false);
    setErr("");
  };

  // DE: Angebotsabsendung an Backend
  const submitBid = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < minBid) {
      setErr(`New bid must be at least ${minBid} €.`);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      // DE: Standard-Endpunkt (an dein Backend angepasst, falls anders)
      const res = await fetch(`${API_BASE}/api/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          artworkId: artwork._id,
          amount: val,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Bid failed");
      }

      // DE: Parent informieren
      onBidSuccess?.({ amount: val }, artwork);
      setIsOpen(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const cover =
    artwork?.images ||
    artwork?.image ||
    artwork?.imageUrl ||
    "https://via.placeholder.com/600x400?text=Artwork";

  return (
    <div className="group rounded-xl border bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      {/* DE: Bildbereich */}
      <div className="relative">
        <img
          src={cover}
          alt={artwork?.title || "Artwork"}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/600x400?text=Artwork";
          }}
        />
        {/* DE: Preis-Badge oben links */}
        <div className="absolute top-2 left-2 rounded-full bg-black/70 text-white text-xs px-2 py-1">
          {(artwork?.price || artwork?.startPrice || 0).toLocaleString("de-DE")} €
        </div>
      </div>

      {/* DE: Textbereich */}
      <div className="p-4">
        <h3 className="font-semibold text-black line-clamp-1">
          {artwork?.title || "Untitled"}
        </h3>
        {artwork?.medium && (
          <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
            {artwork.medium}
          </p>
        )}

        {/* DE: Aktionen */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            Current:{" "}
            <span className="font-medium text-black">
              {(artwork?.price || artwork?.startPrice || 0).toLocaleString("de-DE")} €
            </span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={openBid}
            title="Place a bid"
          >
            Bid
          </button>
        </div>

        {/* DE: Inline-Bieten */}
        {isOpen && (
          <div className="mt-3 border-t pt-3">
            <label className="text-xs text-gray-600">
              New bid (min. {minBid} €)
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                min={minBid}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input input-bordered input-sm flex-1 text-black placeholder-black/60 bg-white"
                placeholder={`${minBid}`}
              />
              <button
                className="btn btn-sm btn-success"
                onClick={submitBid}
                disabled={busy}
                title="Submit bid"
              >
                {busy ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "Submit"
                )}
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={cancelBid}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
            {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

const Auction = () => {
  const [artworks, setArtworks] = useState([]);
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { auctionId } = useParams();

  const fetchAuctionData = useCallback(async () => {
    try {
      setLoading(true);

      // DE: Auktion + Artworks parallel laden
      const [auctionResponse, artworksResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/auctions/${auctionId}`),
        fetch(`http://localhost:3001/api/auctions/${auctionId}/artworks`),
      ]);

      if (!auctionResponse.ok) {
        throw new Error(`Auction not found (${auctionResponse.status})`);
      }
      if (!artworksResponse.ok) {
        throw new Error(`Failed to load artworks (${artworksResponse.status})`);
      }

      const auctionResult = await auctionResponse.json();
      const artworksResult = await artworksResponse.json();

      // DE: Flexible API-Struktur berücksichtigen
      const auctionData = auctionResult?.success ? auctionResult.data : auctionResult;
      const artworksData = artworksResult?.success ? artworksResult.data : artworksResult;

      setAuction(auctionData);
      setArtworks(Array.isArray(artworksData) ? artworksData : []);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error("Error fetching auction data:", err);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    if (auctionId) fetchAuctionData();
  }, [auctionId, fetchAuctionData]);

  // DE: Auto-Refresh für Live-Auktionen
  useEffect(() => {
    if (!auction || auction.status !== "live") return;
    const interval = setInterval(() => {
      fetchAuctionData();
    }, 30000);
    return () => clearInterval(interval);
  }, [auction, fetchAuctionData]);

  // DE: Callback nach erfolgreichem Gebot
  const handleBidSuccess = useCallback((offer, artwork) => {
    // DE: lokalen Preis anpassen
    setArtworks((prev) =>
      prev.map((art) =>
        art._id === artwork._id ? { ...art, price: offer.amount } : art
      )
    );
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="alert alert-error mb-4">
          <span>Error loading auction: {error}</span>
        </div>
        <Link to="/auction" className="btn btn-secondary">
          ← Back to All Auctions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* DE: Zurück */}
      <div className="mb-6">
        <Link to="/auction" className="btn btn-ghost btn-sm">
          ← Back to All Auctions
        </Link>
      </div>

      {/* DE: Kopfbereich der Auktion */}
      {auction && (
        <div className="mb-8">
          {/* DE: Kopf mit (optionaler) Künstler-Avatar/Vorschau */}
          {auction.artistId?.avatarUrl && (
            <div className="mb-6">
              <div className="flex flex-row items-start gap-6">
                <img
                  src={auction.artistId.avatarUrl}
                  alt={auction.artistId.userName || "Artist"}
                  className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/400x400?text=Artist";
                  }}
                />
                <div className="flex flex-col flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {auction.title}
                  </h1>
                  {auction.description && (
                    <p className="text-gray-600 mb-4 text-lg leading-relaxed">
                      {auction.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DE: Status + Countdown */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                {auction.status === "live" && (
                  <span className="badge badge-success badge-lg">🔴 Live</span>
                )}
                {auction.status === "upcoming" && (
                  <span className="badge badge-info badge-lg">⏳ Upcoming</span>
                )}
                {auction.status === "ended" && (
                  <span className="badge badge-error badge-lg">🏁 Ended</span>
                )}

                {auction.status === "live" && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Auto update is on</span>
                  </div>
                )}
              </div>
            </div>

            {auction.status !== "ended" && auction.endDate && (
              <div className="bg-gradient-to-r from-orange-100 to-red-100 p-4 rounded-lg border border-orange-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Time Remaining:
                </p>
                <CountdownTimer
                  endDate={auction.endDate}
                  size="lg"
                  onExpired={() => {
                    console.log(`Auction ${auction._id} has ended`);
                    fetchAuctionData();
                  }}
                />
              </div>
            )}
          </div>

          {/* DE: Facts zur Auktion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {auction.endDate && (
              <div>
                <span className="font-semibold text-gray-700">Ends:</span>
                <p className="text-sm text-gray-600">
                  {new Date(auction.endDate).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-700">Artworks:</span>
              <p className="text-sm text-gray-600">{artworks.length} pieces</p>
            </div>
          </div>

          {/* DE: Refresh-Info */}
          <div className="flex justify-between items-center mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <span>Last update: </span>
              <span className="font-medium">
                {lastUpdate.toLocaleTimeString("de-DE")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DE: Redesigned Artworks Grid (kompakte Karten) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {artworks.length > 0 ? (
          artworks.map((artwork) => (
            <CompactArtworkCard
              key={artwork._id}
              artwork={artwork}
              onBidSuccess={handleBidSuccess}
            />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-16">
            <p className="text-xl">No artworks found for this auction.</p>
          </div>
        )}
      </div>

      {/* DE: Live-Stats auf Englisch */}
      {auction?.status === "live" && artworks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">Live auction stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {artworks.length}
              </div>
              <div className="text-sm text-green-700">Active artworks</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {artworks
                  .reduce(
                    (sum, art) => sum + (art.price || art.startPrice || 0),
                    0
                  )
                  .toLocaleString("de-DE")}{" "}
                €
              </div>
              <div className="text-sm text-blue-700">
                Total value of current bids
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.max(
                  ...artworks.map((art) => art.price || art.startPrice || 0)
                ).toLocaleString("de-DE")}{" "}
                €
              </div>
              <div className="text-sm text-purple-700">Highest single bid</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auction;
