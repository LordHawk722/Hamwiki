import { wikiCatalog } from "./wikiCatalog";
import { loadPages } from '../utils'

const markdownModules = import.meta.glob("../content/wiki/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default"
});

export const wikiPages = loadPages(wikiCatalog, markdownModules);

/**
 * @description wiki:页面id到页面的散列表
 * @type {Map<string, PageNode>}
 */
export const pageById = new Map(wikiPages.map((page) => [page.id, page]));