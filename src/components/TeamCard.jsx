export default function TeamCard({ title, items }) {
  return (
    <article className="home-team-card">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>)
}
