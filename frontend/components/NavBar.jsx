// components/NavBar.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { Menu, LogOut, LogIn, UserPlus, User, X } from "lucide-react";
import { useLoginModal } from "../context/LoginModalContext.jsx";

/** DE: Kleine Hilfsfunktion zum Schließen per Klick außerhalb */

const NavBar = () => {
  const { openLogin, user, logout, isInitializing } = useLoginModal();

  // DE: Mobile-Menü (Hamburger) Zustand
  const [mobileOpen, setMobileOpen] = useState(false);

  // DE: Beim Navigieren das Mobile-Menü schließen (optional)
  useEffect(() => {
    const closeOnEsc = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEsc);
    return () => window.removeEventListener("keydown", closeOnEsc);
  }, [setMobileOpen]);

  return (
    <nav className=" bg-violetHeader/80 backdrop-blur border-b border-buttonPink/20 sticky top-0 z-50 shadow-md shadow-black/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 p-4 flex items-center justify-between">
          {/* Left: Logo + Desktop Links */}
          <div className="flex items-center gap-4">
            {/* Hamburger (nur mobil) */}
            <button
              type="button"
              onClick={() => setMobileOpen((s) => !s)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              title="Menü"
            >
              {mobileOpen ? (
                <X size={22} className="text-coldYellow" />
              ) : (
                <Menu size={22} className="text-coldYellow" />
              )}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className=" font-light text-3xl sm:text-4xl  text-lavenderViolett hover:text-coldYellow hover:border-1 hover:border-coldYellow hover:shadow-2xl hover:font-bold font-sans">
                popAUC
              </div>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-6 ml-6 text-e99f4c font-sans text-whiteLetter text-xl font-extralight">
              <Link
                to="/"
                className="hover:text-buttonPink/70 rounded-xl transition-colors"
              >
                Home
              </Link>
              <Link
                to="/auction"
                className="hover:text-coldYellow rounded-xl transition-colors"
              >
                Auctions
              </Link>
              {/* DE: ggf. mehr Links */}
            </div>
          </div>

          {/* Right: Auth & User-Actions */}
          <div className="flex  items-center gap-2 sm:gap-3">
            {isInitializing ? (
              <div className="px-3 py-2 text-gray-400 text-sm">Laden…</div>
            ) : !user ? (
              // Nicht eingeloggt: Buttons + Kebab (optional)
              <>
                <Link
                  to="/signup"
                  className="hidden  sm:inline-flex px-3 py-2 rounded-xl bg-coldYellow text-darkBackground border-2 border-darkBackground  hover:bg-buttonPink font-extralight shadow-md transition"
                >
                  <UserPlus size={18} className="mr-1" />
                  SignUp
                </Link>
                <button
                  onClick={openLogin}
                  className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-coldYellow text-darkBackground border border-darkBackground hover:bg-buttonPink font-extralight shadow-md transition"
                >
                  <LogIn size={18} className="mr-1" />
                  LogIn
                </button>
              </>
            ) : (
              // Eingeloggt
              <>
                <span className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-300">
                  Hallo, {user.userName || user.email}
                </span>

                {/* Dashboard (Desktop) */}
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-xl bg-coldYellow text-darkBackground border border-darkBackground hover:bg-buttonPink shadow-md transition"
                >
                  <User size={20} />
                </Link>

                {/* LogOut (Desktop) — ICON ONLY, next to Dashboard */}
                <button
                  onClick={logout}
                  className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-xl bg-buttonPink/80 text-white hover:bg-buttonPink shadow-md transition"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut size={18} />
                  <span className="sr-only">Log out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />
        {/* Panel */}
        <div
          className={`absolute left-0 top-0 h-full w-72 max-w-[80%] bg-whiteWarm border-r border-darkBackground/40 transform transition-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-darkBackground/30">
            <span className="text-xl text-whiteLetter">Menü</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="w-10 h-10 rounded-lg hover:bg-white/10"
            >
              <X size={20} className="text-coldYellow" />
            </button>
          </div>

          {/* Links */}
          <div className="p-4 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-whiteLetter hover:bg-white/10"
            >
              Home
            </Link>
            <Link
              to="/auction"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-whiteLetter hover:bg-white/10"
            >
              Gallery
            </Link>
          </div>

          {/* Divider */}
          <div className="mx-4 my-3 border-t border-white/10" />

          {/* Auth-Bereich im Drawer */}
          <div className="p-4 space-y-2">
            {!isInitializing && !user && (
              <>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg bg-coldYellow text-darkBackground hover:bg-buttonPink transition hover:shadow-2xl"
                >
                  <UserPlus size={16} className="inline mr-1" />
                  SignUp
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openLogin();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-coldYellow text-darkBackground hover:bg-buttonPink transition"
                >
                  <LogIn size={16} className="inline mr-1" />
                  LogIn
                </button>
              </>
            )}

            {!isInitializing && user && (
              <>
                <div className="px-3 py-2 text-sm text-white/70">
                  Eingeloggt als{" "}
                  <span className="font-medium">
                    {user.userName || user.email}
                  </span>
                  <div className="text-xs opacity-80">Rolle: {user.role}</div>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center h-10 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
                >
                  <User size={18} />
                  <span className="sr-only">Dashboard</span>
                </Link>

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="flex items-center justify-center h-10 w-full text-white hover:bg-red-600 transition"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut size={18} />
                  <span className="sr-only">Log out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
