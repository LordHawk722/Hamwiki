import { createContext, useContext, useEffect, useState } from "react";
import { loadPages } from "../utils/index.js";
import { CategoryContext } from "./CategoryContext.jsx";

const PagesContext = createContext(null);

export function PagesProvider({ children }) {
  const category = useContext(CategoryContext);
  const [state, setState] = useState({
    pages: [],
    pageById: new Map(),
    catalog: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    if (category !== "wiki" && category !== "preknowledge") return;
    let cancelled = false;
    setState(s => ({ ...s, isLoading: true, error: null }));

    loadPages(category).then(({ pages, pageById, catalog }) => {
      if (!cancelled) {
        setState({ pages, pageById, catalog, isLoading: false, error: null });
      }
    }).catch(err => {
      if (!cancelled) {
        setState({ pages: [], pageById: new Map(), catalog: [], isLoading: false, error: err });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [category]);

  if (state.error) {
    console.error("[PagesContext] loadPages failed:", state.error);
  } else {
    console.log("[PagesContext] pages:", state.pages.length, "catalog:", state.catalog?.length, "isLoading:", state.isLoading);
  }

  return (
    <PagesContext.Provider value={state}>
      {children}
    </PagesContext.Provider>
  );
}

export function usePagesContext() {
  const context = useContext(PagesContext);
  if (!context) {
    throw new Error("usePagesContext must be used within a PagesProvider");
  }
  return context;
}
