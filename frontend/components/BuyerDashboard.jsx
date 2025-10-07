// components/BuyerDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Gavel,
  Eye,
  ArrowUpRight,
  Package,
  Truck,
  RefreshCw,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import UserHeader from "./UserHeader";
import {
  getArtworkById,
  getArtworkOffers,
  updateOffer,
  getUserShippingAddresses, // Won auctions / shipping info
} from "../api/api";

/* --- Small helpers to keep markup tidy ----------------------------------- */

const StatCard = ({ label, value, sublabel, accent = "yellow" }) => {
  const accents = {
    yellow: "from-coldYellow/20 to-coldYellow/5 border-coldYellow/40",
    pink: "from-buttonPink/20 to-buttonPink/5 border-buttonPink/40",
    violet:
      "from-lavenderViolett/20 to-lavenderViolett/5 border-lavenderViolett/40",
    amber: "from-amber-300/20 to-amber-300/5 border-amber-300/40",
  }[accent];
  return (
    <div
      className={`rounded-2xl overflow-hidden border-2 bg-darkBackground/30 shadow-lg shadow-black/60 ${accents}`}
    >
      <div className="bg-gradient-to-br p-5">
        <h3 className="text-sm font-medium text-white/80">{label}</h3>
        <p className="text-3xl font-semibold text-whiteLetter">{value}</p>
        {sublabel ? (
          <p className="text-xs text-white/60 mt-1">{sublabel}</p>
        ) : null}
      </div>
    </div>
  );
};

