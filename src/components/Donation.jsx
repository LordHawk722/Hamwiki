const repositoryUrl = 'https://github.com/LordHawk722/Hamwiki'

export default function Donation() {
  return (
    <section className="home-cta" aria-label="支持项目">
      <div className="home-cta-copy">
        <span className="home-cta-badge">GitHub Star</span>
        <h2>如果这个项目对你有帮助，可以给仓库点个星星</h2>
        <p>这会帮助更多人发现 Ham Wiki，也能让后续维护更有动力。</p>
      </div>

      <a
        className="home-cta-button"
        href={repositoryUrl}
        target="_blank"
        rel="noreferrer noopener"
      >
        <span className="home-cta-button-icon" aria-hidden="true">★</span>
        去 GitHub 点星
      </a>
    </section>)
}
