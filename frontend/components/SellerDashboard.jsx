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

        <div className="flex items-center justify-between">
          <button
            onClick={onCreateAuction}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Auktion erstellen
          </button>
        </div>
      ) : (
        // Active Auction Card
        <div className="bg-darkbackground/80 rounded-lg shadow overflow-hidden">
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
            <h1 className="text-xl text-black font-sans">My Auction</h1>
            <h2 className="text-xl font sans font-semibold text-black">
              {activeMyAuction.title}
            </h2>

            {activeMyAuction.endDate && (
              <p className="text-sm text-gray-600 mt-2">
                Ende: {new Date(activeMyAuction.endDate).toLocaleString()}
              </p>
            )}

            {/* Action Buttons */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                className="bg-lightRedButton rounded-2xl hover:bg-blue-600 text-white py-2 px-3  flex items-center justify-center gap-1"
                onClick={() => navigate(`/auction/${activeMyAuction._id}`)}
              >
                <Eye size={16} /> View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
