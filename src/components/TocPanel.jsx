/**
 * @description 右侧文内标题板
 * @param param0
 * @param param0.articleHeadings - 文内标题对象
 * @param param0.activeHeadingId - 当前文内标题
 * @param param0.jumpToHeading - 跳转到目标文内标题方法
 * @returns {JSX.Element}
 * @constructor
 */
export function TocPanel({
                           articleHeadings,
                           activeHeadingId,
                           jumpToHeading
                         }) {
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
