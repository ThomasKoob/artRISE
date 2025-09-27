import React, { useState, useEffect } from "react";
import { Gavel, TrendingUp, Crown } from "lucide-react";
import UserHeader from "./UserHeader";

const BuyerDashboard = ({ user, myOffers: initialOffers }) => {
  const [myOffers, setMyOffers] = useState(initialOffers || []);
  const [artworkDetails, setArtworkDetails] = useState({});
  const [loading, setLoading] = useState(false);

  // Detaillierte Gebots-Informationen laden
  const fetchDetailedOffers = async () => {
    if (!myOffers.length) return;

    setLoading(true);
    try {
      const artworkIds = [...new Set(myOffers.map((offer) => offer.artworkId))];

      // Parallel alle Artwork-Details und deren Gebote laden
      const promises = artworkIds.map(async (artworkId) => {
        try {
          const [artworkRes, offersRes] = await Promise.all([
            fetch(`http://localhost:3001/api/artworks/${artworkId}`, {
              credentials: "include",
            }),
            fetch(`http://localhost:3001/api/offers/artwork/${artworkId}`, {
              credentials: "include",
            }),
          ]);

          const artwork = artworkRes.ok ? await artworkRes.json() : null;
          const offersData = offersRes.ok ? await offersRes.json() : null;

          return {
            artworkId,
            artwork,
            offers: offersData?.success ? offersData.offers : [],
            stats: offersData?.success ? offersData.stats : {},
          };
        } catch (error) {
          console.error(
            `Error fetching details for artwork ${artworkId}:`,
            error
          );
          return { artworkId, artwork: null, offers: [], stats: {} };
        }
      });

      const results = await Promise.all(promises);

      const detailsMap = {};
      results.forEach((result) => {
        if (result.artworkId) {
          detailsMap[result.artworkId] = result;
        }
      });

      setArtworkDetails(detailsMap);
    } catch (error) {
      console.error("Error fetching detailed offers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedOffers();
  }, [myOffers]);

  // Statistiken berechnen
  const stats = React.useMemo(() => {
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

    return {
      total: myOffers.length,
      winning,
      totalValue,
    };
  }, [myOffers, artworkDetails, user._id]);

  const getBidStatus = (offer) => {
    const details = artworkDetails[offer.artworkId];
    if (!details?.offers?.length)
      return { status: "unknown", message: "Lade..." };

    const highestBid = details.offers[0];
    const isMyBid =
      highestBid.userId?._id === user._id || highestBid.userId === user._id;

    if (isMyBid) {
      return {
        status: "winning",
        message: "Höchstes Gebot",
        icon: <Crown size={16} className="text-yellow-500" />,
      };
    }

    const myBidRank =
      details.offers.findIndex(
        (o) =>
          (o.userId?._id === user._id || o.userId === user._id) &&
          o.artworkId === offer.artworkId
      ) + 1;

    return {
      status: "outbid",
      message: `Überboten (Platz ${myBidRank})`,
      icon: <TrendingUp size={16} className="text-red-500" />,
    };
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

      {/* My Bids Section */}
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
              const bidStatus = getBidStatus(offer);

              return (
                <div
                  key={offer._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Artwork Image */}
                    {artwork?.images && (
                      <img
                        src={artwork.images}
                        alt={artwork.title}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/64x64?text=Art";
                        }}
                      />
                    )}

                    <div>
                      <h3 className="font-medium text-black">
                        {artwork?.title ||
                          `Kunstwerk #${offer.artworkId.slice(-6)}`}
                      </h3>
                      <p className="text-sm text-gray-700">
                        Mein Gebot:{" "}
                        <span className="font-semibold">{offer.amount} €</span>
                      </p>
                      {artwork?.price && artwork.price !== offer.amount && (
                        <p className="text-sm text-gray-600">
                          Aktueller Preis: {artwork.price} €
                        </p>
                      )}
                      {offer.createdAt && (
                        <p className="text-xs text-gray-500">
                          {new Date(offer.createdAt).toLocaleString("de-DE")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    {/* Bid Status */}
                    <div className="flex items-center gap-2 justify-end">
                      {bidStatus.icon}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bidStatus.status === "winning"
                            ? "bg-green-100 text-green-800"
                            : bidStatus.status === "outbid"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {bidStatus.message}
                      </span>
                    </div>

                    {/* Competition Info */}
                    {details?.offers && details.offers.length > 1 && (
                      <p className="text-xs text-gray-500">
                        {details.offers.length} Gebot
                        {details.offers.length !== 1 ? "e" : ""} insgesamt
                      </p>
                    )}

                    {/* Auction Status */}
                    {artwork && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          artwork.status === "live"
                            ? "bg-green-100 text-green-700"
                            : artwork.status === "ended"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {artwork.status === "live"
                          ? "Live"
                          : artwork.status === "ended"
                          ? "Beendet"
                          : artwork.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Refresh Info */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500">
                Letzte Aktualisierung: {new Date().toLocaleTimeString("de-DE")}
              </p>
              <p className="text-xs text-gray-400">
                Tipp: Nutze den Aktualisieren-Button für Live-Updates
              </p>
            </div>
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

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-black mb-3">Schnellaktionen</h3>
        <div className="flex gap-3 flex-wrap">
          <a href="/auction" className="btn btn-primary btn-sm">
            Alle Auktionen
          </a>
          <button
            onClick={fetchDetailedOffers}
            disabled={loading}
            className="btn btn-outline btn-sm"
          >
            {loading ? "Aktualisiere..." : "Gebote aktualisieren"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
