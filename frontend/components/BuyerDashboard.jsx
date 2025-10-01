// frontend/components/BuyerDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Gavel, Eye, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import UserHeader from "./UserHeader";
import { getArtworkById, getArtworkOffers, updateOffer } from "../api/api";

const BuyerDashboard = ({ user, myOffers: initialOffers }) => {
  const [myOffers, setMyOffers] = useState(initialOffers || []);
  const [artworkDetails, setArtworkDetails] = useState({});
  const [loading, setLoading] = useState(false);

  /** Robust: Auction-ID aus Artwork extrahieren */
  function getAuctionIdFromArtwork(artwork) {
    if (!artwork || typeof artwork !== "object") return null;
    if (artwork.auctionId && typeof artwork.auctionId === "string")
      return artwork.auctionId;
    if (artwork.auctionId && typeof artwork.auctionId === "object") {
      return artwork.auctionId._id || artwork.auctionId.id || null;
    }
    if (artwork.auction && typeof artwork.auction === "object") {
      return artwork.auction._id || artwork.auction.id || null;
    }
    return artwork.auctionID || null;
  }

  // Details für Gebote laden
  const fetchDetailedOffers = async () => {
    if (!myOffers.length) return;
    setLoading(true);
    try {
      const artworkIds = [...new Set(myOffers.map((offer) => offer.artworkId))];
      const promises = artworkIds.map(async (artworkId) => {
        try {
          const [artworkRaw, offersRaw] = await Promise.all([
            getArtworkById(artworkId),
            getArtworkOffers(artworkId),
          ]);

          const artwork = artworkRaw || null;
          const offersData = offersRaw?.success ? offersRaw.offers : [];
          const stats = offersRaw?.success ? offersRaw.stats : {};

          return {
            artworkId,
            artwork,
            offers: offersData,
            stats,
          };
        } catch {
          return { artworkId, artwork: null, offers: [], stats: {} };
        }
      });

      const results = await Promise.all(promises);
      const detailsMap = {};
      results.forEach((r) => {
        if (r.artworkId) detailsMap[r.artworkId] = r;
      });
      setArtworkDetails(detailsMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myOffers]);

  // Statistiken
  const stats = useMemo(() => {
    if (!myOffers.length) return { total: 0, winning: 0, totalValue: 0 };
    let winning = 0;
    let totalValue = 0;
    myOffers.forEach((offer) => {
      const details = artworkDetails[offer.artworkId];
      if (details?.offers?.length > 0) {
        const isWinning =
          details.offers[0].userId?._id === user._id ||
          details.offers[0].userId === user._id;
        if (isWinning) winning++;
      }
      totalValue += offer.amount || 0;
    });
    return { total: myOffers.length, winning, totalValue };
  }, [myOffers, artworkDetails, user._id]);

  // Hilfsfunktion: minBid berechnen
  const computeMinBidForOffer = (offer) => {
    const details = artworkDetails[offer.artworkId];
    const aw = details?.artwork || {};
    const highest = details?.offers?.[0]?.amount || 0;
    const base = Math.max(aw.price || aw.startPrice || 0, highest);
    const inc = aw.minIncrement || aw.minIncrementDefault || 5;
    return base + inc;
  };

  // Erhöhen States
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

  // PUT /api/offers/:id mit neuem Betrag
  const submitRaise = async (offer) => {
    const min = computeMinBidForOffer(offer);
    const amt = parseFloat(raisingAmount);
    if (isNaN(amt) || amt < min) {
      setRaiseError(`Neues Gebot muss mindestens ${min} € sein.`);
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

  return (
    <div className="space-y-6">
      <UserHeader user={user} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-blue-800">Meine Gebote</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-blue-700 text-sm">Aktive Gebote</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-green-800">
            Führende Gebote
          </h3>
          <p className="text-3xl font-bold text-green-600">{stats.winning}</p>
          <p className="text-green-700 text-sm">Zurzeit höchste Gebote</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-purple-800">Gesamtwert</h3>
          <p className="text-3xl font-bold text-purple-600">
            {stats.totalValue.toLocaleString("de-DE")} €
          </p>
          <p className="text-purple-700 text-sm">Summe aller Gebote</p>
        </div>
      </div>

      {/* Meine Gebote Liste */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">Meine Gebote</h2>
          <button
            onClick={fetchDetailedOffers}
            disabled={loading}
            className="btn btn-ghost btn-sm"
            title="Aktualisieren"
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              "🔄"
            )}
          </button>
        </div>

        {Array.isArray(myOffers) && myOffers.length > 0 ? (
          <div className="space-y-4">
            {myOffers.map((offer) => {
              const details = artworkDetails[offer.artworkId];
              const artwork = details?.artwork;
              const auctionId = getAuctionIdFromArtwork(artwork);

              // Status Badge
              let statusBadge = null;
              if (details?.offers?.length) {
                const top = details.offers[0];
                const isWinning =
                  top.userId?._id === user._id || top.userId === user._id;
                statusBadge = (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isWinning
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {isWinning ? "Höchstes Gebot" : "Überboten"}
                  </span>
                );
              }

              const isRaising = raisingOfferId === offer._id;
              const minBid = computeMinBidForOffer(offer);

              return (
                <div
                  key={offer._id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Links: Artwork Info */}
                    <div className="flex items-center gap-4">
                      {artwork?.images && (
                        <img
                          src={artwork.images}
                          alt={artwork.title}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://via.placeholder.com/64x64?text=Art")
                          }
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-black">
                          {artwork?.title ||
                            `Kunstwerk #${String(offer.artworkId).slice(-6)}`}
                        </h3>
                        <p className="text-sm text-gray-700">
                          Mein Gebot:{" "}
                          <span className="font-semibold">
                            {offer.amount} €
                          </span>
                        </p>
                        {offer.createdAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(offer.createdAt).toLocaleString("de-DE")}
                          </p>
                        )}
                        <div className="mt-1">{statusBadge}</div>
                      </div>
                    </div>

                    {/* Rechts: Aktionen */}
                    <div className="flex flex-col items-end gap-2 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        {auctionId ? (
                          <Link
                            to={`/auction/${auctionId}`}
                            className="btn btn-sm btn-outline"
                            title="Auktion ansehen"
                          >
                            <Eye size={16} />
                            Ansehen
                          </Link>
                        ) : (
                          <button className="btn btn-sm btn-disabled" disabled>
                            <Eye size={16} />
                            Ansehen
                          </button>
                        )}

                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openRaiseFor(offer)}
                          title="Gebot erhöhen"
                        >
                          <ArrowUpRight size={16} />
                          Erhöhen
                        </button>
                      </div>

                      {/* Inline Erhöhen Form */}
                      {isRaising && (
                        <div className="mt-2 w-full max-w-[260px]">
                          <label className="text-xs text-gray-600">
                            Neues Gebot (min. {minBid} €)
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
                              className="btn btn-sm btn-success"
                              onClick={() => submitRaise(offer)}
                              disabled={raiseSubmitting}
                            >
                              {raiseSubmitting ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                "Speichern"
                              )}
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={cancelRaise}
                              disabled={raiseSubmitting}
                            >
                              Abbr.
                            </button>
                          </div>
                          {raiseError && (
                            <p className="text-xs text-red-600 mt-1">
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
          <div className="text-center py-8 text-gray-600">
            <Gavel size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-black font-medium">
              Noch keine Gebote abgegeben
            </p>
            <p className="text-sm text-gray-700">
              Besuchen Sie die Auktionsseite um Gebote abzugeben
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;
