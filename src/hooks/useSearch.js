import { useMemo, useState } from "react";
import { filterPageNodes } from "../utils/index.js";
import { usePagesContext } from "../contexts/PagesContext.jsx";

export default function useSearch(category) {
  const [keyword, setKeyword] = useState("");
  const { pageById, catalog } = usePagesContext(category);
  const filteredTree = useMemo(() =>
    filterPageNodes(catalog, keyword, pageById), [category, keyword, pageById]);

  return { keyword, setKeyword, filteredTree };
}
