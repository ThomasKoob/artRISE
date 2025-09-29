// context/FavoritesContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Verwaltet Favoriten-IDs (Artwork-IDs) rein im Frontend über localStorage.
 * Key im localStorage: "ar_favorites"
 */
const FavoritesContext = createContext({
  ids: [],
  isFav: () => false,
  toggle: () => {},
  add: () => {},
  remove: () => {},
  reload: () => {},
});

const LS_KEY = "ar_favorites";

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState([]);

  // Favoriten aus localStorage laden
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setIds(arr);
      }
    } catch {
      // ignorieren
    }
  }, []);

  // Helper: localStorage aktualisieren
  const persist = (arr) => {
    setIds(arr);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(arr));
    } catch {
      // ignorieren
    }
  };

  const add = (id) => {
    if (!id) return;
    if (ids.includes(id)) return;
    persist([...ids, id]);
  };

  const remove = (id) => {
    if (!id) return;
    if (!ids.includes(id)) return;
    persist(ids.filter((x) => x !== id));
  };

  const toggle = (id) => {
    if (!id) return;
    if (ids.includes(id)) remove(id);
    else add(id);
  };

  const reload = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr = JSON.parse(raw || "[]");
      if (Array.isArray(arr)) setIds(arr);
    } catch {}
  };

  const value = useMemo(
    () => ({ ids, isFav: (id) => ids.includes(id), toggle, add, remove, reload }),
    [ids]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
