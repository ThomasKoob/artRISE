import React from "react";
import { Link } from "react-router";
import { useLoginModal } from "../context/LoginModalContext.jsx";

const NavBar = () => {
  const { openLogin, user, logout, isInitializing } = useLoginModal();

  return (
    <nav className="bg-darkBackground/90 py-2 shadow-md font-bold sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-0 h-16 flex items-center justify-between max-w-7xl">
        <div className="flex ml-8 font-light text-5xl text-backgroundColor">
          <h1>artRISE</h1>
        </div>
        {/* <Link to="/" className="flex items-center">
          <img
            src="/Logo-removebg-preview2.png"
            alt="artRise Logo"
            className="h-10 ml-8"
          />
        </Link> */}

        {/* Links */}
        <div className="flex space-x-6 text-e99f4c font-sans  text-2xl font-extralight">
          <Link
            to="/"
            className="hover:text-coldYellow hover:border-1 rounded-xl border-buttonPink transition-colors duration-200 w-30 text-center"
          >
            Home
          </Link>

          <Link
            to="/auction"
            className="hover:text-coldYellow hover:border-1 rounded-xl border-buttonPink transition-colors duration-200 w-30 text-center"
          >
            Gallery
          </Link>
        </div>

        {/* Auth / User Menu */}
        <div className=" flex space-x-4 md:p-10 p-4 pl-8  ">
          {isInitializing ? (
            // Loading-State während der Auth-Überprüfung
            <div className="px-4 py-2 text-gray-600">Laden...</div>
          ) : !user ? (
            // Nicht eingeloggt
            <>
              <Link
                to="/signup"
                className="cursor-pointer px-2 py-2 border-1 bg-coldYellow border-darkBackground rounded-xl bg-button1 hover:bg-button2  hover:border-2 hover:border-buttonPink text-darkBackground hover: text-center font-extralight shadow-md hover:opacity-90 transition w-20"
              >
                SignUp
              </Link>
              <button
                onClick={openLogin}
                className="cursor-pointer px-2 py-2 rounded-xl bg-coldYellow border-1 border-darkBackground hover:border-1 hover:bg-buttonPink text-darkBackground text-center font-extralight shadow-md hover:opacity-90 transition w-20"
              >
                LogIn
              </button>
            </>
          ) : (
            // Eingeloggt
            <>
              <span className="px-4 py-2 text-sm text-gray-700">
                Hallo, {user.userName || user.email}!
              </span>
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="cursor-pointer px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
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
