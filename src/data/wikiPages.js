import { wikiCatalog } from "./wikiCatalog";

const markdownModules = import.meta.glob("../content/wiki/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default"
});

function collectLeafPageIds(nodes, collector = []) {
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

function collectLeafTitles(nodes, collector = new Map()) {
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

function extractPageId(filePath) {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const segments = normalizedPath.split("/");
  const fileName = segments[segments.length - 1] || "";
  return fileName.replace(/\.md$/i, "");
}

const orderedPageIds = collectLeafPageIds(wikiCatalog, []);
const orderedPageIdSet = new Set(orderedPageIds);
const titleById = collectLeafTitles(wikiCatalog, new Map());

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

const uncatalogedPages = [...contentById.entries()]
  .filter(([id]) => !orderedPageIdSet.has(id))
  .map(([id, content]) => ({
    id,
    title: titleById.get(id) || id,
    content
  }))
  .sort((a, b) => a.id.localeCompare(b.id, "zh-Hans-CN"));

export const wikiPages = [...orderedPages, ...uncatalogedPages];
