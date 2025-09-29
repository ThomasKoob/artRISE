// components/BuyerDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Gavel, Eye, ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router";
import UserHeader from "./UserHeader";
import { useFavorites } from "../context/FavoritesContext.jsx";

// === Lokale Favoriten (Auktionen) via localStorage ===
const LS_AUCTION_FAV_KEY = "ar_favorites_auctions";
function readFavAuctions() {
  try {
    const raw = localStorage.getItem(LS_AUCTION_FAV_KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const API_BASE = "http://localhost:3001";

/** Robust: Auction-ID aus Artwork extrahieren, egal wie die API sie liefert. */
function getAuctionIdFromArtwork(artwork) {
  if (!artwork || typeof artwork !== "object") return null;
  if (artwork.auctionId && typeof artwork.auctionId === "string") return artwork.auctionId;
  if (artwork.auctionId && typeof artwork.auctionId === "object") {
    return artwork.auctionId._id || artwork.auctionId.id || null;
  }
  if (artwork.auction && typeof artwork.auction === "object") {
    return artwork.auction._id || artwork.auction.id || null;
  }
  return artwork.auctionID || null;
}

/** Kompakte Karte für ein favorisiertes Kunstwerk (nur Bild, Titel, Ansehen). */
function FavoriteArtworkCard({ artwork }) {
  const navigate = useNavigate();
  const auctionId = getAuctionIdFromArtwork(artwork);
  return (
    <div className="relative rounded-xl overflow-hidden bg-black/40 border border-black/30 shadow-sm">
      <img
        src={artwork.images || "https://via.placeholder.com/400x300?text=Artwork"}
        alt={artwork.title || "Artwork"}
        className="w-full h-36 object-cover"
        onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/400x300?text=Artwork")}
      />
      <div className="p-3">
        <div className="text-sm font-medium text-white line-clamp-1">{artwork.title || "Ohne Titel"}</div>
        <div className="mt-2 flex justify-between items-center">
          <button
            className="btn btn-xs btn-outline"
            onClick={() => {
              if (auctionId) navigate(`/auction/${auctionId}`);
            }}
            disabled={!auctionId}
            title={auctionId ? "Ansehen" : "Keine Auktions-ID"}
          >
            <Eye size={14} />
            Ansehen
          </button>
          {typeof artwork.price !== "undefined" && (
            <span className="text-xs text-white/80">
              {(artwork.price || artwork.startPrice || 0).toLocaleString("de-DE")} €
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Kompakte Karte für eine favorisierte Auktion (Bild, Titel, Ansehen). */
function FavoriteAuctionCard({ auction }) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-white/80 border border-gray-200 shadow-sm">
      {auction.bannerImageUrl ? (
        <img
          src={auction.bannerImageUrl}
          alt={auction.title || "Auction"}
          className="w-full h-36 object-cover"
          onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/400x300?text=Auction")}
        />
      ) : (
        <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Keine Vorschau
        </div>
      )}
      <div className="p-3">
        <div className="text-sm font-semibold text-black line-clamp-1">{auction.title || "Auktion"}</div>
        <div className="mt-2 flex justify-between items-center">
          <Link to={`/auction/${auction._id || auction.id}`} className="btn btn-xs btn-primary" title="Ansehen">
            <Eye size={14} />
            Ansehen
          </Link>
          {auction.status && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                String(auction.status).toLowerCase() === "live"
                  ? "bg-green-100 text-green-700"
                  : String(auction.status).toLowerCase() === "ended"
                  ? "bg-gray-100 text-gray-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {auction.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const BuyerDashboard = ({ user, myOffers: initialOffers }) => {
  const [myOffers, setMyOffers] = useState(initialOffers || []);
  const [artworkDetails, setArtworkDetails] = useState({});
  const [loading, setLoading] = useState(false);

  // Favoriten (Artworks) aus Context (localStorage)
  const { ids: favoriteArtworkIds } = useFavorites();
  const [allArtworks, setAllArtworks] = useState([]);

  // Favoriten (Auctions) aus localStorage
  const [favoriteAuctionIds, setFavoriteAuctionIds] = useState(() => readFavAuctions());
  const [allAuctions, setAllAuctions] = useState([]);

  // Inline-Bid (Erhöhen) UI-State
  const [raisingOfferId, setRaisingOfferId] = useState(null);
  const [raisingAmount, setRaisingAmount] = useState("");
  const [raiseError, setRaiseError] = useState("");
  const [raiseSubmitting, setRaiseSubmitting] = useState(false);

  // Alle Artworks & Auctions laden (für Favoriten-Auflösung)
  useEffect(() => {
    (async () => {
      try {
        const [aRes, aucRes] = await Promise.all([
          fetch(`${API_BASE}/api/artworks`, { credentials: "include" }),
          fetch(`${API_BASE}/api/auctions`, { credentials: "include" }),
        ]);
        const aJson = await aRes.json().catch(() => ({}));
        const aucJson = await aucRes.json().catch(() => ({}));
        const aList = Array.isArray(aJson?.data) ? aJson.data : Array.isArray(aJson) ? aJson : [];
        const aucList = Array.isArray(aucJson?.data) ? aucJson.data : Array.isArray(aucJson) ? aucJson : [];
        setAllArtworks(aList);
        setAllAuctions(aucList);
      } catch {
        setAllArtworks([]);
        setAllAuctions([]);
      }
    })();
  }, []);

  // Details für Gebote laden (Artwork + Offers je Artwork)
  const fetchDetailedOffers = async () => {
    if (!myOffers.length) return;
    setLoading(true);
    try {
      const artworkIds = [...new Set(myOffers.map((offer) => offer.artworkId))];
      const promises = artworkIds.map(async (artworkId) => {
        try {
          const [artworkRes, offersRes] = await Promise.all([
            fetch(`${API_BASE}/api/artworks/${artworkId}`, { credentials: "include" }),
            fetch(`${API_BASE}/api/offers/artwork/${artworkId}`, { credentials: "include" }),
          ]);
          const artwork = artworkRes.ok ? await artworkRes.json() : null;
          const offersData = offersRes.ok ? await offersRes.json() : null;
          return {
            artworkId,
            artwork,
            offers: offersData?.success ? offersData.offers : [],
            stats: offersData?.success ? offersData.stats : {},
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

  // Favoriten-Listen auflösen
  const favoriteArtworks = useMemo(() => {
    if (!favoriteArtworkIds.length || !allArtworks.length) return [];
    const set = new Set(favoriteArtworkIds);
    return allArtworks.filter((a) => set.has(a._id));
  }, [favoriteArtworkIds, allArtworks]);

  const favoriteAuctions = useMemo(() => {
    if (!favoriteAuctionIds.length || !allAuctions.length) return [];
    const set = new Set(favoriteAuctionIds);
    return allAuctions.filter((a) => set.has(a._id) || set.has(a.id));
  }, [favoriteAuctionIds, allAuctions]);

  // Hilfsfunktion: minBid berechnen für ein Offer (basierend auf Details)
  const computeMinBidForOffer = (offer) => {
    const details = artworkDetails[offer.artworkId];
    const aw = details?.artwork || {};
    const highest = details?.offers?.[0]?.amount || 0;
    const base = Math.max(aw.price || aw.startPrice || 0, highest);
    const inc = aw.minIncrement || aw.minIncrementDefault || 5;
    return base + inc;
  };

  // Erhöhen klicken → kleine Inline-Form öffnen
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
      const res = await fetch(`${API_BASE}/api/offers/${offer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Aktualisierung fehlgeschlagen");
      }
      // Lokalen Offer-Betrag updaten
      setMyOffers((prev) => prev.map((o) => (o._id === offer._id ? { ...o, amount: amt } : o)));
      // Details neu laden, damit Ranking/Stats stimmen
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-blue-800">Meine Gebote</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-blue-700 text-sm">Aktive Gebote</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-green-800">Führende Gebote</h3>
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

      {/* Meine Gebote + “Ansehen” + “Erhöhen” */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">Meine Gebote</h2>
          <button
            onClick={fetchDetailedOffers}
            disabled={loading}
            className="btn btn-ghost btn-sm"
            title="Aktualisieren"
          >
            {loading ? <span className="loading loading-spinner loading-xs"></span> : "🔄"}
          </button>
        </div>

        {Array.isArray(myOffers) && myOffers.length > 0 ? (
          <div className="space-y-4">
            {myOffers.map((offer) => {
              const details = artworkDetails[offer.artworkId];
              const artwork = details?.artwork;
              const auctionId = getAuctionIdFromArtwork(artwork);

              // Status-Badge
              let statusBadge = null;
              if (details?.offers?.length) {
                const top = details.offers[0];
                const isWinning =
                  top.userId?._id === user._id || top.userId === user._id;
                statusBadge = (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isWinning ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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
                          onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/64x64?text=Art")}
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-black">
                          {artwork?.title || `Kunstwerk #${String(offer.artworkId).slice(-6)}`}
                        </h3>
                        <p className="text-sm text-gray-700">
                          Mein Gebot: <span className="font-semibold">{offer.amount} €</span>
                        </p>
                        {offer.createdAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(offer.createdAt).toLocaleString("de-DE")}
                          </p>
                        )}
                        {/* Status */}
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
                          <button className="btn btn-sm btn-disabled" disabled title="Keine Auktions-ID gefunden">
                            <Eye size={16} />
                            Ansehen
                          </button>
                        )}

                        {/* Neuer Button: Erhöhen */}
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openRaiseFor(offer)}
                          title="Gebot erhöhen"
                        >
                          <ArrowUpRight size={16} />
                          Erhöhen
                        </button>
                      </div>

                      {/* Inline-Erhöhen-Form */}
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
                              title="Speichern"
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
                              title="Abbrechen"
                            >
                              Abbr.
                            </button>
                          </div>
                          {raiseError && (
                            <p className="text-xs text-red-600 mt-1">{raiseError}</p>
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
            <p className="text-black font-medium">Noch keine Gebote abgegeben</p>
            <p className="text-sm text-gray-700">Besuchen Sie die Auktionsseite um Gebote abzugeben</p>
          </div>
        )}
      </div>

      {/* Favoriten – kompakte Karten (Kunstwerke & Auktionen) */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-black">Favoriten</h2>
        </div>

        {/* Kunstwerk-Favoriten */}
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Kunstwerke <span className="text-gray-500">({favoriteArtworks.length})</span>
            </h3>
          </div>
          {favoriteArtworks.length ? (
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 xl-grid-cols-5 xl:grid-cols-6 gap-3">
              {favoriteArtworks.map((art) => (
                <FavoriteArtworkCard key={art._id} artwork={art} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Keine Kunstwerk-Favoriten.</p>
          )}
        </div>

        {/* Auktions-Favoriten */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Auktionen <span className="text-gray-500">({favoriteAuctions.length})</span>
            </h3>
          </div>
          {favoriteAuctions.length ? (
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 xl-grid-cols-5 xl:grid-cols-6 gap-3">
              {favoriteAuctions.map((auc) => (
                <FavoriteAuctionCard key={auc._id || auc.id} auction={auc} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Keine Auktions-Favoriten.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
