// frontend/pages/AuctionsList.jsx
import { useState, useRef, useMemo, useEffect } from "react";
import { Link } from "react-router";
import CountdownTimer from "../components/CountdownTimer";
import {
  getAllAuctions,
  getAllArtworks,
  listFromApi,
  getFirstImageUrl,
  toIdStr,
  getStatusBadgeClass,
} from "../api/api";

const AuctionsList = () => {
  const [auctions, setAuctions] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const randomIndexMapRef = useRef(new Map());

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [auctionsRaw, artworksRaw] = await Promise.all([
          getAllAuctions(),
          getAllArtworks(), // NEW
        ]);
        setAuctions(listFromApi(auctionsRaw));
        setArtworks(listFromApi(artworksRaw)); // NEW
      } catch (err) {
        console.error("Full error object:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const normalizedArtworks = useMemo(() => {
    return artworks.map((a) => {
      const aid =
        a?.auctionId ||
        a?.auction?.id ||
        a?.auction?._id ||
        a?.auctionId?._id ||
        a?.auctionID ||
        null;
      return { ...a, auctionId: toIdStr(aid) };
    });
  }, [artworks]);

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
          <span>Error loading auctions: {error}</span>
        </div>
        <div className="text-sm text-gray-600">
          <p>Debug info:</p>
          <p>• Check if your backend server is running</p>
          <p>• Check browser console for more details</p>
        </div>
      </div>
    );
  }

  const getCoverForAuction = (auction) => {
    const aIdStr = toIdStr(auction?._id || auction?.id);
    if (!aIdStr) {
      return (
        getFirstImageUrl(auction) ||
        auction?.bannerImageUrl ||
        auction?.image ||
        auction?.imageUrl ||
        auction?.coverUrl ||
        "https://via.placeholder.com/800x400?text=Auction+Banner"
      );
    }

    const rel = normalizedArtworks.filter(
      (aw) => toIdStr(aw.auctionId) === aIdStr
    );

    let chosen = null;
    if (rel.length) {
      const map = randomIndexMapRef.current;
      if (!map.has(aIdStr)) {
        map.set(aIdStr, Math.floor(Math.random() * rel.length));
      }
      const idx = map.get(aIdStr) % rel.length;
      chosen = rel[idx];
    }

    return (
      getFirstImageUrl(chosen) ||
      getFirstImageUrl(auction) ||
      auction?.bannerImageUrl ||
      auction?.image ||
      auction?.imageUrl ||
      auction?.coverUrl ||
      "https://via.placeholder.com/800x400?text=Auction+Banner"
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-3xl font-bold mb-8">All Auctions</h1>

      <div className="mb-4 text-sm text-gray-600">
        Found {auctions.length} auction(s)
      </div>

      {auctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <div
              key={auction._id || auction.id}
              className="card bg-base-100 shadow-md overflow-hidden"
            >
              <figure className="h-48 relative">
                <img
                  src={getCoverForAuction(auction)}
                  alt={auction.title || "Auction banner"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/800x400?text=Auction+Banner";
                  }}
                />
                <span
                  className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                    auction?.status
                  )}`}
                >
                  {auction?.status || "draft"}
                </span>
              </figure>

              <div className="card-body">
                <h2 className="card-title text-lg">{auction.title}</h2>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {auction.description}
                </p>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-2">
                    {auction.status === "live" && (
                      <span className="badge badge-success">Live</span>
                    )}
                    {auction.status === "upcoming" && (
                      <span className="badge badge-info">Upcoming</span>
                    )}
                    {auction.status === "ended" && (
                      <span className="badge badge-error">Ended</span>
                    )}
                  </div>

                  {auction.status !== "ended" && auction.endDate && (
                    <CountdownTimer
                      endDate={auction.endDate}
                      onExpired={() => {
                        console.log(`Auction ${auction._id} has ended`);
                      }}
                    />
                  )}
                </div>

                <div className="text-sm text-gray-500 mt-3 space-y-1">
                  {auction.endDate && (
                    <p>
                      <span className="font-semibold">Ends:</span>{" "}
                      {new Date(auction.endDate).toLocaleString()}
                    </p>
                  )}
                  {auction.artistId?.name && (
                    <p>
                      <span className="font-semibold">Artist:</span>{" "}
                      {auction.artistId.name}
                    </p>
                  )}
                  {auction.minIncrementDefault && (
                    <p>
                      <span className="font-semibold">Min. Bid:</span> €
                      {auction.minIncrementDefault}
                    </p>
                  )}
                </div>

                <div className="card-actions justify-end mt-4">
                  <Link
                    to={`/auction/${auction._id}`}
                    className="btn btn-primary btn-sm"
                  >
                    View Auction
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-16">
          <p className="text-xl">No auctions found.</p>
          <p className="mt-2">Make sure you have auctions in your database.</p>
        </div>
      )}
    </div>
  );
};

export default AuctionsList;
