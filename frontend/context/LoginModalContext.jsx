import React, { createContext, useContext, useState, useCallback } from "react";
import { LoginModal } from "../components/LoginModal.jsx";

const LoginModalContext = createContext({
  openLogin: () => {},
  closeLogin: () => {},
});
export const useLoginModal = () => useContext(LoginModalContext);

export const LoginModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const openLogin = useCallback(() => setOpen(true), []);
  const closeLogin = useCallback(() => setOpen(false), []);

  const handleLoginSubmit = async (values) => {
    setLoading(true);
    // TODO: hier echten API-Call einbauen
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setOpen(false);
    alert("Logged in as " + values.email);
  };

  return (
    <LoginModalContext.Provider value={{ openLogin, closeLogin }}>
      {children}
      {open && (
        <LoginModal
          onClose={closeLogin}
          onSubmit={handleLoginSubmit}
          loading={loading}
        />
      )}
    </LoginModalContext.Provider>
  );
};
