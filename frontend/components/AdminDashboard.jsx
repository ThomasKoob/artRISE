import React from "react";
import { Users, Gavel, BarChart3 } from "lucide-react";
import UserHeader from "./UserHeader";

const AdminDashboard = ({ user, allUsers, allAuctions }) => {
  return (
    <div className="space-y-6">
      <UserHeader user={user} />

      {/* Stats Cards */}
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

      {/* Users Management Table */}
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
              </tr>
            </thead>
            <tbody>
              {allUsers.slice(0, 20).map((u) => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-black">{u.userName}</td>
                  <td className="p-2 text-black">{u.email}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        u.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : u.role === "seller" || u.role === "artist"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
              {!allUsers.length && (
                <tr>
                  <td colSpan={3} className="p-4 text-gray-500">
                    Keine Benutzer gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
