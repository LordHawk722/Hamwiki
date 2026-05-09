/**
 * 目录节点
 * @typedef {Object} PageNode
 * @property {?string} id - 非叶节点自身id
 * @property {?string} pageId - 叶节点对应页面id
 * @property {string} title - 标题
 * @property {string} content - 内容
 * @property {?Array<PageNode>} children - 子节点数组
 */

/**
 * 文内标题节点
 * @typedef {Object} HeadingNode
 * @property {string} id - 唯一标识
 * @property {string} level - 标题等级
 * @property {string} text - 标题文本
 */