import React from "react";
import { Link } from "react-router";
import { useLoginModal } from "../context/LoginModalContext.jsx";

const NavBar = () => {
  const { openLogin, user, logout } = useLoginModal();

  return (
    <nav className="bg-gray-400  my-2 shadow-md  font-bold sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
      <Link to="/" className="flex items-center">
      <img
        src="/Logo-removebg-preview.png"
        alt="artRise Logo"
        className="h-50 w-auto"  
      />
    </Link>

        {/* Links */}
        <div className="flex space-x-8 text-lg">
          <Link
            to="/"
            className="hover:text-orange-600 tetx-black transition-colors duration-200"
          >
            Home
          </Link>
          <Link
            to="/auction"
            className="hover:text-orange-600 transition-colors duration-200"
          >
            Auction
          </Link>
        </div>

        {/* Auth / User Menu */}
        <div className="flex space-x-4">
          {!user ? (
            <>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg bg-blue-300 hover:bg-indigo-600 transition"
              >
                SignUp
              </Link>
              <button
                onClick={openLogin}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 transition"
              >
                LogIn
              </button>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-red-600 transition"
              >
                LogOut
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
