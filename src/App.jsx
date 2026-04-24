import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { wikiPages } from "./data/wikiPages";

const developmentOrganizations = ["同济大学业余无线电协会", "杭州市艮山中学业余无线电社"];
const developers = ["BH4HVT"];
const contributors = ["BG5EVL", "BH8RAK"];

function includesKeyword(page, keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }

  const content = [page.title, page.category, ...(page.tags || []), page.content]
    .join(" ")
    .toLowerCase();

  return content.includes(normalizedKeyword);
}

export default function App() {
  const [activeView, setActiveView] = useState("home");
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedPageId, setSelectedPageId] = useState(wikiPages[0]?.id || "");

  const categories = useMemo(
    () => ["全部", ...new Set(wikiPages.map((page) => page.category))],
    []
  );

  const filteredPages = useMemo(() => {
    return wikiPages.filter((page) => {
      const categoryMatch =
        selectedCategory === "全部" || page.category === selectedCategory;
      return categoryMatch && includesKeyword(page, keyword);
    });
  }, [keyword, selectedCategory]);

  useEffect(() => {
    if (!filteredPages.find((page) => page.id === selectedPageId)) {
      setSelectedPageId(filteredPages[0]?.id || "");
    }
  }, [filteredPages, selectedPageId]);

  const selectedPage =
    filteredPages.find((page) => page.id === selectedPageId) || filteredPages[0] || null;

  const totalCategories = categories.length - 1;

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
            考点解析
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
              <h1>业余无线电考试知识点</h1>
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

              <label htmlFor="category">分类筛选</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="list-header">
              <span>条目列表</span>
              <strong>{filteredPages.length}</strong>
            </div>

            <nav className="page-list" aria-label="知识点列表">
              {filteredPages.length === 0 ? (
                <p className="empty">没有匹配内容，请调整关键词。</p>
              ) : (
                filteredPages.map((page) => (
                  <button
                    key={page.id}
                    className={selectedPage?.id === page.id ? "page-item active" : "page-item"}
                    onClick={() => setSelectedPageId(page.id)}
                    type="button"
                  >
                    <span>{page.title}</span>
                    <small>{page.category}</small>
                  </button>
                ))
              )}
            </nav>
          </aside>

          <main className="content panel">
            {selectedPage ? (
              <>
                <header className="content-header">
                  <p className="badge">{selectedPage.category}</p>
                  <h2>{selectedPage.title}</h2>
                  <div className="tag-row">
                    {selectedPage.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
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
        </div>
      )}
    </div>
  );
}
