// frontend/pages/Auction.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import ArtworkCard from "../components/ArtworkCard";
import CountdownTimer from "../components/CountdownTimer";
import { getAuctionById, getAuctionArtworks } from "../api/api";

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

      const [auctionResult, artworksResult] = await Promise.all([
        getAuctionById(auctionId),
        getAuctionArtworks(auctionId),
      ]);

      console.log("Auction result:", auctionResult);
      console.log("Artworks result:", artworksResult);

      const auctionData = auctionResult.success
        ? auctionResult.data
        : auctionResult;
      const artworksData = artworksResult.success
        ? artworksResult.data
        : artworksResult;

      console.log("Processed auction data:", auctionData);
      console.log("Processed artworks data:", artworksData);
      console.log("Artworks count:", artworksData?.length);

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
    if (auctionId) {
      fetchAuctionData();
    }
  }, [auctionId, fetchAuctionData]);

  const handleBidSuccess = useCallback((offer, artwork) => {
    console.log("Bid success:", offer, artwork);
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
      <div className="p-8 gap-4">
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
      <div className="mb-6">
        <Link to="/auction" className="btn btn-ghost btn-sm">
          ← Back to All Auctions
        </Link>
      </div>

      {auction && (
        <div className="mb-8">
          {auction.artistId?.avatarUrl && (
            <div className="mb-6">
              <div className="flex flex-row items-start gap-6">
                <img
                  src={auction.artistId.avatarUrl}
                  alt={auction.artistId.userName || "Artist"}
                  className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.src =
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

          <div className="flex justify-between items-center mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <span>Letzte Aktualisierung: </span>
              <span className="font-medium">
                {lastUpdate.toLocaleTimeString("de-DE")}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {artworks.length > 0 ? (
          artworks.map((artwork) => (
            <ArtworkCard
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

      {auction?.status === "live" && artworks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">
            Live Auktions-Statistiken
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {artworks.length}
              </div>
              <div className="text-sm text-green-700">Aktive Kunstwerke</div>
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
                Gesamtwert aktueller Gebote
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.max(
                  ...artworks.map((art) => art.price || art.startPrice || 0)
                ).toLocaleString("de-DE")}{" "}
                €
              </div>
              <div className="text-sm text-purple-700">
                Höchstes einzelnes Gebot
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auction;
