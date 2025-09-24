import React from "react";
import { Link } from "react-router"; // oder 'react-router-dom'
import { useLoginModal } from "../context/LoginModalContext.jsx";

const NavBar = () => {
  const { openLogin, user, logout } = useLoginModal();

  return (
    <nav className="w-full bg-slate-900/80 sticky top-0 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center py-2 relative">
        <p className="text-4xl font-bold mb-2">artRise</p>

        <div className="w-full relative flex justify-center items-center">
          <ul className="flex space-x-6">
            <li>
              <Link className="text-2xl hover:text-slate-500" to="/">
                Home
              </Link>
            </li>
            <li>
              <Link className="text-2xl hover:text-slate-500" to="/auction">
                Auction
              </Link>
            </li>
          </ul>

          <ul className="flex space-x-6 absolute right-0 items-center">
            {!user ? (
              <>
                <li>
                  <Link className="text-2xl hover:text-slate-500" to="/signup">
                    SignUp
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={openLogin}
                    className="text-2xl hover:text-slate-500"
                  >
                    LogIn
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="text-sm text-slate-300">
                  {user.email ?? "Eingeloggt"}
                </li>
                <li>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-2xl hover:text-slate-500"
                  >
                    LogOut
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
