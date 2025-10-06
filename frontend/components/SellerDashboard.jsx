// components/SellerDashboard.jsx
import React from "react";
import { useNavigate } from "react-router";
import { Plus, Eye } from "lucide-react";
import UserHeader from "./UserHeader";

const SellerDashboard = ({ user, activeMyAuction, onCreateAuction }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <UserHeader user={user} />

      {!activeMyAuction ? (
        // No active auction → Create prompt
        <section className="rounded-2xl border-2 border-black/50 bg-darkBackground/30 backdrop-blur-md shadow-lg shadow-black/70 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-light text-whiteLetter">
                You don’t have an active auction yet
              </h2>
              <p className="text-white/70 text-sm">
                Launch a pop-up auction in minutes and share it with your
                community.
              </p>
            </div>

            <button
              onClick={onCreateAuction}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2
                         bg-coldYellow text-darkBackground border border-darkBackground
                         hover:bg-buttonPink/80 hover:text-darkBackground
                         font-extralight shadow-md transition"
              type="button"
            >
              <Plus size={18} />
              Create auction
            </button>
          </div>
        </section>
      ) : (
        // Active auction card
        <section className="rounded-2xl overflow-hidden border-2 border-black/50 bg-darkBackground/30 backdrop-blur-md shadow-lg shadow-black/70">
          {/* Banner */}
          <div className="w-full h-44 bg-black/20">
            {activeMyAuction.bannerImageUrl ? (
              <img
                src={activeMyAuction.bannerImageUrl}
                alt={activeMyAuction.title || "Auction banner"}
                className="w-full h-44 object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/1200x300?text=Auction";
                }}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-white/50 text-sm">
                No banner image
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6">
            <h1 className="text-sm uppercase tracking-wide text-white/60 mb-1">
              My auction
            </h1>

            {/* IMPORTANT: auction.title is the artist name */}
            <h2 className="text-xl sm:text-2xl font-light text-whiteLetter">
              {activeMyAuction.title}
            </h2>

            {activeMyAuction.endDate && (
              <p className="text-white/70 text-sm mt-2">
                Ends:&nbsp;
                {new Date(activeMyAuction.endDate).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}

            {/* Actions */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                className="rounded-2xl px-3 py-2 bg-coldYellow text-darkBackground
                           border border-darkBackground hover:bg-buttonPink/80
                           font-extralight flex items-center justify-center gap-2 transition"
                onClick={() => navigate(`/auction/${activeMyAuction._id}`)}
                type="button"
                title="Open public auction page"
              >
                <Eye size={16} />
                View
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SellerDashboard;
