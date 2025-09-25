import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { LoginModal } from "../components/LoginModal.jsx";

const LoginModalContext = createContext({
  openLogin: () => {},
  closeLogin: () => {},
  login: async () => {},
  logout: async () => {},
  user: null,
  error: "",
  loading: false,
  isInitializing: true, // Neu: zeigt an ob der Auth-Status noch geladen wird
});

export const useLoginModal = () => useContext(LoginModalContext);

export const LoginModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true); // Neu

  const openLogin = useCallback(() => {
    setError("");
    setOpen(true);
  }, []);

  const closeLogin = useCallback(() => setOpen(false), []);

  // Neu: Funktion zum Überprüfen des aktuellen Auth-Status
  const checkAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/auth/me", {
        method: "GET",
        credentials: "include", // Wichtig für Cookies
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Wenn der Token ungültig/abgelaufen ist, User ausloggen
        setUser(null);
      }
    } catch (error) {
      console.log("Auth-Check fehlgeschlagen:", error.message);
      setUser(null);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Neu: useEffect zum Überprüfen des Auth-Status beim Laden der App
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async ({ email, password }) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Ungültige Anmeldedaten");
      }

      // Benutzer aus der Response setzen
      setUser(data.data || data.user || { email });
      setOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:3001/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.log("Logout-Request fehlgeschlagen:", error.message);
    } finally {
      setUser(null);
    }
  };

  return (
    <LoginModalContext.Provider
      value={{
        openLogin,
        closeLogin,
        login,
        logout,
        user,
        error,
        loading,
        isInitializing, // Neu: für Loading-State beim App-Start
      }}
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
