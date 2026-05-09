export function collectLeafTitles(nodes, collector = new Map()) {
  nodes.forEach((node) => {
    if (Array.isArray(node.children)) {
      collectLeafTitles(node.children, collector);
      return;
    }

    if (node.pageId) {
      collector.set(node.pageId, node.title || node.pageId);
    }
  });

  return collector;
}
