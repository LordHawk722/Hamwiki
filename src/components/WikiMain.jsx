import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { PageIdContext } from "../contexts/PageIdContext.js";
import { useContext, useEffect, useMemo } from "react";
import { escapeRegExp } from "../utils/index.js";
import useFind from "../hooks/useFind.js";
import { MarkdownContext } from "../contexts/MarkdownContext.jsx";
import { usePagesContext } from "../contexts/PagesContext.jsx";

export default function WikiMain({ contentRef }) {
  const markdownComponents = useContext(MarkdownContext);
  const [pageId, setPageId] = useContext(PageIdContext);
  const { pageById } = usePagesContext();
  const page = useMemo(() => pageById.get(pageId), [pageId, pageById]);
  const { keyword, setKeyword, matchElements, setMatchElements, activeIndex, setActiveIndex } = useFind();

  /**
   * @param {number} step
   */
  function jumpToArticleMatch(step) {
    if (matchElements.length === 0) return;

    setActiveIndex((currentIndex) => {
      const nextIndex = currentIndex + step;
      const total = matchElements.length;
      return (nextIndex % total + total) % total;
    });
  }

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
    const contentElement = contentRef.current?.querySelector(".markdown-body");

    if (!contentElement) {
      setMatchElements([]);
      setActiveIndex(-1);
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

    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      setMatchElements([]);
      setActiveIndex(-1);
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

    setMatchElements(nextMatches);
    setActiveIndex(nextMatches.length > 0 ? 0 : -1);
  }, [keyword, pageId]);

  /**
   * 切换焦点高亮
   */
  useEffect(() => {
    matchElements.forEach((element, index) => {
      element.classList.toggle("article-hit-active", index === activeIndex);
    });

    const activeElement = matchElements[activeIndex];
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [matchElements, activeIndex]);

  return (
    <main className="content panel" ref={contentRef}>
      {page ? (
        <>
          <header className="content-header">
            <h2>{page.title}</h2>

            {page.questionIds?.length > 0 && (
              <div className="question-tags-row">
                {page.questionIds.map((qid) => (
                  <span key={qid} className="question-tag">{qid}</span>
                ))}
              </div>
            )}

            <div className="article-search-row" aria-label="文内搜索">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;

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
                disabled={matchElements.length === 0}
              >
                上一个
              </button>

              <button
                type="button"
                className="article-search-btn"
                onClick={() => jumpToArticleMatch(1)}
                disabled={matchElements.length === 0}
              >
                下一个
              </button>

              <span className="article-search-count">
                      {matchElements.length === 0
                        ? "无匹配"
                        : `${activeIndex + 1} / ${matchElements.length}`}
                    </span>
            </div>
          </header>

          <article className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {page.content}
            </ReactMarkdown>
          </article>
        </>
      ) : (
        <div className="empty-state">
          <h2>暂无可展示条目</h2>
          <p>请先清空筛选条件，或新增 Wiki 页面数据。</p>
        </div>
      )}
    </main>);
}