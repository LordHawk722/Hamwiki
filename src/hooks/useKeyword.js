import { useMemo, useState } from "react";
import { filterPageNodes } from "../utils/index.js";
import { wikiCatalog } from "../data/wikiCatalog.js";
import { pageById } from "../data/wikiPages.js";

export function useKeyword() {
  /**
   * @type {[string, Function]}
   * keyword - 全局检索关键字
   */
  const [keyword, setKeyword] = useState("");

  /**
   * @description 全局关键词检索结果目录
   */
  const filteredTree = useMemo(() => {
    return filterPageNodes(wikiCatalog, pageById, keyword);
  }, [keyword]);

  return { filteredTree, setKeyword }
}