import { useContext } from "react";
import { DepthContext, ExpandedNodesStateContext } from "./WikiPicker.jsx";
import { nodeContainsPage } from "../utils/index.js";
import { usePagesContext } from "../contexts/PagesContext.jsx";
import { CategoryContext } from "../contexts/CategoryContext.jsx";
import { PageIdContext } from "../contexts/PageIdContext.js";

export default function PickerNode({ node }) {
  const isLeaf = !!node.pageId;
  const [selectedPageId, setPageId] = useContext(PageIdContext);

  const category = useContext(CategoryContext);
  const { pageById } = usePagesContext(category);

  if (isLeaf) {
    const page = pageById.get(node.pageId);
    const active = node.pageId === selectedPageId;
    if (!page) return null;
    return (
      <button
        key={node.pageId}
        className={"tree-page-item" + (active ? " active" : "")}
        onClick={() => setPageId(node.pageId)}
        type="button"
      >
        <span>{node.title ?? "Default Title"}</span>
      </button>
    );
  }

  const [expandedNodes, setExpandedNodes] = useContext(ExpandedNodesStateContext);
  const isExpanded = expandedNodes?.includes(node.id);
  const toggleNode = (nodeId) => {
    setExpandedNodes(
      expandedNodes?.includes(nodeId)
        ? expandedNodes.filter((item) => (item !== nodeId))
        : [...expandedNodes, nodeId]
    );
  };

  const active = nodeContainsPage(node, selectedPageId);

  const depth = useContext(DepthContext);

  return (
    <section className={depth === 0 ? "tree-group" : "tree-subgroup"} key={node.id}>
      <button
        type="button"
        className={"tree-group-toggle" + (active ? " active" : "")}
        onClick={() => toggleNode(node.id)}
      >
        <span className="tree-group-title">
          <span className="tree-caret" aria-hidden="true">{expandedNodes.includes(node.id) ? "▾" : "▸"}</span>
          <span>{node.title}</span>
        </span>
        <small className="tree-group-count">{node.pageCount}</small>
      </button>

      {isExpanded ? (
        <div className={depth === 0 ? "tree-pages" : "tree-pages tree-pages-nested"}>
          <DepthContext value={depth + 1}>
            {node.children.map((child) => {
              return (
                <PickerNode key={child.id ?? child.pageId} node={child}/>
              );
            })}
          </DepthContext>
        </div>
      ) : null}
    </section>
  );

}