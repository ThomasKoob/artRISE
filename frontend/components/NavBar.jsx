// components/NavBar.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, LogOut, LogIn, UserPlus, User, X } from "lucide-react";
import { useLoginModal } from "../context/LoginModalContext.jsx";

const NavBar = () => {
  const { openLogin, user, logout, isInitializing } = useLoginModal();

  // Mobile-Menü (Hamburger) Zustand
  const [mobileOpen, setMobileOpen] = useState(false);

  // ESC schließt Mobile-Menü
  useEffect(() => {
    const closeOnEsc = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEsc);
    return () => window.removeEventListener("keydown", closeOnEsc);
  }, []);

  // ⬇️ NEU: Body-Scroll sperren, solange Drawer offen ist (iPhone UX)
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (mobileOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <nav className="bg-violetHeader/80 backdrop-blur border-b border-buttonPink/20 sticky top-0 z-50 shadow-md shadow-black/70 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 p-4 flex items-center justify-between">
          {/* DE: Links – Burger, Logo, Desktop-Links */}
          <div className="flex items-center gap-4">
            {/* DE: Burger (nur mobil) */}
            <button
              type="button"
              onClick={() => setMobileOpen((s) => !s)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X size={22} className="text-coldYellow" />
              ) : (
                <Menu size={22} className="text-coldYellow" />
              )}
            </button>

            {/* DE: Logo (normales <a>) */}
            <a href="/" className="flex items-center">
              <div
                className="
                  font-light text-3xl sm:text-4xl font-sans whitespace-nowrap
                  text-lavenderViolett
                  border border-transparent rounded-md px-1 
                  transition-colors transition-shadow transition-transform
                  transform-gpu
                  hover:text-coldYellow hover:border-coldYellow hover:shadow-2xl hover:scale-[1.08]
                "
              >
                popAUC
              </div>
            </a>

            {/* Desktop-Navigation */}
            <div className="hidden md:flex items-center gap-6 ml-6 text-whiteLetter text-xl font-extralight">
              <a
                href="/"
                className="hover:text-buttonPink/70 transition-colors"
              >
                Home
              </a>
              <a
                href="/auction"
                className="hover:text-coldYellow transition-colors"
              >
                AUCTIONS{" "}
              </Link>
            </div>
          </div>

          {/* DE: Rechts – Auth / User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isInitializing ? (
              <div className="px-3 py-2 text-gray-300 text-sm">Loading…</div>
            ) : !user ? (
              <>
                <a
                  href="/signup"
                  className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-coldYellow text-darkBackground border-2 border-darkBackground hover:bg-buttonPink font-extralight shadow-md transition"
                >
                  <UserPlus size={18} className="mr-1" />
                  SignUp
                </a>
                <button
                  onClick={openLogin}
                  className="hidden btn btn-sm sm:inline-flex px-3 py-2 rounded-xl bg-coldYellow text-darkBackground border border-darkBackground hover:bg-buttonPink/70 font-extralight shadow-md transition"
                >
                  <LogIn size={12} className="mr-1" />
                  LogIn
                </button>
              </>
            ) : (
              <>
                <span className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-200">
                  Hallo, {user.userName || user.email}
                </span>
                <Link
                  to="/dashboard"
                  className="hidden btn btn-sm sm:inline-flex items-center justify-center w-10 h-10 rounded-xl bg-coldYellow text-darkBackground border border-darkBackground hover:bg-buttonPink shadow-md transition"
                >
                  <User size={20} />
                </Link>
                <button
                  onClick={logout}
                  className="hidden btn btn-sm sm:inline-flex items-center justify-center w-10 h-10 rounded-xl bg-buttonPink/60 text- hover:bg-buttonPink shadow-md transition"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <div
        className={`md:hidden fixed inset-0 z-[70] transition ${
          /* ⬅️ NEU: höherer z-index */
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />
        {/* Panel */}
        <div
          className={`absolute left-0 top-0 h-full w-72 max-w-[80%] bg-whiteWarm border-r border-darkBackground/40 transform transition-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } pt-[env(safe-area-inset-top)] overflow-y-auto`}
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-darkBackground/30">
            <span className="text-xl text-whiteLetter">Menu</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="w-10 h-10 rounded-lg hover:bg-white/10"
              aria-label="Close menu"
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
              HOME
            </Link>
            <Link
              to="/auction"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-whiteLetter hover:bg-white/10"
            >
              AUCTIONS{" "}
            </Link>
          </div>

          {/* Divider */}
          <div className="mx-4 my-3 border-t border-white/10" />

          {/* Auth-Bereich im Drawer */}
          <div className="p-1 space-y-2 ">
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
