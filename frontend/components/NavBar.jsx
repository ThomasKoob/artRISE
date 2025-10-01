// components/NavBar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  Menu,
  MoreVertical,
  LogOut,
  LogIn,
  UserPlus,
  User,
  ChevronDown,
  X,
} from "lucide-react";
import { useLoginModal } from "../context/LoginModalContext.jsx";

/** DE: Kleine Hilfsfunktion zum Schließen per Klick außerhalb */
function useClickOutside(ref, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, ref]);
}

const NavBar = () => {
  const { openLogin, user, logout, isInitializing } = useLoginModal();

  // DE: Mobile-Menü (Hamburger) Zustand
  const [mobileOpen, setMobileOpen] = useState(false);

  // DE: Kebab-Menü (3 Punkte) Zustand
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  useClickOutside(userMenuRef, () => setUserMenuOpen(false));

  // DE: Beim Navigieren das Mobile-Menü schließen (optional)
  useEffect(() => {
    const closeOnEsc = (e) =>
      e.key === "Escape" && (setMobileOpen(false), setUserMenuOpen(false));
    window.addEventListener("keydown", closeOnEsc);
    return () => window.removeEventListener("keydown", closeOnEsc);
  }, []);

  const isBuyer = user?.role === "buyer";
  const isSeller = user?.role === "seller" || user?.role === "artist";
  const isAdmin = user?.role === "admin";

  return (
    <nav className="bg-darkBackground/90 border-b-2 border-black/50 sticky top-0 z-50 shadow-md">
      {/* TOP BAR */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
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
              <div className="ml-2 font-light text-3xl sm:text-4xl hover:text- text-whiteLetter font-sans">
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
                Gallery
              </Link>
              {/* DE: ggf. mehr Links */}
            </div>
          </div>

          {/* Right: Auth & User-Actions */}
          <div className="flex p- items-center gap-2 sm:gap-3">
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

                {/* Kebab zeigt Auth-Aktionen auf Mobile */}
                <div className="relative md:hidden" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((s) => !s)}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10"
                    aria-label="Open user menu"
                    aria-expanded={userMenuOpen}
                    title="Mehr"
                  >
                    <MoreVertical size={20} className="text-coldYellow" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-lg border border-gray-200 py-1">
                      <Link
                        to="/signup"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-800 text-sm"
                      >
                        <UserPlus size={16} /> SignUp
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          openLogin();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-800 text-sm"
                      >
                        <LogIn size={16} /> LogIn
                      </button>
                    </div>
                  )}
                </div>
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
                  className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-coldYellow text-darkBackground border border-darkBackground hover:bg-buttonPink font-extralight shadow-md transition"
                >
                  <User size={16} className="mr-1" />
                  Dashboard
                </Link>

                {/* Kebab User-Menu (Desktop & Mobile) */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((s) => !s)}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10"
                    aria-label="Open user menu"
                    aria-expanded={userMenuOpen}
                    title="User-Menü"
                  >
                    <MoreVertical size={20} className="text-coldYellow" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg border border-gray-200 py-1">
                      {/* Rolle anzeigen */}
                      <div className="px-3 py-2 text-xs text-gray-500 border-b">
                        Angemeldet als{" "}
                        <span className="font-medium">{user.role}</span>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-800 text-sm"
                      >
                        <User size={16} /> Dashboard
                      </Link>
                      {/* Optional: rollenspezifische Shortcuts */}
                      {isBuyer && (
                        <Link
                          to="/auction"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-800 text-sm"
                        >
                          <ChevronDown size={16} /> Galerie
                        </Link>
                      )}
                      {(isSeller || isAdmin) && (
                        <Link
                          to="/auction"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-800 text-sm"
                        >
                          <ChevronDown size={16} /> Auktionen
                        </Link>
                      )}
                      <div className="my-1 border-t" />
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-red-600 text-sm"
                      >
                        <LogOut size={16} /> LogOut
                      </button>
                    </div>
                  )}
                </div>
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
                  className="block px-3 py-2 rounded-lg bg-coldYellow text-darkBackground hover:bg-buttonPink transition"
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
                  className="block px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
                >
                  <User size={16} className="inline mr-1" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                >
                  <LogOut size={16} className="inline mr-1" />
                  LogOut
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
