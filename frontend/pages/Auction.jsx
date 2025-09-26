import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import ArtworkCard from "../components/ArtworkCard";
import CountdownTimer from "../components/CountdownTimer";

const Auction = () => {
  const [artworks, setArtworks] = useState([]);
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auctionId } = useParams();

  useEffect(() => {
    const fetchAuctionData = async () => {
      try {
        setLoading(true);

        // Fetch auction details and artworks in parallel
        const [auctionResponse, artworksResponse] = await Promise.all([
          fetch(`http://localhost:3001/api/auctions/${auctionId}`),
          fetch(`http://localhost:3001/api/auctions/${auctionId}/artworks`),
        ]);

        if (!auctionResponse.ok) {
          throw new Error(`Auction not found (${auctionResponse.status})`);
        }

        if (!artworksResponse.ok) {
          throw new Error(
            `Failed to load artworks (${artworksResponse.status})`
          );
        }

        const auctionResult = await auctionResponse.json();
        const artworksResult = await artworksResponse.json();

        // Berücksichtigung der API Response Struktur
        const auctionData = auctionResult.success
          ? auctionResult.data
          : auctionResult;
        const artworksData = artworksResult.success
          ? artworksResult.data
          : artworksResult;

        setAuction(auctionData);
        setArtworks(artworksData);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching auction data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (auctionId) {
      fetchAuctionData();
    }
  }, [auctionId]);

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
      {/* Back Navigation */}
      <div className="mb-6">
        <Link to="/auction" className="btn btn-ghost btn-sm">
          ← Back to All Auctions
        </Link>
      </div>

      {/* Auction Header */}
      {auction && (
        <div className="mb-8">
          {/* Banner Image */}
          {auction.bannerImageUrl && (
            <div className="mb-6">
              <div className="flex flex-row">
                <img
                  src={auction.bannerImageUrl}
                  alt={auction.title}
                  className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/800x300?text=Auction+Banner";
                  }}
                />
                <div className="flex flex-col ml-10">
                  <h1 className="text-3xl md:text-4xl font-bold">
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
                {/* Status Badge */}
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

            {/* Countdown Timer - Prominent Display */}
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
                    // Optional: Refresh page or update status
                  }}
                />
              </div>
            )}
          </div>

          {/* Auction Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {auction.endDate && (
              <div>
                <span className="font-semibold text-gray-700">Ends:</span>
                <p className="text-sm text-gray-600">
                  {new Date(auction.endDate).toLocaleString()}
                </p>
              </div>
            )}
            {auction.artistId?.name && (
              <div>
                <span className="font-semibold text-gray-700">Artist:</span>
                <p className="text-sm text-gray-600">{auction.artistId.name}</p>
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-700">Artworks:</span>
              <p className="text-sm text-gray-600">{artworks.length} pieces</p>
            </div>
          </div>
        </div>
      )}

      {/* Artworks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {artworks.length > 0 ? (
          artworks.map((artwork) => (
            <ArtworkCard key={artwork._id} artwork={artwork} />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-16">
            <p className="text-xl">No artworks found for this auction.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auction;
