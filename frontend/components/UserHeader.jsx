import React from "react";

const avatarFallback =
  "https://api.dicebear.com/7.x/initials/svg?radius=50&seed=User";

const UserHeader = ({ user }) => {
  const created = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "—";
  const avatar = user?.avatarUrl || avatarFallback;

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center gap-4">
      <img
        src={avatar}
        alt={user?.userName || user?.email || "User"}
        className="w-12 h-12 rounded-full object-cover"
        onError={(e) => (e.currentTarget.src = avatarFallback)}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-black">
            {user?.userName || user?.email || "User"}
          </h2>
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              user?.role === "admin"
                ? "bg-red-100 text-red-700"
                : user?.role === "seller" || user?.role === "artist"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {user?.role || "—"}
          </span>
        </div>
        <p className="text-xs text-gray-600">Mitglied seit: {created}</p>
      </div>
    </div>
  );
};

export default UserHeader;
