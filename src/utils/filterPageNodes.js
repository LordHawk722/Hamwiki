import { includesKeyword } from './includesKeyword.js'

export function filterPageNodes(nodes, pageById, keyword) {
  return nodes.reduce((accumulator, node) => {
    if (Array.isArray(node.children)) {
      const filteredChildren = filterPageNodes(node.children, pageById, keyword);
      if (filteredChildren.length > 0) {
        accumulator.push({
          ...node,
          children: filteredChildren
        });
      }
      return accumulator;
    }

    const page = pageById.get(node.pageId);
    if (page && includesKeyword(page, keyword)) {
      accumulator.push(node);
    }
    return accumulator;
  }, []);
}
