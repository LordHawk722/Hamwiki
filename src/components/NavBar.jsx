export default function NavBar({ views, activeView, setActiveView }) {
  const buttons = views.map((view) => (
    <button
      key={view.index}
      type="button"
      className={activeView === view.index ? 'nav-btn active' : 'nav-btn'}
      onClick={() => setActiveView(view.index)}>{view.title}</button>
  ))
  return (
    <header className="top-nav panel">
      <div className="top-nav-brand">
        <p className="badge">Ham Wiki</p>
        <strong>中国业余无线电操作能力验证考试知识站</strong>
      </div>
      <nav className="top-nav-links" aria-label="主导航">
        {buttons}
      </nav>
    </header>)
}
