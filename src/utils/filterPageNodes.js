import { includesKeyword } from "./includesKeyword.js";

/**
 * @returns
 */
export function filterPageNodes(nodes, keyword, pageById) {
  return nodes.reduce((accumulator, node) => {
    if (Array.isArray(node.children)) {
      const filteredChildren = filterPageNodes(node.children, keyword, pageById);
      if (filteredChildren.length > 0) {
        accumulator.push({
          ...node,
          children: filteredChildren,
          pageCount: filteredChildren.reduce((cnt, child) => cnt + child.pageCount, 0)
        });
      }
      return accumulator;
    }

    const page = pageById.get(node.pageId);
    if (page && includesKeyword(page, keyword)) {
      accumulator.push({ ...node, pageCount: 1 });
    }
    return accumulator;
  }, []);
}
