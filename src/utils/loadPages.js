import { collectLeafPageIds, collectLeafTitles, extractPageId } from "../utils";

const allModules = import.meta.glob("../content/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default"
});

const catalogModules = import.meta.glob("../data/*Catalog.js", { eager: true });

/**
 * @description 加载全部文章
 * @param {"preknowledge" | "wiki"} category - 板块
 * @returns {Promise<Array<PageNode>>} 目录叶节点
 */
export async function loadPages(category) {
  const catalogPath = `../data/${category}Catalog.js`;
  const catalog = catalogModules[catalogPath]?.default;
  if (!catalog) {
    throw new Error(`Catalog not found for category: ${category}`);
  }
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
  const result = { pages, pageById: new Map(pages.map((page) => [page.id, page])), catalog };

  // DEBUG: 暴露到全局便于排查
  if (typeof window !== "undefined") {
    window.__hamwiki_debug = {
      category,
      pagesCount: pages.length,
      orderedPageIds,
      orderedPagesCount: orderedPages.length,
      uncataloguedCount: uncataloguedPages.length,
      contentByIdKeys: [...contentById.keys()],
      catalogKeys: [...titleById.keys()],
    };
    console.log("[loadPages]", category, "pages:", pages.length, "catalog nodes:", catalog.length, window.__hamwiki_debug);
  }

  return result;
}
