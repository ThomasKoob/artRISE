import React from "react";
import { useNavigate } from "react-router";
import { Plus, Eye, Trash2, Images } from "lucide-react";
import UserHeader from "./UserHeader";

const SellerDashboard = ({ user, activeMyAuction, onCreateAuction }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <UserHeader user={user} />

      {!activeMyAuction ? (
        // No Active Auction - Show Create Button
        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Neue Auktion
              </h3>
              <p className="text-green-700">
                Erstellen Sie eine neue Auktion. Sie können später Kunstwerke
                hinzufügen.
              </p>
            </div>
            <button
              onClick={onCreateAuction}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Auktion erstellen
            </button>
          </div>
        </div>
      ) : (
        // Active Auction Card
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {activeMyAuction.bannerImageUrl && (
            <img
              src={activeMyAuction.bannerImageUrl}
              alt={activeMyAuction.title}
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
                Ende: {new Date(activeMyAuction.endDate).toLocaleString()}
              </p>
            )}

            {/* Action Buttons */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded flex items-center justify-center gap-1"
                onClick={() => navigate(`/auction/${activeMyAuction._id}`)}
              >
                <Eye size={16} /> Ansehen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
