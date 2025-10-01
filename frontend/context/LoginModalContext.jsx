// frontend/context/LoginModalContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

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

  const openLogin = () => {
    setIsOpen(true);
    setError("");
  };

  const closeLogin = () => {
    setIsOpen(false);
    setError("");
  };

  const login = async (credentials) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiLogin(credentials);
      const userData = response.data || response;
      setUser(userData);
      setIsOpen(false);
      return userData;
    } catch (err) {
      const errorMessage = err.message || "Login fehlgeschlagen";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      // Logout trotzdem durchführen
      setUser(null);
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
        />
      )}
    </LoginModalContext.Provider>
  );
};
