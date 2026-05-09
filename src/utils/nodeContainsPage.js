export function nodeContainsPage(node, targetPageId) {
  if (!targetPageId) {
    return false;
  }

  if (Array.isArray(node.children)) {
    return node.children.some((child) => nodeContainsPage(child, targetPageId));
  }

  return node.pageId === targetPageId;
}
