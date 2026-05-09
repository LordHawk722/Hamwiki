import { collectLeafPageIds, collectLeafTitles, extractPageId } from '../utils'

/**
 * @description 加载全部文章
 * @param {PageNode} catalog - 目录根节点
 * @param {Object} markdownModules
 * @returns {Array<PageNode>} 目录叶节点
 */
export function loadPages(catalog, markdownModules) {

  const orderedPageIds = collectLeafPageIds(catalog, []);
  const orderedPageIdSet = new Set(orderedPageIds);
  const titleById = collectLeafTitles(catalog, new Map());

  const contentById = new Map(
    Object.entries(markdownModules).map(([filePath, content]) => [extractPageId(filePath), String(content).trim()])
  );

  const orderedPages = orderedPageIds
    .map((id) => {
      const content = contentById.get(id);
      if (!content) {
        return null;
      }

      return {
        id,
        title: titleById.get(id) || id,
        content
      };
    })
    .filter(Boolean);

  const uncataloguedPages = [...contentById.entries()]
    .filter(([id]) => !orderedPageIdSet.has(id))
    .map(([id, content]) => ({
      id,
      title: titleById.get(id) || id,
      content
    }))
    .sort((a, b) => a.id.localeCompare(b.id, "zh-Hans-CN"));

  return [...orderedPages, ...uncataloguedPages];
}
