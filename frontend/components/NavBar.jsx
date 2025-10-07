// components/NavBar.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, LogOut, LogIn, UserPlus, User, X } from "lucide-react";
import { useLoginModal } from "../context/LoginModalContext.jsx";

/* DE: Mobiles Seitenmenü (Drawer) wird per Portal über <body> gerendert */
function MobileDrawer({
  open,
  onClose,
  user,
  isInitializing,
  openLogin,
  logout,
}) {
  if (!open) return null;

  const node = (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* DE: Overlay – deckt die gesamte Seite ab */}
      <div
        className={`fixed inset-0 bg-black/80 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      {/* DE: Linkes Panel */}
      <aside
        className={`fixed left-0 top-0 h-screen w-80 max-w-[85%]
                    bg-violetHeader/95 text-white border-r border-hellPink/40 shadow-2xl
                    transition-transform duration-300 ease-out
                    ${open ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <span className="text-xl">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-white/10"
          >
            <X size={20} className="text-coldYellow" />
          </button>
        </div>

        {/* DE: Navigationslinks */}
        <div className="p-4 space-y-2">
          <a
            href="/"
            onClick={onClose}
            className="block px-3 py-2 rounded-lg text-white hover:bg-white/10"
          >
            Home
          </a>
          <a
            href="/auction"
            onClick={onClose}
            className="block px-3 py-2 rounded-lg text-white hover:bg-white/10"
          >
            Auctions
          </a>
        </div>

        <div className="mx-4 my-3 border-t border-white/20" />

        {/* DE: Auth-Bereich */}
        <div className="p-4 space-y-2">
          {!isInitializing && !user && (
            <>
              <a
                href="/signup"
                onClick={onClose}
                className="block px-3 py-2 rounded-lg bg-coldYellow text-darkBackground hover:bg-buttonPink transition"
              >
                <UserPlus size={16} className="inline mr-1" />
                SignUp
              </a>
              <button
                onClick={() => {
                  onClose();
                  openLogin();
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-coldYellow text-darkBackground hover:bg-buttonPink transition"
              >
                <LogIn size={16} className="inline mr-1" />
                LogIn
              </button>
            </>
          )}

          {!isInitializing && !!user && (
            <>
              <div className="px-3 py-2 text-sm text-white/85">
                Eingeloggt als{" "}
                <span className="font-medium">
                  {user.userName || user.email}
                </span>
                <div className="text-xs opacity-80">Rolle: {user.role}</div>
              </div>

              <a
                href="/dashboard"
                onClick={onClose}
                className="flex items-center justify-center h-10 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
              >
                <User size={18} />
                <span className="sr-only">Dashboard</span>
              </a>

              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="flex items-center justify-center h-10 w-full rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={18} />
                <span className="sr-only">Log out</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );

  return createPortal(node, document.body);
}

const NavBar = () => {
  const { openLogin, user, logout, isInitializing } = useLoginModal();

  // DE: Zustand für mobiles Menü
  const [mobileOpen, setMobileOpen] = useState(false);

  // DE: ESC schließt das Menü
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  // DE: Scroll-Lock für Body bei offenem Drawer
  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", mobileOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [mobileOpen]);

  return (
    <nav className="bg-violetHeader/80 backdrop-blur border-b border-buttonPink/20 sticky top-0 z-[60] shadow-md shadow-black/70">
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
      font-light text-3xl sm:text-4xl font-sans
      text-lavenderViolett
      transition-transform duration-200
      hover:-translate-y-0.5 hover:text-coldYellow
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
                Auctions
              </a>
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

                <a
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-xl bg-coldYellow text-darkBackground border border-darkBackground hover:bg-buttonPink shadow-md transition"
                >
                  <User size={20} />
                </a>

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

      {/* DE: Mobiler Drawer über Portal */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        isInitializing={isInitializing}
        openLogin={openLogin}
        logout={logout}
      />
    </nav>
  );
};

export default NavBar;
