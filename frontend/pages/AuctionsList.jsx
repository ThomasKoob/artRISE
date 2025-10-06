// frontend/pages/AuctionsList.jsx
import { useState, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router";
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [auctionsRaw, artworksRaw] = await Promise.all([
          getAllAuctions(),
          getAllArtworks(),
        ]);
        setAuctions(listFromApi(auctionsRaw));
        setArtworks(listFromApi(artworksRaw));
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

  // ✅ Anzahl der Artworks pro Auktion zählen
  const getTotalArtworksForAuction = (auction) => {
    const aIdStr = toIdStr(auction?._id || auction?.id);
    if (!aIdStr) return 0;
    return normalizedArtworks.filter((aw) => toIdStr(aw.auctionId) === aIdStr)
      .length;
  };

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
          <p>• Prüfe, ob dein Backend läuft</p>
          <p>• Sieh in die Browser-Konsole für Details</p>
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4 border-1 border-black mt-8 mb-8 rounded-2xl bg-violetHeader/60 backdrop-blur shadow-lg shadow-black">
      <section className="p-2 border-black/50 ">
        <h1 className="text-5xl  text-shadow-accent text-whiteLetter font-sans font-extralight mb-4 mt-0">
          All Auctions{" "}
        </h1>

        <div className="mb-4 text-sm text-whiteLetter/80">
          Found {auctions.length} auction(s)
        </div>
      </section>
      {auctions.length > 0 ? (
        <div className="grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {auctions.map((auction) => {
            const artworksCount = getTotalArtworksForAuction(auction);
            const auctionId = auction._id || auction.id;

            return (
              <div
                key={auctionId}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/auction/${auctionId}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/auction/${auctionId}`);
                  }
                }}
                className="card bg-modalGray/10 rounded-lg group border-1 border-black hover:border-2 shadow-md shadow-black/70 overflow-hidden cursor-pointer
               h-[22rem] sm:h-[24rem] md:h-[26rem]
               grid grid-rows-[2fr_1fr] hover:shadow-lg hover:shadow-buttonPink/50"
                title={auction.title || "Auction"}
                aria-label={`Open auction ${auction.title || ""}`}
              >
                {/* Cover */}
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={getCoverForAuction(auction)}
                    alt={auction.title || "Auction banner"}
                    className="absolute inset-0 w-full h-full object-cover
                   transition-transform duration-300 ease-out transform-gpu
                   group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/800x400?text=Auction+Banner";
                    }}
                  />
                </div>

                {/* Info/Actions */}
                <div className="row-span-1 p-2 border-t border-base-200 flex flex-col">
                  <h2 className="card-title font-sans font-extralight text-xl">
                    {auction.title}
                  </h2>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                      {auction.status === "live" && (
                        <span className="badge badge-success bg-hellGrun/80  text-darkBackground">
                          Live
                        </span>
                      )}
                      {auction.status === "upcoming" && (
                        <span className="badge badge-info">Upcoming</span>
                      )}
                      {auction.status === "ended" && (
                        <span className="badge badge-error bg-lightRedButton">
                          Ended
                        </span>
                      )}
                    </div>

                    {auction.status !== "ended" && auction.endDate && (
                      <CountdownTimer
                        endDate={auction.endDate}
                        onExpired={() => {
                          console.log(`Auction ${auctionId} has ended`);
                        }}
                      />
                    )}
                  </div>

                  {/* ✅ Anzahl der Artworks als kleine Fußnote */}
                  <div className="mt-2 text-[11px] text-white/70">
                    {artworksCount === 0
                      ? "No artworks"
                      : artworksCount === 1
                      ? "1 artwork"
                      : `${artworksCount} artworks`}
                  </div>

                  {/* Optionaler Button bleibt – klick auf Karte bleibt aktiv */}
                  <div className="card-actions justify-end mt-3">
                    <Link
                      to={`/auction/${auctionId}`}
                      className="btn rounded-2xl text-gruenOlive bg-hellPink hover:bg-buttonPink hover:text-darkBackground font-sans hover:font-extralight btn-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Auction
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
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
