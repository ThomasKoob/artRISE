import React, { useState } from "react";
import { Plus } from "lucide-react";
import CreateAuctionModal from "../components/CreateAuctionModal.jsx";

const Dashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateAuction = async (auctionData) => {
    try {
      console.log("Auktion wird erstellt:", auctionData);

      // Hier würdest du deine API-Calls machen:
      // 1. Auktion erstellen
      const auctionResponse = await fetch(
        "http://localhost:3001/api/auctions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(auctionData.auction),
        }
      );

      if (!auctionResponse.ok) {
        const errorData = await auctionResponse.json();
        throw new Error(
          errorData.message || "Fehler beim Erstellen der Auktion"
        );
      }

      const auction = await auctionResponse.json();
      console.log("Auktion erstellt:", auction);

      // 2. Kunstwerke zur Auktion hinzufügen
      const artworkPromises = auctionData.artworks.map((artwork) =>
        fetch("http://localhost:3001/api/artworks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...artwork,
            auctionId: auction._id || auction.id,
          }),
        })
      );

      const artworkResults = await Promise.all(artworkPromises);

      // Prüfen ob alle Kunstwerke erfolgreich erstellt wurden
      const failedArtworks = artworkResults.filter((result) => !result.ok);
      if (failedArtworks.length > 0) {
        console.warn(
          `${failedArtworks.length} Kunstwerke konnten nicht erstellt werden`
        );
      }

      const successfulArtworks = artworkResults.length - failedArtworks.length;

      alert(
        `✅ Auktion "${auctionData.auction.title}" erfolgreich erstellt!\n` +
          `📚 ${successfulArtworks} von ${auctionData.artworks.length} Kunstwerken hinzugefügt.`
      );
    } catch (error) {
      console.error("Fehler beim Erstellen der Auktion:", error);
      alert("❌ Fehler beim Erstellen der Auktion: " + error.message);

      // Fehler an das Modal zurückgeben, damit es nicht automatisch schließt
      throw error;
    }
  };

  return (
    <>
      <div className="flex flex-col max-w-[1400px] mx-auto">
        <div className="text-2xl flex flex-wrap mx-auto m-4">
          Künstler Dashboard
        </div>

        <div className="max-w-md mx-auto w-full p-6">
          <p className="text-center mb-6">
            Willkommen in Ihrem Dashboard. Erstellen Sie neue Auktionen und
            verwalten Sie Ihre Kunstwerke.
          </p>

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Neue Auktion erstellen
          </button>

          <div className="mt-8 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Schritt 1</h3>
              <p className="text-sm text-gray-600">
                Geben Sie Details zu Ihrer Auktion ein: Titel, Beschreibung und
                Enddatum.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Schritt 2</h3>
              <p className="text-sm text-gray-600">
                Fügen Sie 1-10 Kunstwerke hinzu mit Bildern, Preisen und
                Beschreibungen.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Fertig!</h3>
              <p className="text-sm text-gray-600">
                Ihre Auktion wird erstellt und ist bereit für Gebote von
                Kunstliebhabern.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CreateAuctionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAuction}
      />
    </>
  );
};

export default Dashboard;
