import useSearch from "../hooks/useSearch.js";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { collectExpandableIds } from "../utils/index.js";
import PickerNode from "./PickerNode.jsx";
import { CategoryContext } from "../contexts/CategoryContext.jsx";

export const DepthContext = createContext(0);
export const ExpandedNodesStateContext = createContext([]);

export default function WikiPicker({text}) {
  const category = useContext(CategoryContext);
  const { keyword, setKeyword, filteredTree } = useSearch(category);

  /**
   * @type {[string, Function]}
   * expandedNodes - wiki:当前展开节点id
   */
  const [expandedNodes, setExpandedNodes] = useState([]);
  const prevTreeLengthRef = useRef(filteredTree.length);
  const reloadPendingRef = useRef(false);

  // 当数据从空加载到有内容时，自动展开所有分组
  useEffect(() => { reloadPendingRef.current = true; }, [category]);
  useEffect(() => {
    if (reloadPendingRef || prevTreeLengthRef.current === 0 && filteredTree.length > 0) {
      reloadPendingRef.current = false;
      setExpandedNodes(collectExpandableIds(filteredTree));
    }
    prevTreeLengthRef.current = filteredTree.length;
  }, [filteredTree]);

  return (
    <aside className="sidebar panel">
      <div className="brand-block">
        <h1>{text.title}</h1>
        <p className="muted">{text.subtitle}</p>
      </div>

      <div className="controls">
        <label htmlFor="search">全局关键词检索</label>
        <input
          id="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="例如：呼号、天线、电磁兼容"
        />
      </div>

      <nav className="category-tree" aria-label={text.ariaLabel}>
        {filteredTree.length === 0
          ? (<p className="empty">没有匹配内容，请调整关键词。</p>)
          : (
            <ExpandedNodesStateContext.Provider value={[expandedNodes, setExpandedNodes]}>
              {filteredTree.map((node) => {
                return (
                  <PickerNode key={node.id ?? node.pageId} node={node}/>
                );
              })}
            </ExpandedNodesStateContext.Provider>
          )
        }
      </nav>
    </aside>
  );
}
