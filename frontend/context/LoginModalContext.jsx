import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router"; // ✅ Import hinzufügen
import { LoginModal } from "../components/LoginModal";
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
} from "../api/api";

const LoginModalContext = createContext();

export const useLoginModal = () => {
  const context = useContext(LoginModalContext);
  if (!context) {
    throw new Error("useLoginModal must be used within LoginModalProvider");
  }
  return context;
};

export const LoginModalProvider = ({ children }) => {
  const navigate = useNavigate(); // ✅ Hook hinzufügen
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState("/dashboard"); // ✅ NEU

  // User beim App-Start laden
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.log("Not logged in");
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    loadUser();
  }, []);

  // ✅ NEU: openLogin mit optionaler Redirect-URL
  const openLogin = (redirectTo = "/dashboard") => {
    setIsOpen(true);
    setError("");
    setNeedsVerification(false);
    setRedirectAfterLogin(redirectTo); // ✅ Redirect-Ziel speichern
  };

  const closeLogin = () => {
    setIsOpen(false);
    setError("");
    setNeedsVerification(false);
  };

  const login = async (credentials) => {
    setLoading(true);
    setError("");
    setNeedsVerification(false);

    try {
      const response = await apiLogin(credentials);
      const userData = response.data || response;
      setUser(userData);
      setIsOpen(false);

      // ✅ NEU: Automatische Weiterleitung nach erfolgreichem Login
      console.log("✅ Login successful, redirecting to:", redirectAfterLogin);
      navigate(redirectAfterLogin);

      return userData;
    } catch (err) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);

      if (
        err.needsVerification ||
        errorMessage.toLowerCase().includes("verify")
      ) {
        setNeedsVerification(true);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setUser(null);
      navigate("/"); // ✅ Nach Logout zur Startseite
    } catch (err) {
      console.error("Logout error:", err);
      setUser(null);
      navigate("/");
    }
  };

  return (
    <LoginModalContext.Provider
      value={{
        isOpen,
        openLogin,
        closeLogin,
        user,
        login,
        logout,
        isInitializing,
      }}
    >
      {children}
      {isOpen && (
        <LoginModal
          onClose={closeLogin}
          onSubmit={login}
          loading={loading}
          error={error}
          needsVerification={needsVerification}
        />
      )}
    </LoginModalContext.Provider>
  );
};
