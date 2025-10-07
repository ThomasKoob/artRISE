import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState("/dashboard");

  // ✅ NEU: Intent nach Login
  const afterLoginRef = useRef(null);

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

  const openLogin = (arg = "/dashboard") => {
    setIsOpen(true);
    setError("");
    setNeedsVerification(false);

    if (typeof arg === "string") {
      setRedirectAfterLogin(arg);
      afterLoginRef.current = null;
    } else if (arg && typeof arg === "object") {
      const { redirectTo = "/dashboard", afterLogin = null } = arg;
      setRedirectAfterLogin(redirectTo);
      afterLoginRef.current =
        typeof afterLogin === "function" ? afterLogin : null;
    }
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

      console.log("✅ Login successful, redirecting to:", redirectAfterLogin);
      navigate(redirectAfterLogin);

      if (afterLoginRef.current) {
        try {
          afterLoginRef.current(userData);
        } finally {
          afterLoginRef.current = null; // aufräumen
        }
      }

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
      navigate("/");
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
