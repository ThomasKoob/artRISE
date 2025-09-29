// components/BuyerDashboard.jsx
// DE: Buyer-Dashboard auf Englisch umgestellt; Kommentare bleiben auf Deutsch.
import React, { useEffect, useMemo, useState } from "react";
import { Gavel, Eye, ArrowUpRight, RotateCw, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router";
import UserHeader from "./UserHeader";
import { useFavorites } from "../context/FavoritesContext.jsx";

const API_BASE = "http://localhost:3001";

// === Lokale Favoriten (Auktionen) via localStorage ===
const LS_AUCTION_FAV_KEY = "ar_favorites_auctions";

// DE: Auction-Favoriten aus localStorage lesen
function readFavAuctions() {
  try {
    const raw = localStorage.getItem(LS_AUCTION_FAV_KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// DE: Auction-Favoriten in localStorage schreiben
function writeFavAuctions(ids) {
  try {
    localStorage.setItem(LS_AUCTION_FAV_KEY, JSON.stringify(ids || []));
  } catch {}
}

/** DE: Auction-ID aus Artwork robust extrahieren */
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

/** DE: Kompakte Karte für ein favorisiertes Kunstwerk mit Entfernen-Button */
function FavoriteArtworkCard({ artwork, onRemove }) {
  const navigate = useNavigate();
  const auctionId = getAuctionIdFromArtwork(artwork);

  return (
    <div className="relative rounded-xl overflow-hidden bg-black/40 border border-black/30 shadow-sm">
      {/* DE: Entfernen-Button (Herz) oben rechts */}
      <button
        type="button"
        className="absolute top-2 right-2 rounded-full bg-white/90 hover:bg-white p-1"
        title="Remove from favorites"
        onClick={() => onRemove?.(artwork._id)}
      >
        <Heart size={14} className="text-rose-500 fill-rose-500" />
      </button>

      <img
        src={artwork.images || "https://via.placeholder.com/400x300?text=Artwork"}
        alt={artwork.title || "Artwork"}
        className="w-full h-36 object-cover"
        onError={(e) =>
          (e.currentTarget.src = "https://via.placeholder.com/400x300?text=Artwork")
        }
      />
      <div className="p-3">
        <div className="text-sm font-medium text-white line-clamp-1">
          {artwork.title || "Untitled"}
        </div>
        <div className="mt-2 flex justify-between items-center">
          <button
            className="btn btn-xs btn-outline"
            onClick={() => auctionId && navigate(`/auction/${auctionId}`)}
            disabled={!auctionId}
            title={auctionId ? "View auction" : "No auction ID"}
          >
            <Eye size={14} />
            View
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

/** DE: Kompakte Karte für eine favorisierte Auktion mit Entfernen-Button */
function FavoriteAuctionCard({ auction, onRemove }) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-white/80 border border-gray-200 shadow-sm">
      {/* DE: Entfernen-Button (Herz) oben rechts */}
      <button
        type="button"
        className="absolute top-2 right-2 rounded-full bg-white/90 hover:bg-white p-1"
        title="Remove from favorites"
        onClick={() => onRemove?.(auction._id || auction.id)}
      >
        <Heart size={14} className="text-rose-500 fill-rose-500" />
      </button>

      {auction.bannerImageUrl ? (
        <img
          src={auction.bannerImageUrl}
          alt={auction.title || "Auction"}
          className="w-full h-36 object-cover"
          onError={(e) =>
            (e.currentTarget.src = "https://via.placeholder.com/400x300?text=Auction")
          }
        />
      ) : (
        <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          No preview
        </div>
      )}
      <div className="p-3">
        <div className="text-sm font-semibold text-black line-clamp-1">
          {auction.title || "Auction"}
        </div>
        <div className="mt-2 flex justify-between items-center">
          <Link
            to={`/auction/${auction._id || auction.id}`}
            className="btn btn-xs btn-primary"
            title="View auction"
          >
            <Eye size={14} />
            View
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
  // DE: State für Gebote und Details
  const [myOffers, setMyOffers] = useState(initialOffers || []);
  const [artworkDetails, setArtworkDetails] = useState({});
  const [loading, setLoading] = useState(false);

  // DE: Favoriten (Artworks) via Context (muss toggle/remove anbieten)
  const { ids: favoriteArtworkIds, toggle: toggleFavArtwork, remove: removeFavArtwork } =
    useFavorites();

  // DE: Für Kartenauflösung
  const [allArtworks, setAllArtworks] = useState([]);
  const [allAuctions, setAllAuctions] = useState([]);

  // DE: Auction-Favoriten (localStorage) + Entfernen
  const [favoriteAuctionIds, setFavoriteAuctionIds] = useState(() => readFavAuctions());
  const removeFavAuction = (id) => {
    // DE: Entfernt die Auktion aus der lokalen Liste + speichert in localStorage
    const next = favoriteAuctionIds.filter((x) => String(x) !== String(id));
    setFavoriteAuctionIds(next);
    writeFavAuctions(next);
  };

  // DE: Inline-Raise UI
  const [raisingOfferId, setRaisingOfferId] = useState(null);
  const [raisingAmount, setRaisingAmount] = useState("");
  const [raiseError, setRaiseError] = useState("");
  const [raiseSubmitting, setRaiseSubmitting] = useState(false);

  // DE: Prop-Änderungen auf State spiegeln
  useEffect(() => {
    setMyOffers(Array.isArray(initialOffers) ? initialOffers : []);
  }, [initialOffers]);

  // DE: Manuelles Reload meiner Gebote vom Server
  const refreshMyOffersFromServer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/offers/me`, { credentials: "include" });
      const j = await res.json().catch(() => []);
      const list = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
      setMyOffers(list);
      await fetchDetailedOffers(list);
    } catch {
      setMyOffers([]);
      setArtworkDetails({});
    } finally {
      setLoading(false);
    }
  };

  // DE: Alle Artworks & Auctions laden (Favoritenauflösung)
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

  // DE: Details der Gebote holen + Geister bereinigen
  const fetchDetailedOffers = async (offersSource) => {
    const source = Array.isArray(offersSource) ? offersSource : myOffers;
    if (!source.length) {
      setArtworkDetails({});
      return;
    }
    setLoading(true);
    try {
      const artworkIds = [...new Set(source.map((offer) => offer.artworkId))];
      const missingArtworks = new Set();

      const promises = artworkIds.map(async (artworkId) => {
        try {
          const [artworkRes, offersRes] = await Promise.all([
            fetch(`${API_BASE}/api/artworks/${artworkId}`, { credentials: "include" }),
            fetch(`${API_BASE}/api/offers/artwork/${artworkId}`, { credentials: "include" }),
          ]);

          if (!artworkRes.ok) {
            // DE: Artwork weg? dann markieren
            missingArtworks.add(String(artworkId));
            return { artworkId, artwork: null, offers: [], stats: {} };
          }

          const artwork = await artworkRes.json();
          const offersData = offersRes.ok ? await offersRes.json() : null;

          return {
            artworkId,
            artwork,
            offers: offersData?.success
              ? offersData.offers
              : Array.isArray(offersData)
              ? offersData
              : [],
            stats: offersData?.success ? offersData.stats : {},
          };
        } catch {
          // DE: Fehler → als missing behandeln
          missingArtworks.add(String(artworkId));
          return { artworkId, artwork: null, offers: [], stats: {} };
        }
      });

      const results = await Promise.all(promises);
      const detailsMap = {};
      results.forEach((r) => {
        if (r.artworkId) detailsMap[r.artworkId] = r;
      });
      setArtworkDetails(detailsMap);

      // DE: Geister-Gebote rauswerfen
      if (missingArtworks.size) {
        setMyOffers((prev) => prev.filter((o) => !missingArtworks.has(String(o.artworkId))));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myOffers]);

  // DE: Statistiken berechnen
  const stats = useMemo(() => {
    if (!myOffers.length) return { total: 0, winning: 0, totalValue: 0 };
    let winning = 0;
    let totalValue = 0;
    myOffers.forEach((offer) => {
      const details = artworkDetails[offer.artworkId];
      if (details?.offers?.length > 0) {
        const isWinning =
          details.offers[0].userId?._id === user._id || details.offers[0].userId === user._id;
        if (isWinning) winning++;
      }
      totalValue += offer.amount || 0;
    });
    return { total: myOffers.length, winning, totalValue };
  }, [myOffers, artworkDetails, user._id]);

  // DE: Favoritenlisten auflösen
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

  // DE: Mindestgebot berechnen
  const computeMinBidForOffer = (offer) => {
    const details = artworkDetails[offer.artworkId];
    const aw = details?.artwork || {};
    const highest = details?.offers?.[0]?.amount || 0;
    const base = Math.max(aw.price || aw.startPrice || 0, highest);
    const inc = aw.minIncrement || aw.minIncrementDefault || 5;
    return base + inc;
  };

  // DE: Inline Raise öffnen/schließen
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

  // DE: Raise absenden
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
      const res = await fetch(`${API_BASE}/api/offers/${offer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Update failed");
      }
      // DE: Lokal updaten und Details neu laden
      setMyOffers((prev) => prev.map((o) => (o._id === offer._id ? { ...o, amount: amt } : o)));
      await fetchDetailedOffers();
      cancelRaise();
    } catch (e) {
      setRaiseError(e.message);
    } finally {
      setRaiseSubmitting(false);
    }
  };

  // DE: Artwork-Favorit entfernen (Context kann remove oder toggle bereitstellen)
  const handleRemoveArtworkFavorite = (artId) => {
    if (typeof removeFavArtwork === "function") {
      removeFavArtwork(artId);
    } else if (typeof toggleFavArtwork === "function") {
      toggleFavArtwork(artId);
    }
  };

  return (
    <div className="space-y-6">
      <UserHeader user={user} />

      {/* DE: Stats-Karten auf Englisch */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-blue-800">My Bids</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-blue-700 text-sm">Active bids</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-green-800">Winning bids</h3>
          <p className="text-3xl font-bold text-green-600">{stats.winning}</p>
          <p className="text-green-700 text-sm">Currently highest bids</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-purple-800">Total value</h3>
          <p className="text-3xl font-bold text-purple-600">
            {stats.totalValue.toLocaleString("de-DE")} €
          </p>
          <p className="text-purple-700 text-sm">Sum of all bids</p>
        </div>
      </div>

      {/* DE: Meine Gebote + View + Raise + echter Refresh */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">My Bids</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshMyOffersFromServer}
              disabled={loading}
              className="btn btn-ghost btn-sm"
              title="Reload from server"
            >
              <RotateCw size={16} />
              Reload
            </button>
            <button
              onClick={() => fetchDetailedOffers()}
              disabled={loading}
              className="btn btn-ghost btn-sm"
              title="Refresh details"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "🔄"
              )}
            </button>
          </div>
        </div>

        {Array.isArray(myOffers) && myOffers.length > 0 ? (
          <div className="space-y-4">
            {myOffers.map((offer) => {
              const details = artworkDetails[offer.artworkId];
              const artwork = details?.artwork;
              const auctionId = getAuctionIdFromArtwork(artwork);

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
                    {isWinning ? "Highest bid" : "Outbid"}
                  </span>
                );
              }

              const isRaising = raisingOfferId === offer._id;
              const minBid = computeMinBidForOffer(offer);

              return (
                <div key={offer._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* DE: Links – Artwork Info */}
                    <div className="flex items-center gap-4">
                      {artwork?.images && (
                        <img
                          src={artwork.images}
                          alt={artwork.title}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) =>
                            (e.currentTarget.src = "https://via.placeholder.com/64x64?text=Art")
                          }
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-black">
                          {artwork?.title || `Artwork #${String(offer.artworkId).slice(-6)}`}
                        </h3>
                        <p className="text-sm text-gray-700">
                          My bid: <span className="font-semibold">{offer.amount} €</span>
                        </p>
                        {offer.createdAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(offer.createdAt).toLocaleString("de-DE")}
                          </p>
                        )}
                        <div className="mt-1">{statusBadge}</div>
                      </div>
                    </div>

                    {/* DE: Rechts – Aktionen */}
                    <div className="flex flex-col items-end gap-2 min-w-[190px]">
                      <div className="flex items-center gap-2">
                        {auctionId ? (
                          <Link
                            to={`/auction/${auctionId}`}
                            className="btn btn-sm btn-outline"
                            title="View auction"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                        ) : (
                          <button className="btn btn-sm btn-disabled" disabled title="No auction ID found">
                            <Eye size={16} />
                            View
                          </button>
                        )}

                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openRaiseFor(offer)}
                          title="Raise bid"
                        >
                          <ArrowUpRight size={16} />
                          Raise
                        </button>
                      </div>

                      {isRaising && (
                        <div className="mt-2 w-full max-w-[260px]">
                          <label className="text-xs text-gray-600">
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
                              className="btn btn-sm btn-success"
                              onClick={() => submitRaise(offer)}
                              disabled={raiseSubmitting}
                              title="Save"
                            >
                              {raiseSubmitting ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                "Save"
                              )}
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={cancelRaise}
                              disabled={raiseSubmitting}
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </div>
                          {raiseError && <p className="text-xs text-red-600 mt-1">{raiseError}</p>}
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
            <p className="text-black font-medium">No bids yet</p>
            <p className="text-sm text-gray-700">Visit an auction page to place your first bid.</p>
          </div>
        )}
      </div>

      {/* DE: Favoriten – kompakte Karten; mit Herz zum Entfernen */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-black">Favorites</h2>
        </div>

        {/* DE: Artwork-Favoriten */}
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Artworks <span className="text-gray-500">({favoriteArtworks.length})</span>
            </h3>
          </div>
          {favoriteArtworks.length ? (
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {favoriteArtworks.map((art) => (
                <FavoriteArtworkCard
                  key={art._id}
                  artwork={art}
                  onRemove={handleRemoveArtworkFavorite}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">No artwork favorites.</p>
          )}
        </div>

        {/* DE: Auktions-Favoriten */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Auctions <span className="text-gray-500">({favoriteAuctions.length})</span>
            </h3>
          </div>
          {favoriteAuctions.length ? (
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {favoriteAuctions.map((auc) => (
                <FavoriteAuctionCard
                  key={auc._id || auc.id}
                  auction={auc}
                  onRemove={removeFavAuction}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">No auction favorites.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
