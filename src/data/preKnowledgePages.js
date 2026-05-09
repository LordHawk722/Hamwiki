import { preKnowledgeCatalog } from "./preKnowledgeCatalog";
import { loadPages } from '../utils'

const markdownModules = import.meta.glob("../content/preknowledge/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default"
});

export const preKnowledgePages = loadPages(preKnowledgeCatalog, markdownModules);