
// frontend/pages/Auction.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import ArtworkCard from "../components/ArtworkCard";
import CountdownTimer from "../components/CountdownTimer";
import { getAuctionById, getAuctionArtworks } from "../api/api";
import ShareMenu from "../components/ShareMenu";

const Auction = () => {
  const [artworks, setArtworks] = useState([]);
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { auctionId } = useParams();
  const origin =
    (typeof window !== "undefined" && window.location.origin) || "";
  const auctionUrl = origin ? `${origin}/auction/${auctionId}` : "";

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
      console.log("Avatar URL direkt:", auctionData.avatarUrl);
      console.log("Avatar URL über artistId:", auctionData.artistId?.avatarUrl);
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

  // Quelle für Artist-Daten: auction.artistId / auction.artist /
  // Fallback aus artworks[0].artistId oder artworks[0].artist

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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="mb-2 sticky top-20 z-50">
        <Link
          to="/auction"
          className="btn top-0 z-50 rounded-2xl text-whiteLetter/80 bg-lavenderViolett/60 hover:bg-buttonPink hover:text-darkBackground font-sans font-extralight btn-xs "
        >
          Back{" "}
        </Link>
      </div>

      <section className="bg-darkBackground/20 backdrop-blur-2xl rounded-lg border-2 border-black/50 hover:border-r-1 hover:border-b-1 hover:border-2 hover:border-black/70 text-whiteLetter p-4 sm:p-6 md:p-10 shadow-lg hover:shadow-coldYellow/30 hover:shadow-lg">
        {auction && (
          <div>
            {/* Kopfzeile */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4 mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-xl md:text-3xl font-extralight">
                {auction.title}
              </h1>

              {/* Share-Buttons */}
              <div className="md:ml-auto flex flex-wrap items-center gap-2">
                <ShareMenu
                  title={`Bid on: ${auction.title} on popAUC`}
                  url={auctionUrl}
                  summary={auction.description?.slice(0, 120) || ""}
                />
              </div>

              {/* Timer */}
              {auction.status !== "ended" && auction.endDate && (
                <div className="md:ml-4 md:self-start">
                  <div className="border border-orange-200/60 bg-white/5 rounded-xl p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium text-white/80 mb-1">
                      Time left
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
                </div>
              )}
            </div>

            {/* Inhalt */}
            <div className="flex flex-col md:flex-row items-stretch gap-4 sm:gap-6">
              {(auction.avatarUrl || auction.artistId?.avatarUrl) && (
                <div className="flex-none">
                  <div
                    className="
          w-48 h-48
          sm:w-56 sm:h-56
          md:w-72 md:h-72
          lg:w-80 lg:h-80
          rounded-lg overflow-hidden
          border bg-darkBackground border-black/40 shadow-black/30 shadow-lg
        "
                  >
                    <img
                      src={auction.avatarUrl || auction.artistId?.avatarUrl}
                      alt={auction.title || "Artist"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/800?text=Artist";
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex-1">
                {(auction.description || hasAnySocial) && (
                  <div className="rounded-xl  border border-black/50 bg-black/5 p-4 sm:p-5 hover:bg-black/10 hover:border-black/70 hover:shadow-sm hover:shadow-black/70">
                    {auction.description && (
                      <p
                        className="
          text-white/90 font-extralight font-sans
          leading-snug sm:leading-normal md:leading-relaxed
          text-sm sm:text-[15px] md:text-base lg:text-lg
        "
                      >
                        {auction.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 ">
          {artworks.length > 0 ? (
            artworks.map((artwork) => (
              <div
                key={artwork._id}
                className="w-full max-w-[22rem] mx-auto border-1 border-black/50 rounded-2xl hover:border-2 hover:border-black/70 shadow-sm hover:shadow-black/90 hover:shadow-lg"
              >
                <ArtworkCard
                  artwork={artwork}
                  onBidSuccess={handleBidSuccess}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-16 ">
              <p className="text-xl">No artworks found for this auction.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Auction;
