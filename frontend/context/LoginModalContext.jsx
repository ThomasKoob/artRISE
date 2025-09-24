import React, { createContext, useContext, useState, useCallback } from "react";
import { LoginModal } from "../components/LoginModal.jsx";

const LoginModalContext = createContext({
  openLogin: () => {},
  closeLogin: () => {},
  login: async () => {},
  logout: async () => {},
  user: null,
  error: "",
  loading: false,
});

export const useLoginModal = () => useContext(LoginModalContext);

export const LoginModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null); // <- Auth-Status

  const openLogin = useCallback(() => {
    setError("");
    setOpen(true);
  }, []);
  const closeLogin = useCallback(() => setOpen(false), []);

  const login = async ({ email, password }) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // wichtig, wenn Session-Cookies
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Ungültige Anmeldedaten");
      }

      // Passe das an deine Backend-Response an:
      // z.B. data.user oder data.profile
      setUser(data.user ?? { email });
      setOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // optional: Logout-Endpoint callen, falls vorhanden
    try {
      await fetch("http://localhost:3001/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // <-- kein Parameter
      /* ignorieren */
    } finally {
      setUser(null);
    }
  };

  return (
    <LoginModalContext.Provider
      value={{ openLogin, closeLogin, login, logout, user, error, loading }}
    >
      {children}
      {open && (
        <LoginModal
          onClose={closeLogin}
          onSubmit={login}
          loading={loading}
          error={error}
        />
      )}
    </LoginModalContext.Provider>
  );
};
