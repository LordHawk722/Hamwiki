import { useHeading } from "../hooks/index.js";
import { useContext, useEffect } from "react";
import { PageIdContext } from "../contexts/PageIdContext.js";

export default function TocPanel({ contentRef }) {
  const [pageId, setPageId] = useContext(PageIdContext);
  const { setContent, articleHeadings, activeHeadingId, jumpToHeading } = useHeading();
  useEffect(() => {
    setContent(contentRef?.current);
  }, [pageId]);

  return (
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
}
