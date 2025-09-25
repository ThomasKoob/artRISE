import React, { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Gavel,
  Palette,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import CreateAuctionModal from "../components/CreateAuctionModal.jsx";
import { useLoginModal } from "../context/LoginModalContext.jsx";

const Dashboard = () => {
  const { user, isInitializing } = useLoginModal();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userAuctions, setUserAuctions] = useState([]);
  const [userOffers, setUserOffers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allAuctions, setAllAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Daten laden basierend auf Rolle
  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (user.role === "seller" || user.role === "artist") {
          // Künstler-spezifische Daten laden
          const auctionsResponse = await fetch(
            "http://localhost:3001/api/auctions/me",
            {
              credentials: "include",
            }
          );
          if (auctionsResponse.ok) {
            const auctions = await auctionsResponse.json();
            setUserAuctions(auctions);
          }
        } else if (user.role === "buyer") {
          // Interessent-spezifische Daten laden
          const offersResponse = await fetch(
            "http://localhost:3001/api/offers/me",
            {
              credentials: "include",
            }
          );
          if (offersResponse.ok) {
            const offers = await offersResponse.json();
            setUserOffers(offers);
          }
        } else if (user.role === "admin") {
          // Admin-spezifische Daten laden
          const [usersResponse, auctionsResponse] = await Promise.all([
            fetch("http://localhost:3001/api/users", {
              credentials: "include",
            }),
            fetch("http://localhost:3001/api/auctions", {
              credentials: "include",
            }),
          ]);

          if (usersResponse.ok) {
            const users = await usersResponse.json();
            setAllUsers(users);
          }

          if (auctionsResponse.ok) {
            const auctions = await auctionsResponse.json();
            setAllAuctions(auctions);
          }
        }
      } catch (error) {
        console.error("Fehler beim Laden der Dashboard-Daten:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const handleCreateAuction = async (auctionData) => {
    try {
      console.log("Auktion wird erstellt:", auctionData);

      const auctionResponse = await fetch(
        "http://localhost:3001/api/auctions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...auctionData.auction,
            artistId: user._id,
          }),
        }
      );

      if (!auctionResponse.ok) {
        const errorData = await auctionResponse.json();
        throw new Error(
          errorData.message || "Fehler beim Erstellen der Auktion"
        );
      }

      const auction = await auctionResponse.json();

      const artworkPromises = auctionData.artworks.map((artwork) =>
        fetch("http://localhost:3001/api/artworks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...artwork,
            auctionId: auction._id || auction.id,
          }),
        })
      );

      await Promise.all(artworkPromises);

      // Auktionen neu laden
      const updatedAuctions = await fetch(
        "http://localhost:3001/api/auctions/me",
        {
          credentials: "include",
        }
      );
      if (updatedAuctions.ok) {
        setUserAuctions(await updatedAuctions.json());
      }

      alert(`✅ Auktion "${auctionData.auction.title}" erfolgreich erstellt!`);
    } catch (error) {
      console.error("Fehler beim Erstellen der Auktion:", error);
      alert("❌ Fehler beim Erstellen der Auktion: " + error.message);
      throw error;
    }
  };

  // Admin Dashboard
  const AdminDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-red-600" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
          <p className="text-gray-700">Systemverwaltung und Übersicht</p>
        </div>
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <Users className="text-blue-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-black">Benutzer</h3>
              <p className="text-2xl font-bold text-blue-600">
                {allUsers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <Gavel className="text-green-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-black">Auktionen</h3>
              <p className="text-2xl font-bold text-green-600">
                {allAuctions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-purple-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-black">Aktivität</h3>
              <p className="text-2xl font-bold text-purple-600">Live</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benutzer-Tabelle */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Benutzer verwalten
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 text-black font-semibold">Name</th>
                <th className="text-left p-2 text-black font-semibold">
                  E-Mail
                </th>
                <th className="text-left p-2 text-black font-semibold">
                  Rolle
                </th>
                <th className="text-left p-2 text-black font-semibold">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {allUsers.slice(0, 10).map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-black">{user.userName}</td>
                  <td className="p-2 text-black">{user.email}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : user.role === "seller"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-2">
                    <button className="text-blue-600 hover:text-blue-800 mr-2">
                      <Edit size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Künstler Dashboard
  const ArtistDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="text-green-600" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-black">Künstler Dashboard</h1>
          <p className="text-gray-700">
            Verwalten Sie Ihre Auktionen und Kunstwerke
          </p>
        </div>
      </div>

      {/* Auktion erstellen Button */}
      <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              Neue Auktion
            </h3>
            <p className="text-green-700">
              Erstellen Sie eine neue Auktion mit bis zu 10 Kunstwerken
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Auktion erstellen
          </button>
        </div>
      </div>

      {/* Meine Auktionen */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Meine Auktionen ({userAuctions.length})
        </h2>
        {userAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userAuctions.map((auction) => (
              <div
                key={auction._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <img
                  src={
                    auction.bannerImageUrl ||
                    "https://via.placeholder.com/300x200"
                  }
                  alt={auction.title}
                  className="w-full h-32 object-cover rounded mb-3"
                />
                <h3 className="font-semibold text-lg mb-2 text-black">
                  {auction.title}
                </h3>
                <p className="text-gray-700 text-sm mb-2">
                  {auction.description.slice(0, 100)}...
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Ende: {new Date(auction.endDate).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm flex items-center justify-center gap-1">
                    <Eye size={14} />
                    Ansehen
                  </button>
                  <button className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded text-sm flex items-center justify-center gap-1">
                    <Edit size={14} />
                    Bearbeiten
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <Palette size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-black font-medium">
              Noch keine Auktionen erstellt
            </p>
            <p className="text-sm text-gray-700">
              Klicken Sie oben auf "Auktion erstellen" um zu beginnen
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Interessent Dashboard
  const BuyerDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Gavel className="text-blue-600" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-black">
            Interessent Dashboard
          </h1>
          <p className="text-gray-700">
            Ihre Gebote und interessanten Auktionen
          </p>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-blue-800">Meine Gebote</h3>
          <p className="text-3xl font-bold text-blue-600">
            {userOffers.length}
          </p>
          <p className="text-blue-700 text-sm">Aktive Gebote</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-green-800">
            Gewonnene Auktionen
          </h3>
          <p className="text-3xl font-bold text-green-600">0</p>
          <p className="text-green-700 text-sm">Erfolgreich ersteigert</p>
        </div>
      </div>

      {/* Meine Gebote */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Meine Gebote</h2>
        {userOffers.length > 0 ? (
          <div className="space-y-3">
            {userOffers.map((offer) => (
              <div
                key={offer._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h3 className="font-medium text-black">
                    Kunstwerk #{offer.artworkId}
                  </h3>
                  <p className="text-sm text-gray-700">
                    Gebot: {offer.amount}€
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Aktiv
                  </span>
                </div>
              </div>
            ))}
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

      {/* Empfohlene Auktionen */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Aktuelle Auktionen
        </h2>
        <p className="text-gray-700">
          Entdecken Sie neue Kunstwerke in laufenden Auktionen
        </p>
        <button className="mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
          Alle Auktionen ansehen
        </button>
      </div>
    </div>
  );

  // Loading State während Authentifizierung
  if (isInitializing) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Lade Benutzerdaten...</p>
        </div>
      </div>
    );
  }

  // Loading State für Dashboard-Daten
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Nicht eingeloggt
  if (!user) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-black mb-4">
          Bitte melden Sie sich an
        </h1>
        <p className="text-gray-700">
          Sie müssen eingeloggt sein, um das Dashboard zu verwenden.
        </p>
      </div>
    );
  }

  // Dashboard basierend auf Rolle rendern
  const renderDashboard = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard />;
      case "seller":
      case "artist":
        return <ArtistDashboard />;
      case "buyer":
        return <BuyerDashboard />;
      default:
        return <BuyerDashboard />; // Fallback
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-8">{renderDashboard()}</div>

      {/* Create Auction Modal - nur für Künstler */}
      {(user.role === "seller" || user.role === "artist") && (
        <CreateAuctionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAuction}
        />
      )}
    </>
  );
};

export default Dashboard;
