import { collectLeafPageIds, collectLeafTitles, extractPageId } from "../utils";

const allModules = import.meta.glob("../content/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default"
});

/**
 * @description 加载全部文章
 * @param {"preknowledge" | "wiki"} category - 板块
 * @returns {Promise<Array<PageNode>>} 目录叶节点
 */
export async function loadPages(category) {
  const { default: catalog } = await import((`../data/${category}Catalog`));
  const prefix = `../content/${category}/`;
  const markdownModules = Object.fromEntries(
    Object.entries(allModules).filter(([path]) => path.startsWith(prefix))
  );

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

  const pages = [...orderedPages, ...uncataloguedPages];
  return { pages, pageById: new Map(pages.map((page) => [page.id, page])), catalog };
}
