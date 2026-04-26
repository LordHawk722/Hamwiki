import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { wikiCatalog } from "./data/wikiCatalog";
import { wikiPages } from "./data/wikiPages";

const developmentOrganizations = ["同济大学业余无线电协会", "杭州市艮山中学业余无线电社"];
const developers = ["BH4HVT", "BH4GZK"];
const contributors = ["BG5EVL", "BH8RAK"];

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
  const [selectedPageId, setSelectedPageId] = useState(wikiPages[0]?.id || "");
  const [expandedNodes, setExpandedNodes] = useState(() => collectExpandableIds(wikiCatalog));
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

  const filteredTree = useMemo(() => {
    return filterCatalogNodes(wikiCatalog, pageById, keyword);
  }, [keyword, pageById]);

  const visiblePageIds = useMemo(() => collectLeafPageIds(filteredTree, []), [filteredTree]);

  useEffect(() => {
    if (!visiblePageIds.includes(selectedPageId)) {
      setSelectedPageId(visiblePageIds[0] || "");
    }
  }, [visiblePageIds, selectedPageId]);

  const selectedPage = pageById.get(selectedPageId) || pageById.get(visiblePageIds[0]) || null;

  useEffect(() => {
    return () => {
      clearHeadingJumpLock();
    };
  }, []);

  useEffect(() => {
    if (activeView !== "wiki") {
      clearHeadingJumpLock();
      return;
    }

    if (!selectedPage) {
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
  }, [activeView, selectedPageId, selectedPage?.content]);

  function toggleNode(nodeId) {
    setExpandedNodes((current) => {
      if (current.includes(nodeId)) {
        return current.filter((item) => item !== nodeId);
      }
      return [...current, nodeId];
    });
  }

  function renderTreeNode(node, depth = 0) {
    const isBranch = Array.isArray(node.children);

    if (!isBranch) {
      const page = pageById.get(node.pageId);
      if (!page) {
        return null;
      }

      const title = node.title || page.title;
      return (
        <button
          key={node.pageId}
          className={selectedPage?.id === page.id ? "tree-page-item active" : "tree-page-item"}
          onClick={() => setSelectedPageId(page.id)}
          type="button"
        >
          <span>{title}</span>
        </button>
      );
    }

    const nodeId = node.id || node.title;
    const isExpanded = expandedNodes.includes(nodeId);
    const hasActivePage = nodeContainsPage(node, selectedPage?.id);
    const childCount = countLeafPages(node.children);

    return (
      <section className={depth === 0 ? "tree-group" : "tree-subgroup"} key={nodeId}>
        <button
          type="button"
          className={hasActivePage ? "tree-group-toggle active" : "tree-group-toggle"}
          onClick={() => toggleNode(nodeId)}
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
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
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
            className={activeView === "wiki" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveView("wiki")}
          >
            考点汇总与解析
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
      ) : (
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
                filteredTree.map((node) => renderTreeNode(node))
              )}
            </nav>
          </aside>

          <main className="content panel" ref={contentRef}>
            {selectedPage ? (
              <>
                <header className="content-header">
                  <h2>{selectedPage.title}</h2>
                </header>

                <article className="markdown-body">
                  <ReactMarkdown>{selectedPage.content}</ReactMarkdown>
                </article>
              </>
            ) : (
              <div className="empty-state">
                <h2>暂无可展示条目</h2>
                <p>请先清空筛选条件，或新增 Wiki 页面数据。</p>
              </div>
            )}
          </main>

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
        </div>
      )}
    </div>
  );
}