const RoleBadgeLike = ({
  ok,
  okText = "Highest bidder",
  noText = "Outbid",
}) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
      ok
        ? "bg-coldYellow/20 text-coldYellow border-coldYellow/40"
        : "bg-buttonPink/20 text-buttonPink border-buttonPink/40"
    }`}
  >
    {ok ? okText : noText}
  </span>
);

/* ------------------------------------------------------------------------- */

const BuyerDashboard = ({ user, myOffers: initialOffers }) => {
  const navigate = useNavigate();

  const [myOffers, setMyOffers] = useState(initialOffers || []);
  const [artworkDetails, setArtworkDetails] = useState({});
  const [loading, setLoading] = useState(false);

  // Won auctions (shipping)
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loadingWon, setLoadingWon] = useState(false);

  /** Extract auctionId from an artwork object */
  function getAuctionIdFromArtwork(artwork) {
    if (!artwork || typeof artwork !== "object") return null;
    if (typeof artwork.auctionId === "string") return artwork.auctionId;
    if (artwork.auctionId && typeof artwork.auctionId === "object") {
      return artwork.auctionId._id || artwork.auctionId.id || null;
    }
    if (artwork.auction && typeof artwork.auction === "object") {
      return artwork.auction._id || artwork.auction.id || null;
    }
    return artwork.auctionID || null;
  }

  // Load won auctions (shipping info)
  const fetchWonAuctions = async () => {
    setLoadingWon(true);
    try {
      const response = await getUserShippingAddresses();
      setWonAuctions(response.data || []);
    } catch (error) {
      console.error("Failed to load won auctions:", error);
    } finally {
      setLoadingWon(false);
    }
  };

  // Load details for each offer (artwork + current offers)
  const fetchDetailedOffers = async () => {
    if (!myOffers?.length) return;
    setLoading(true);
    try {
      const artworkIds = [...new Set(myOffers.map((offer) => offer.artworkId))];
      const results = await Promise.all(
        artworkIds.map(async (artworkId) => {
          try {
            const [artworkRaw, offersRaw] = await Promise.all([
              getArtworkById(artworkId),
              getArtworkOffers(artworkId),
            ]);
            const artwork = artworkRaw || null;
            const offersData = offersRaw?.success ? offersRaw.offers : [];
            const stats = offersRaw?.success ? offersRaw.stats : {};
            return { artworkId, artwork, offers: offersData, stats };
          } catch {
            return { artworkId, artwork: null, offers: [], stats: {} };
          }
        })
      );
      const map = {};
      results.forEach((r) => {
        if (r.artworkId) map[r.artworkId] = r;
      });
      setArtworkDetails(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedOffers();
    fetchWonAuctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myOffers]);

  // Stats
  const stats = useMemo(() => {
    if (!myOffers?.length)
      return { total: 0, winning: 0, totalValue: 0, won: wonAuctions.length };
    let winning = 0;
    let totalValue = 0;
    myOffers.forEach((offer) => {
      const details = artworkDetails[offer.artworkId];
      if (details?.offers?.length > 0) {
        const top = details.offers[0];
        const isWinning =
          top.userId?._id === user._id || top.userId === user._id;
        if (isWinning) winning++;
      }
      totalValue += offer.amount || 0;
    });
    return {
      total: myOffers.length,
      winning,
      totalValue,
      won: wonAuctions.length,
    };
  }, [myOffers, artworkDetails, user._id, wonAuctions]);

  // Compute min raise
  const computeMinBidForOffer = (offer) => {
    const details = artworkDetails[offer.artworkId];
    const aw = details?.artwork || {};
    const highest = details?.offers?.[0]?.amount || 0;
    const base = Math.max(aw.price || aw.startPrice || 0, highest);
    const inc = aw.minIncrement || aw.minIncrementDefault || 5;
    return base + inc;
  };

  // Raise states
  const [raisingOfferId, setRaisingOfferId] = useState(null);
  const [raisingAmount, setRaisingAmount] = useState("");
  const [raiseError, setRaiseError] = useState("");
  const [raiseSubmitting, setRaiseSubmitting] = useState(false);

  const openRaiseFor = (offer) => {
    const min = computeMinBidForOffer(offer);
    setRaisingOfferId(offer._id);
    setRaisingAmount(String(min));
    setRaiseError("");
  };

  const cancelRaise = () => {
    setRaisingOfferId(null);
    setRaisingAmount("");
    setRaiseError("");
  };

  const submitRaise = async (offer) => {
    const min = computeMinBidForOffer(offer);
    const amt = parseFloat(raisingAmount);
    if (isNaN(amt) || amt < min) {
      setRaiseError(`New bid must be at least ${min} €.`);
      return;
    }
    setRaiseSubmitting(true);
    setRaiseError("");
    try {
      await updateOffer(offer._id, { amount: amt });
      setMyOffers((prev) =>
        prev.map((o) => (o._id === offer._id ? { ...o, amount: amt } : o))
      );
      await fetchDetailedOffers();
      cancelRaise();
    } catch (e) {
      setRaiseError(e.message);
    } finally {
      setRaiseSubmitting(false);
    }
  };

  // Shipping status badge (dark theme)
  const getStatusBadge = (status) => {
    const map = {
      pending: {
        cls: "bg-buttonPink/20 text-buttonPink border-buttonPink/40",
        label: "Address pending",
      },
      confirmed: {
        cls: "bg-lavenderViolett/20 text-lavenderViolett border-lavenderViolett/40",
        label: "Confirmed",
      },
      shipped: {
        cls: "bg-white/15 text-white/80 border-white/25",
        label: "Shipped",
      },
      delivered: {
        cls: "bg-coldYellow/20 text-coldYellow border-coldYellow/40",
        label: "Delivered",
      },
    };
    const conf = map[status] || map.pending;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${conf.cls}`}
      >
        {conf.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <UserHeader user={user} />

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="My bids"
          value={stats.total}
          sublabel="Active bids"
          accent="yellow"
        />
        <StatCard
          label="Leading bids"
          value={stats.winning}
          sublabel="Currently highest"
          accent="pink"
        />
        <StatCard
          label="Total value"
          value={`${stats.totalValue.toLocaleString("de-DE")} €`}
          sublabel="Sum of all bids"
          accent="violet"
        />
        <StatCard
          label="Won"
          value={stats.won}
          sublabel="Auctions won"
          accent="amber"
        />
      </section>

      {/* Won auctions */}
      {wonAuctions.length > 0 && (
        <section className="rounded-2xl border-2 border-black/50 bg-darkBackground/30 backdrop-blur-md shadow-lg shadow-black/70 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-light text-whiteLetter flex items-center gap-2">
              <Package size={20} className="text-coldYellow" />
              Won auctions
            </h2>
            <button
              onClick={fetchWonAuctions}
              disabled={loadingWon}
              className="rounded-xl px-3 py-2 border border-buttonPink bg-greenButton/40 hover:bg-lightRedButton/40 transition text-sm"
              title="Refresh"
              type="button"
            >
              {loadingWon ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <RefreshCw size={16} />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wonAuctions.map((item) => {
              const aw = item.artworkId || {};
              const img = Array.isArray(aw.images)
                ? aw.images[0]
                : aw.images || aw.imageUrl;

              return (
                <div
                  key={item._id}
                  className="rounded-xl overflow-hidden border border-white/10 bg-black/20 hover:border-white/20 hover:shadow-black/60 hover:shadow-md transition"
                >
                  <div className="w-full h-48 bg-black/20">
                    {img ? (
                      <img
                        src={img}
                        alt={aw.title || "Artwork"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/600x360?text=Artwork";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-white/50 text-sm">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-medium text-whiteLetter mb-2">
                      {aw.title || "Artwork"}
                    </h3>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-coldYellow font-semibold text-lg">
                        €
                        {(aw.endPrice ?? aw.price ?? 0).toLocaleString(
                          "de-DE",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>

                    {/* Shipping info */}
                    {item.status !== "pending" && (
                      <div className="text-xs text-white/70 mb-3 space-y-1">
                        <p className="font-medium">{item.fullName}</p>
                        <p>
                          {item.city}, {item.country}
                        </p>
                        {item.trackingNumber && (
                          <p className="flex items-center gap-1">
                            <Truck size={12} />
                            Tracking: {item.trackingNumber}
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => navigate(`/shipping/${aw._id}`)}
                      className="w-full rounded-2xl px-3 py-2 bg-coldYellow text-darkBackground border border-darkBackground hover:bg-buttonPink/80 font-extralight transition"
                      type="button"
                    >
                      {item.status === "pending"
                        ? "Enter shipping address"
                        : "View details"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* My bids */}
      <section className="rounded-2xl border-2 border-black/50 bg-darkBackground/30 backdrop-blur-md shadow-lg shadow-black/70 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-light text-whiteLetter">
            My bids
          </h2>
          <button
            onClick={fetchDetailedOffers}
            disabled={loading}
            className="rounded-xl px-3 py-2 border border-buttonPink bg-greenButton/40 hover:bg-lightRedButton/40 transition text-sm"
            title="Refresh"
            type="button"
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>

        {Array.isArray(myOffers) && myOffers.length > 0 ? (
          <div className="space-y-4">
            {myOffers.map((offer) => {
              const details = artworkDetails[offer.artworkId];
              const artwork = details?.artwork;
              const auctionId = getAuctionIdFromArtwork(artwork);

              // current top status
              let statusBadge = null;
              if (details?.offers?.length) {
                const top = details.offers[0];
                const isWinning =
                  top.userId?._id === user._id || top.userId === user._id;
                statusBadge = <RoleBadgeLike ok={isWinning} />;
              }

              const isRaising = raisingOfferId === offer._id;
              const minBid = computeMinBidForOffer(offer);

              const img = Array.isArray(artwork?.images)
                ? artwork.images[0]
                : artwork?.images || artwork?.imageUrl;

              return (
                <div
                  key={offer._id}
                  className="p-4 rounded-xl border border-white/10 bg-black/20 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: artwork info */}
                    <div className="flex items-center gap-4">
                      {img ? (
                        <img
                          src={img}
                          alt={artwork?.title || "Artwork"}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/64x64?text=Art";
                          }}
                        />
                      ) : null}

                      <div>
                        <h3 className="font-medium text-whiteLetter">
                          {artwork?.title ||
                            `Artwork #${String(offer.artworkId).slice(-6)}`}
                        </h3>
                        <p className="text-sm text-white/70">
                          My bid:{" "}
                          <span className="font-semibold text-white">
                            {offer.amount} €
                          </span>
                        </p>
                        {offer.createdAt && (
                          <p className="text-xs text-white/50">
                            {new Date(offer.createdAt).toLocaleString("de-DE")}
                          </p>
                        )}
                        <div className="mt-1">{statusBadge}</div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-col items-end gap-2 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        {auctionId ? (
                          <Link
                            to={`/auction/${auctionId}`}
                            className="rounded-2xl px-3 py-2 border border-white/20 text-white/90 hover:bg-white/10 text-sm inline-flex items-center gap-1"
                            title="View auction"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                        ) : (
                          <button
                            className="rounded-2xl px-3 py-2 border border-white/10 text-white/50 text-sm"
                            disabled
                          >
                            <Eye size={16} />
                            View
                          </button>
                        )}

                        <button
                          className="rounded-2xl px-3 py-2 bg-coldYellow text-darkBackground border border-darkBackground hover:bg-buttonPink/80 text-sm inline-flex items-center gap-1 font-extralight transition"
                          onClick={() => openRaiseFor(offer)}
                          title="Raise bid"
                          type="button"
                        >
                          <ArrowUpRight size={16} />
                          Raise
                        </button>
                      </div>

                      {/* Inline raise form */}
                      {isRaising && (
                        <div className="mt-2 w-full max-w-[280px]">
                          <label className="text-xs text-white/70">
                            New bid (min. {minBid} €)
                          </label>
                          <div className="flex gap-2 mt-1">
                            <input
                              type="number"
                              min={minBid}
                              step="0.01"
                              value={raisingAmount}
                              onChange={(e) => setRaisingAmount(e.target.value)}
                              className="input input-bordered input-sm flex-1 text-black placeholder-black/60 bg-white"
                            />
                            <button
                              className="rounded-2xl px-3 py-1.5 bg-coldYellow text-darkBackground border border-darkBackground hover:bg-buttonPink/80 text-sm font-extralight transition"
                              onClick={() => submitRaise(offer)}
                              disabled={raiseSubmitting}
                              type="button"
                            >
                              {raiseSubmitting ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : (
                                "Save"
                              )}
                            </button>
                            <button
                              className="rounded-2xl px-3 py-1.5 border border-white/20 text-white/80 hover:bg-white/10 text-sm transition"
                              onClick={cancelRaise}
                              disabled={raiseSubmitting}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                          {raiseError && (
                            <p className="text-xs text-buttonPink mt-1">
                              {raiseError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <Gavel size={48} className="mx-auto mb-3 text-white/40" />
            <p className="text-whiteLetter font-medium">No bids yet</p>
            <p className="text-sm text-white/70">
              Visit the auctions page to place your first bid.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default BuyerDashboard;
