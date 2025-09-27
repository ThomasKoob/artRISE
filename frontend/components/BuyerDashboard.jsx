import React from "react";
import { Gavel } from "lucide-react";
import UserHeader from "./UserHeader";

const BuyerDashboard = ({ user, myOffers }) => {
  return (
    <div className="space-y-6">
      <UserHeader user={user} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-blue-800">Meine Gebote</h3>
          <p className="text-3xl font-bold text-blue-600">
            {Array.isArray(myOffers) ? myOffers.length : 0}
          </p>
          <p className="text-blue-700 text-sm">Aktive/letzte Gebote</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-green-800">
            Gewonnene Auktionen
          </h3>
          <p className="text-3xl font-bold text-green-600">0</p>
          <p className="text-green-700 text-sm">Erfolgreich ersteigert</p>
        </div>
      </div>

      {/* My Bids Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Meine Gebote</h2>
        {Array.isArray(myOffers) && myOffers.length > 0 ? (
          <div className="space-y-3">
            {myOffers.map((offer) => (
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
                  {offer.createdAt && (
                    <p className="text-xs text-gray-500">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  )}
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
    </div>
  );
};

export default BuyerDashboard;
