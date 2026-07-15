import { collectLeafPageIds, collectLeafTitles, extractPageId } from "../utils";

const allModules = import.meta.glob("../content/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default"
});

const catalogModules = import.meta.glob("../data/*Catalog.js", { eager: true });

/**
 * 匹配 YAML frontmatter: 文件头部的 ---\nquestionIds: [...]\n--- 块
 */
const FRONTMATTER_RE = /^---\r?\nquestionIds:\s*\[([^\]]*)\]\r?\n---\r?\n?/;

/**
 * 从 markdown 内容中解析 frontmatter，提取题号并剥离
 * @param {string} content
 * @returns {{ questionIds: string[], body: string }}
 */
function parseFrontmatter(content) {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return { questionIds: [], body: content };

  const ids = match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { questionIds: ids, body: content.slice(match[0].length) };
}

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

  function buildPage(id, rawContent) {
    const { questionIds, body } = parseFrontmatter(rawContent || "");
    return {
      id,
      title: titleById.get(id) || id,
      content: body,
      questionIds
    };
  }

  const orderedPages = orderedPageIds
    .map((id) => {
      const rawContent = contentById.get(id);
      return rawContent ? buildPage(id, rawContent) : null;
    })
    .filter(Boolean);

  const uncataloguedPages = [...contentById.entries()]
    .filter(([id]) => !orderedPageIdSet.has(id))
    .map(([id, rawContent]) => buildPage(id, rawContent))
    .sort((a, b) => a.id.localeCompare(b.id, "zh-Hans-CN"));

  const pages = [...orderedPages, ...uncataloguedPages];
  return { pages, pageById: new Map(pages.map((page) => [page.id, page])), catalog };
}
