import { useEffect, useMemo, useState } from "react";
import { wikiPages, pageById } from "../data/wikiPages.js";
import { collectLeafPageIds } from "../utils/index.js";
import { useKeyword } from './useKeyword.js'

export function usePage() {
  const { filteredTree } = useKeyword();

  /**
   * @type {[string, Function]}
   * selectedPageId - wiki:当前页面id
   */
  const [selectedPageId, setSelectedPageId] = useState(wikiPages[0]?.id || "");

  /**
   * @description wiki:检索结果页面id数组
   * @type {string[]}
   */
  const visiblePageIds = useMemo(() => collectLeafPageIds(filteredTree, []), [filteredTree]);

  /**
   * @description wiki:当前页面
   * @type {PageNode|null}
   */
  const selectedPage = pageById.get(selectedPageId) ?? null;

  /**
   * wiki:当前页面不属于检索结果时，设置当前页面为默认值
   */
  useEffect(() => {
    if (!visiblePageIds.includes(selectedPageId)) {
      setSelectedPageId(visiblePageIds[0] || "");
    }
  }, [visiblePageIds]);

  return { selectedPage, setSelectedPageId, visiblePageIds }
}
