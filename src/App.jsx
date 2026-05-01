import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { wikiCatalog } from "./data/wikiCatalog";
import { wikiPages } from "./data/wikiPages";
import { preKnowledgeCatalog } from "./data/preKnowledgeCatalog";
import { preKnowledgePages } from "./data/preKnowledgePages";
import collaborationGuidelinesContent from "./content/collaboration/collaboration-guidelines.md?raw";

const developmentOrganizations = ["同济大学业余无线电协会", "杭州市艮山中学业余无线电社"];
const developers = ["BH4HVT", "BH4GZK"];
const contributors = ["BG5EVL", "BH8RAK"];

const collaborationPage = {
  id: "collaboration-guidelines",
  title: "Ham Wiki 文章创作规则与参考模板",
  content: String(collaborationGuidelinesContent).trim()
};

function CopyablePreBlock({ children, ...props }) {
  const [copied, setCopied] = useState(false);
  const firstChild = Children.toArray(children)[0];
  const rawCode = isValidElement(firstChild) ? firstChild.props.children : "";
  const codeText = String(rawCode ?? "").replace(/\n$/, "");

  async function copyCode() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(codeText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = codeText;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="markdown-code-block">
      <button
        type="button"
        className={copied ? "copy-code-btn copied" : "copy-code-btn"}
        onClick={copyCode}
        aria-label="复制代码"
      >
        {copied ? "已复制" : "复制"}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}

function toHeadingId(text) {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/[\\`*_~\[\](){}<>#.:,;!?/"'|]+/g, "")
    .replace(/\s+/g, "-");

  return normalized || "section";
}

function getHeadingText(rawText) {
  return rawText
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[`*_~]+/g, "")
    .trim();
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesKeyword(page, keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }

  const content = [page.title, page.content].join(" ").toLowerCase();

  return content.includes(normalizedKeyword);
}

function filterCatalogNodes(nodes, pageById, keyword) {
  return nodes.reduce((accumulator, node) => {
    if (Array.isArray(node.children)) {
      const filteredChildren = filterCatalogNodes(node.children, pageById, keyword);
      if (filteredChildren.length > 0) {
        accumulator.push({
          ...node,
          children: filteredChildren
        });
      }
      return accumulator;
    }

    const page = pageById.get(node.pageId);
    if (page && includesKeyword(page, keyword)) {
      accumulator.push(node);
    }
    return accumulator;
  }, []);
}

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

function countLeafPages(nodes) {
  return collectLeafPageIds(nodes, []).length;
}

function collectExpandableIds(nodes, collector = []) {
  nodes.forEach((node) => {
    if (Array.isArray(node.children) && node.id) {
      collector.push(node.id);
      collectExpandableIds(node.children, collector);
    }
  });

  return collector;
}

function nodeContainsPage(node, targetPageId) {
  if (!targetPageId) {
    return false;
  }

  if (Array.isArray(node.children)) {
    return node.children.some((child) => nodeContainsPage(child, targetPageId));
  }

  return node.pageId === targetPageId;
}

