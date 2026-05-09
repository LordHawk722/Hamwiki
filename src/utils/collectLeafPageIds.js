export function collectLeafPageIds(nodes, collector = []) {
  nodes.forEach((node) => {
    if (Array.isArray(node.children)) {
      collectLeafPageIds(node.children, collector);
      return;
    }

    if (node.pageId) {
      collector.push(node.pageId);
    }
  });

  return collector;
}
