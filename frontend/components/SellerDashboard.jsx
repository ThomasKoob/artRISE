// components/SellerDashboard.jsx
import React from "react";
import { useNavigate } from "react-router";
import { Plus, Eye, Trash2, Images } from "lucide-react";
import UserHeader from "./UserHeader";

const SellerDashboard = ({
  user,
  activeMyAuction,
  onCreateAuction,
  onCreateArtwork,
  onDeleteAuction,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <UserHeader user={user} />

      {!activeMyAuction ? (
        // DE: Keine aktive Auktion – Call-to-Action zum Erstellen anzeigen
        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                New Auction
              </h3>
              <p className="text-green-700">
                Create a new auction. You can add artworks later.
              </p>
            </div>
            <button
              onClick={onCreateAuction}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Create Auction
            </button>
          </div>
        </div>
      ) : (
        // DE: Aktive Auktion – Karte mit Aktionen anzeigen
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {activeMyAuction.bannerImageUrl && (
            <img
              src={activeMyAuction.bannerImageUrl}
              alt={activeMyAuction.title || "Auction"}
              className="w-full h-44 object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/800x300?text=Auction";
              }}
            />
          )}

          <div className="p-5">
            <h2 className="text-xl font-semibold text-black">
              {activeMyAuction.title}
            </h2>
            <p className="text-gray-700 mt-1 line-clamp-3">
              {activeMyAuction.description}
            </p>
            {activeMyAuction.endDate && (
              <p className="text-sm text-gray-600 mt-2">
                Ends: {new Date(activeMyAuction.endDate).toLocaleString()}
              </p>
            )}

            {/* DE: Aktions-Buttons */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded flex items-center justify-center gap-1"
                onClick={() => navigate(`/auction/${activeMyAuction._id}`)}
              >
                <Eye size={16} /> View
              </button>
              <button
                className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-3 rounded flex items-center justify-center gap-1"
                onClick={onCreateArtwork}
              >
                <Images size={16} /> Add Artwork
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded flex items-center justify-center gap-1"
                onClick={() => onDeleteAuction(activeMyAuction)}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