export default function App() {
  const [activeView, setActiveView] = useState("home");
  const [keyword, setKeyword] = useState("");
  const [articleKeyword, setArticleKeyword] = useState("");
  const [articleMatchElements, setArticleMatchElements] = useState([]);
  const [activeArticleMatchIndex, setActiveArticleMatchIndex] = useState(-1);
  const [selectedPageId, setSelectedPageId] = useState(wikiPages[0]?.id || "");
  const [expandedNodes, setExpandedNodes] = useState(() => collectExpandableIds(wikiCatalog));
  const [preSelectedPageId, setPreSelectedPageId] = useState(preKnowledgePages[0]?.id || "");
  const [preExpandedNodes, setPreExpandedNodes] = useState(() => collectExpandableIds(preKnowledgeCatalog));
  const [articleHeadings, setArticleHeadings] = useState([]);
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const contentRef = useRef(null);
  const isHeadingJumpingRef = useRef(false);
  const jumpTargetHeadingIdRef = useRef("");
  const jumpLockTimerRef = useRef(null);

  function clearHeadingJumpLock() {
    if (jumpLockTimerRef.current) {
      window.clearTimeout(jumpLockTimerRef.current);
      jumpLockTimerRef.current = null;
    }

    isHeadingJumpingRef.current = false;
    jumpTargetHeadingIdRef.current = "";
  }

  const pageById = useMemo(() => {
    return new Map(wikiPages.map((page) => [page.id, page]));
  }, []);

  const preKnowledgePageById = useMemo(() => {
    return new Map(preKnowledgePages.map((page) => [page.id, page]));
  }, []);

  const filteredTree = useMemo(() => {
    return filterCatalogNodes(wikiCatalog, pageById, keyword);
  }, [keyword, pageById]);

  const preKnowledgeVisiblePageIds = useMemo(() => collectLeafPageIds(preKnowledgeCatalog, []), []);

  const visiblePageIds = useMemo(() => collectLeafPageIds(filteredTree, []), [filteredTree]);

  const markdownComponents = useMemo(
    () => ({
      pre({ children, ...props }) {
        return (
          <CopyablePreBlock {...props}>
            {children}
          </CopyablePreBlock>
        );
      }
    }),
    []
  );

  useEffect(() => {
    if (!visiblePageIds.includes(selectedPageId)) {
      setSelectedPageId(visiblePageIds[0] || "");
    }
  }, [visiblePageIds, selectedPageId]);

  useEffect(() => {
    if (!preKnowledgeVisiblePageIds.includes(preSelectedPageId)) {
      setPreSelectedPageId(preKnowledgeVisiblePageIds[0] || "");
    }
  }, [preKnowledgeVisiblePageIds, preSelectedPageId]);

  useEffect(() => {
    setArticleKeyword("");
  }, [selectedPageId]);

  const selectedPage = pageById.get(selectedPageId) || pageById.get(visiblePageIds[0]) || null;
  const selectedPreKnowledgePage =
    preKnowledgePageById.get(preSelectedPageId) || preKnowledgePageById.get(preKnowledgeVisiblePageIds[0]) || null;
  const isWikiView = activeView === "wiki";
  const isCollaborationView = activeView === "collaboration";
  const isPreKnowledgeView = activeView === "preknowledge";
  const hasArticleTocView = isWikiView || isCollaborationView || isPreKnowledgeView;
  const currentArticle = isWikiView
    ? selectedPage
    : isCollaborationView
      ? collaborationPage
      : isPreKnowledgeView
        ? selectedPreKnowledgePage
        : null;

  useEffect(() => {
    return () => {
      clearHeadingJumpLock();
    };
  }, []);

  useEffect(() => {
    if (!hasArticleTocView) {
      clearHeadingJumpLock();
      return;
    }

    if (!currentArticle) {
      clearHeadingJumpLock();
      setArticleHeadings([]);
      setActiveHeadingId("");
      return;
    }

    const contentElement = contentRef.current;
    const renderedHeadings = contentElement
      ? Array.from(contentElement.querySelectorAll(".markdown-body h2, .markdown-body h3, .markdown-body h4"))
      : [];

    if (renderedHeadings.length === 0) {
      clearHeadingJumpLock();
      setArticleHeadings([]);
      setActiveHeadingId("");
      return;
    }

    const duplicatedHeadingCounter = new Map();
    const nextHeadings = renderedHeadings.map((element) => {
      const level = Number(element.tagName.replace("H", ""));
      const text = getHeadingText(element.textContent || "");
      const baseId = toHeadingId(text);
      const duplicateCount = (duplicatedHeadingCounter.get(baseId) || 0) + 1;
      duplicatedHeadingCounter.set(baseId, duplicateCount);

      const id = duplicateCount === 1 ? baseId : `${baseId}-${duplicateCount}`;
      element.id = id;

      return { id, level, text };
    });

    setArticleHeadings(nextHeadings);
    setActiveHeadingId((currentId) => {
      if (currentId && nextHeadings.some((heading) => heading.id === currentId)) {
        return currentId;
      }
      return nextHeadings[0].id;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visibleEntry?.target?.id) {
          const visibleHeadingId = visibleEntry.target.id;

          if (isHeadingJumpingRef.current) {
            if (visibleHeadingId === jumpTargetHeadingIdRef.current) {
              setActiveHeadingId(visibleHeadingId);
              clearHeadingJumpLock();
            }
            return;
          }

          setActiveHeadingId(visibleHeadingId);
        }
      },
      {
        root: contentRef.current,
        rootMargin: "0px 0px -60% 0px",
        threshold: [0, 1]
      }
    );

    nextHeadings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [hasArticleTocView, currentArticle?.id, currentArticle?.content]);

  function toggleNode(nodeId, setNodes) {
    setNodes((current) => {
      if (current.includes(nodeId)) {
        return current.filter((item) => item !== nodeId);
      }
      return [...current, nodeId];
    });
  }

  function renderTreeNode(node, state, depth = 0) {
    const isBranch = Array.isArray(node.children);

    if (!isBranch) {
      const page = state.pageById.get(node.pageId);
      if (!page) {
        return null;
      }

      const title = node.title || page.title;
      return (
        <button
          key={node.pageId}
          className={state.selectedPage?.id === page.id ? "tree-page-item active" : "tree-page-item"}
          onClick={() => state.onSelectPage(page.id)}
          type="button"
        >
          <span>{title}</span>
        </button>
      );
    }

    const nodeId = node.id || node.title;
    const isExpanded = state.expandedNodes.includes(nodeId);
    const hasActivePage = nodeContainsPage(node, state.selectedPage?.id);
    const childCount = countLeafPages(node.children);

    return (
      <section className={depth === 0 ? "tree-group" : "tree-subgroup"} key={nodeId}>
        <button
          type="button"
          className={hasActivePage ? "tree-group-toggle active" : "tree-group-toggle"}
          onClick={() => toggleNode(nodeId, state.onToggleNodes)}
        >
          <span className="tree-group-title">
            <span className="tree-caret" aria-hidden="true">
              {isExpanded ? "▾" : "▸"}
            </span>
            <span>{node.title}</span>
          </span>
          <small className="tree-group-count">{childCount}</small>
        </button>

        {isExpanded ? (
          <div className={depth === 0 ? "tree-pages" : "tree-pages tree-pages-nested"}>
            {node.children.map((child) => renderTreeNode(child, state, depth + 1))}
          </div>
        ) : null}
      </section>
    );
  }

  function jumpToHeading(id) {
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    isHeadingJumpingRef.current = true;
    jumpTargetHeadingIdRef.current = id;
    if (jumpLockTimerRef.current) {
      window.clearTimeout(jumpLockTimerRef.current);
    }
    jumpLockTimerRef.current = window.setTimeout(() => {
      clearHeadingJumpLock();
    }, 1500);

    setActiveHeadingId(id);
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const contentElement = contentRef.current?.querySelector(".markdown-body");

    if (!contentElement) {
      setArticleMatchElements([]);
      setActiveArticleMatchIndex(-1);
      return;
    }

    const existingMarks = contentElement.querySelectorAll("mark.article-hit");
    existingMarks.forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) {
        return;
      }

      parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
      parent.normalize();
    });

    const normalizedKeyword = articleKeyword.trim();
    if (!isWikiView || !selectedPage || !normalizedKeyword) {
      setArticleMatchElements([]);
      setActiveArticleMatchIndex(-1);
      return;
    }

    const matcher = new RegExp(escapeRegExp(normalizedKeyword), "gi");
    const walker = document.createTreeWalker(contentElement, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue?.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        const parent = node.parentElement;
        if (!parent || parent.closest("pre, code, mark, script, style")) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    const nextMatches = [];
    textNodes.forEach((textNode) => {
      const sourceText = textNode.nodeValue || "";
      matcher.lastIndex = 0;

      let match = matcher.exec(sourceText);
      if (!match) {
        return;
      }

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      while (match) {
        const start = match.index;
        const end = start + match[0].length;

        if (start > lastIndex) {
          fragment.appendChild(document.createTextNode(sourceText.slice(lastIndex, start)));
        }

        const mark = document.createElement("mark");
        mark.className = "article-hit";
        mark.textContent = sourceText.slice(start, end);
        fragment.appendChild(mark);
        nextMatches.push(mark);

        lastIndex = end;
        match = matcher.exec(sourceText);
      }

      if (lastIndex < sourceText.length) {
        fragment.appendChild(document.createTextNode(sourceText.slice(lastIndex)));
      }

      textNode.parentNode?.replaceChild(fragment, textNode);
    });

    setArticleMatchElements(nextMatches);
    setActiveArticleMatchIndex(nextMatches.length > 0 ? 0 : -1);
  }, [articleKeyword, isWikiView, selectedPage]);

  useEffect(() => {
    articleMatchElements.forEach((element, index) => {
      element.classList.toggle("article-hit-active", index === activeArticleMatchIndex);
    });

    const activeElement = articleMatchElements[activeArticleMatchIndex];
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [articleMatchElements, activeArticleMatchIndex]);

  function jumpToArticleMatch(step) {
    if (articleMatchElements.length === 0) {
      return;
    }

    setActiveArticleMatchIndex((currentIndex) => {
      const nextIndex = currentIndex + step;
      const total = articleMatchElements.length;
      return (nextIndex % total + total) % total;
    });
  }

  const tocPanel = (
    <aside className="toc panel" aria-label="文章标题导航">
      {articleHeadings.length === 0 ? (
        <p className="empty">当前页面暂无可导航的小节标题。</p>
      ) : (
        <nav className="toc-list">
          {articleHeadings.map((heading) => (
            <button
              key={heading.id}
              type="button"
              className={
                activeHeadingId === heading.id
                  ? `toc-item level-${heading.level} active`
                  : `toc-item level-${heading.level}`
              }
              onClick={() => jumpToHeading(heading.id)}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      )}
    </aside>
  );

  return (
    <div className="site-shell">
      <header className="top-nav panel">
        <div className="top-nav-brand">
          <p className="badge">Ham Wiki</p>
          <strong>中国业余无线电操作能力验证考试知识站</strong>
        </div>
        <nav className="top-nav-links" aria-label="主导航">
          <button
            type="button"
            className={activeView === "home" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveView("home")}
          >
            首页
          </button>
          <button
            type="button"
            className={activeView === "preknowledge" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveView("preknowledge")}
          >
            前置知识
          </button>
          <button
            type="button"
            className={activeView === "wiki" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveView("wiki")}
          >
            考点汇总与解析
          </button>
          <button
            type="button"
            className={activeView === "collaboration" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveView("collaboration")}
          >
            协作规范
          </button>
        </nav>
      </header>

      {activeView === "home" ? (
        <main className="home panel">
          <section className="home-hero">
            <h1>欢迎来到 Ham Wiki!</h1>
            <p>
              <strong>Ham Wiki</strong> 致力于成为一个持续更新的面向业余无线电入门级爱好者的知识型网站，主要内容为基于新版题库和《业余无线电通信》而整理的考点解析，其他内容包括但不限于对相关术语的科普、对常见设备的介绍、对全国各地与业余无线电相关的操作流程的汇总说明等。我们希望通过这个平台，帮助更多的业余无线电爱好者更高效地准备考试，并在未来的业余无线电活动中更加熟练和自信。
              <br/>
              本项目受 <strong>OI Wiki</strong> 和 <strong>Ham CQ 社区</strong>的启发，在此一并致谢。
            </p>
          </section>

          <section className="home-team" aria-label="开发团队与贡献者名单">
            <h2>Team</h2>
            <div className="home-team-grid">
              <article className="home-team-card">
                <h3>组织</h3>
                <ul>
                  {developmentOrganizations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="home-team-card">
                <h3>开发者</h3>
                <ul>
                  {developers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="home-team-card">
                <h3>特别鸣谢</h3>
                <ul>
                  {contributors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>
        </main>
      ) : activeView === "preknowledge" ? (
        <div className="preknowledge-shell">
          <aside className="sidebar panel">
            <div className="brand-block">
              <h1>前置知识</h1>
              <p className="muted">考试题目相关的基础学科知识</p>
            </div>

            <nav className="category-tree" aria-label="前置知识模块导航">
              {preKnowledgeCatalog.map((node) =>
                renderTreeNode(node, {
                  selectedPage: selectedPreKnowledgePage,
                  pageById: preKnowledgePageById,
                  expandedNodes: preExpandedNodes,
                  onToggleNodes: setPreExpandedNodes,
                  onSelectPage: setPreSelectedPageId
                })
              )}
            </nav>
          </aside>

          <main className="content panel" ref={contentRef}>
            {selectedPreKnowledgePage ? (
              <>
                <header className="content-header">
                  <h2>{selectedPreKnowledgePage.title}</h2>
                </header>

                <article className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={markdownComponents}
                  >
                    {selectedPreKnowledgePage.content}
                  </ReactMarkdown>
                </article>
              </>
            ) : (
              <div className="empty-state">
                <h2>暂无可展示条目</h2>
                <p>请先新增前置知识页面数据。</p>
              </div>
            )}
          </main>

          {tocPanel}
        </div>
      ) : activeView === "wiki" ? (
        <div className="app-shell">
          <aside className="sidebar panel">
            <div className="brand-block">
              <h1>考点汇总与解析</h1>
              <p className="muted">基于新版题库和《业余无线电通信》整理</p>
            </div>

            <div className="controls">
              <label htmlFor="search">关键词检索</label>
              <input
                id="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="例如：呼号、天线、电磁兼容"
              />
            </div>

            <nav className="category-tree" aria-label="知识点分层导航">
              {visiblePageIds.length === 0 ? (
                <p className="empty">没有匹配内容，请调整关键词。</p>
              ) : (
                filteredTree.map((node) =>
                  renderTreeNode(node, {
                    selectedPage,
                    pageById,
                    expandedNodes,
                    onToggleNodes: setExpandedNodes,
                    onSelectPage: setSelectedPageId
                  })
                )
              )}
            </nav>
          </aside>

          <main className="content panel" ref={contentRef}>
            {selectedPage ? (
              <>
                <header className="content-header">
                  <h2>{selectedPage.title}</h2>

                  <div className="article-search-row" aria-label="文内搜索">
                    <input
                      value={articleKeyword}
                      onChange={(event) => setArticleKeyword(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") {
                          return;
                        }

                        event.preventDefault();
                        jumpToArticleMatch(event.shiftKey ? -1 : 1);
                      }}
                      placeholder="文内搜索：回车下一个，Shift+回车上一个"
                      aria-label="文内搜索"
                    />

                    <button
                      type="button"
                      className="article-search-btn"
                      onClick={() => jumpToArticleMatch(-1)}
                      disabled={articleMatchElements.length === 0}
                    >
                      上一个
                    </button>

                    <button
                      type="button"
                      className="article-search-btn"
                      onClick={() => jumpToArticleMatch(1)}
                      disabled={articleMatchElements.length === 0}
                    >
                      下一个
                    </button>

                    <span className="article-search-count">
                      {articleMatchElements.length === 0
                        ? "无匹配"
                        : `${activeArticleMatchIndex + 1} / ${articleMatchElements.length}`}
                    </span>
                  </div>
                </header>

                <article className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={markdownComponents}
                  >
                    {selectedPage.content}
                  </ReactMarkdown>
                </article>
              </>
            ) : (
              <div className="empty-state">
                <h2>暂无可展示条目</h2>
                <p>请先清空筛选条件，或新增 Wiki 页面数据。</p>
              </div>
            )}
          </main>

          {tocPanel}
        </div>
      ) : (
        <div className="collaboration-shell">
          <main className="content panel" ref={contentRef}>
            <header className="content-header">
              <h2>{collaborationPage.title}</h2>
            </header>

            <article className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {collaborationPage.content}
              </ReactMarkdown>
            </article>
          </main>

          {tocPanel}
        </div>
      )}
    </div>
  );
}
