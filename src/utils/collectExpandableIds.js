/**
 * @param {Array<PageNode>} nodes - 搜索的根节点
 * @param {string[]} collector - 末尾接收搜索结果
 * @returns {string[]} 非叶节点的id数组
 */
export function collectExpandableIds(nodes, collector = []) {
  nodes.forEach((node) => {
    if (Array.isArray(node.children) && node.id) {
      collector.push(node.id);
      collectExpandableIds(node.children, collector);
    }
  });

  return collector;
}
