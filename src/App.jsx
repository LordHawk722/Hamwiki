import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { wikiCatalog } from "./data/wikiCatalog";
import { pageById } from './data/wikiPages'
import { preKnowledgeCatalog } from "./data/preKnowledgeCatalog";
import { preKnowledgePages } from "./data/preKnowledgePages";
import collaborationGuidelinesContent from "./content/collaboration/collaboration-guidelines.md?raw";

import "./types"
import { CopyablePreBlock, TocPanel } from "./components";
import {
  toHeadingId,
  getHeadingText,
  escapeRegExp,
  collectExpandableIds,
  collectLeafPageIds,
  nodeContainsPage
} from "./utils";
import { useView, usePage, useKeyword, useHeading } from "./hooks";

const developmentOrganizations = ["同济大学业余无线电协会", "杭州市艮山中学业余无线电社"];
const developers = ["BH4HVT", "BH4GZK", "Hello-world150"];
const contributors = ["BG5EVL", "BH8RAK"];

const collaborationPage = {
  id: "collaboration-guidelines",
  title: "Ham Wiki 文章创作规则与参考模板",
  content: String(collaborationGuidelinesContent).trim()
};

export default function App() {
  const { activeView, setActiveView } = useView();
  const { keyword, setKeyword, filteredTree } = useKeyword();
  const { selectedPage, setSelectedPageId, visiblePageIds } = usePage();
  const { clearHeadingJumpLock, setArticleHeadings, setActiveHeadingId, isHeadingJumpingRef, jumpTargetHeadingIdRef, jumpToHeading, articleHeadings, activeHeadingId } = useHeading();

  /**
   * @type {[string, Function]}
   * articleKeyword - 文内检索关键字
   */
  const [articleKeyword, setArticleKeyword] = useState("");

  /**
   * @type {[Array<HTMLElement>, Function]}
   * articleMatchElements - 匹配高亮
   */
  const [articleMatchElements, setArticleMatchElements] = useState([]);

  /**
   * @type {[number, Function]}
   * activeArticleMatchIndex - 当前匹配高亮的下标
   */
  const [activeArticleMatchIndex, setActiveArticleMatchIndex] = useState(-1);

  /**
   * @type {[string, Function]}
   * expandedNodes - wiki:当前展开节点id
   */
  const [expandedNodes, setExpandedNodes] = useState(() => collectExpandableIds(wikiCatalog));

  /**
   * @type {[string, Function]}
   * preSelectedPageId - pre:当前页面id
   */
  const [preSelectedPageId, setPreSelectedPageId] = useState(preKnowledgePages[0]?.id || "");

  /**
   * @type {[string, Function]}
   * preExpandedNodes - pre:当前展开节点id
   */
  const [preExpandedNodes, setPreExpandedNodes] = useState(() => collectExpandableIds(preKnowledgeCatalog));

  /**
   * @description 内容元素
   * @type {React.RefObject<null>}
   */
  const contentRef = useRef(null);

  /**
   * @description pre:页面id到页面的散列表
   * @type {Map<string, PageNode>}
   */
  const preKnowledgePageById = useMemo(() => {
    return new Map(preKnowledgePages.map((page) => [page.id, page]));
  }, []);

  /**
   * @description pre:页面id数组
   * @type {string[]}
   */
  const preKnowledgeVisiblePageIds = useMemo(() => collectLeafPageIds(preKnowledgeCatalog, []), []);

  /**
   * @description
   * @type {{pre({children: HTMLElement, [p: string]: Object}): HTMLElement}}
   */
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

  /**
   * pre:当前页面不属于检索结果时，设置当前页面为空
   */
  useEffect(() => {
    if (!preKnowledgeVisiblePageIds.includes(preSelectedPageId)) {
      setPreSelectedPageId(preKnowledgeVisiblePageIds[0] || "");
    }
  }, [preKnowledgeVisiblePageIds, preSelectedPageId]);

  /**
   * 切换页面时清空文内搜索关键字
   */
  useEffect(() => {
    setArticleKeyword("");
  }, [selectedPage]);

  const selectedPreKnowledgePage =
    preKnowledgePageById.get(preSelectedPageId) || preKnowledgePageById.get(preKnowledgeVisiblePageIds[0]) || null;

  const isWikiView = activeView === "wiki";
  const isCollaborationView = activeView === "collaboration";
  const isPreKnowledgeView = activeView === "preknowledge";

  const currentArticle = isWikiView ? selectedPage
    : isCollaborationView ? collaborationPage
      : isPreKnowledgeView ? selectedPreKnowledgePage
        : null;

  /**
   * 切换页面
   */
  useEffect(() => {
    // 获取所有标题元素
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
      /**
       * @description 标题等级
       * @type {number}
       */
      const level = Number(element.tagName.replace("H", ""));

      /**
       * @description 标题文本
       * @type {string}
       */
      const text = getHeadingText(element.textContent || "");

      /**
       * @description 标题id
       * @type {string}
       */
      const baseId = toHeadingId(text);

      /**
       * @description 标题出现计数
       * @type {number}
       */
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

    /**
     * @description 随页面滚动切换活动文内标题
     * @type {IntersectionObserver}
     * @todo 消抖
     */
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
  }, [currentArticle?.id, currentArticle?.content]); // 删除 hasTocView

  /**
   * @description 切换目录节点展开状态
   * @param {string} nodeId - 目标节点id
   * @param {Function} setNodes - 根据节点所属视图调用对应setter
   */
  function toggleNode(nodeId, setNodes) {
    // setExpandedNodes | setPreExpandedNodes
    setNodes((current) => {
      if (current.includes(nodeId)) {
        return current.filter((item) => item !== nodeId);
      }
      return [...current, nodeId];
    });
  }

  /**
   * @description 渲染根节点及其后代
   * @param {PageNode} node - 根节点
   * @param state - 状态
   * @param {number} depth - 当前深度
   * @returns {JSX.Element|null}
   */
  function renderTreeNode(node, state, depth = 0) {
    const isBranch = Array.isArray(node.children);

    // 叶节点
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

    // 非叶节点
    const nodeId = node.id || node.title;
    const isExpanded = state.expandedNodes.includes(nodeId);
    const hasActivePage = nodeContainsPage(node, state.selectedPage?.id);
    const childCount = collectLeafPageIds(node.children, []).length;

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

  /**
   * 文内检索初始化
   */
  useEffect(() => {
    const contentElement = contentRef.current?.querySelector(".markdown-body");

    if (!contentElement) {
      setArticleMatchElements([]);
      setActiveArticleMatchIndex(-1);
      return;
    }

    // 取消高亮
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

    // 设置新高亮
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

  /**
   * 切换焦点高亮
   */
  useEffect(() => {
    articleMatchElements.forEach((element, index) => {
      element.classList.toggle("article-hit-active", index === activeArticleMatchIndex);
    });

    const activeElement = articleMatchElements[activeArticleMatchIndex];
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [articleMatchElements, activeArticleMatchIndex]);

  /**
   * @description 切换高亮
   * @param {number} step
   */
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

          <TocPanel articleHeadings={articleHeadings}
                    activeHeadingId={activeHeadingId}
                    jumpToHeading={jumpToHeading}/>
        </div>
      ) : activeView === "wiki" ? (
        <div className="app-shell">
          <aside className="sidebar panel">
            <div className="brand-block">
              <h1>考点汇总与解析</h1>
              <p className="muted">基于新版题库和《业余无线电通信》整理</p>
            </div>

            <div className="controls">
              <label htmlFor="search">全局关键词检索</label>
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

          <TocPanel articleHeadings={articleHeadings}
                    activeHeadingId={activeHeadingId}
                    jumpToHeading={jumpToHeading}/>

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

          <TocPanel articleHeadings={articleHeadings}
                    activeHeadingId={activeHeadingId}
                    jumpToHeading={jumpToHeading}/>

        </div>
      )}
    </div>
  );
}
