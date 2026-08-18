import TeamCard from './TeamCard.jsx'

const developmentOrganizations = ['同济大学业余无线电协会', '杭州市艮山中学业余无线电社']
const developers = ['BH4HVT', 'Rosalie1723', 'BH4GZK', 'BH8HJY']
const contributors = ['BG5EVL', 'BH8RAK']

const teams = [
  {
    title: '组织',
    items: developmentOrganizations
  },
  {
    title: '开发者',
    items: developers
  },
  {
    title: '特别鸣谢',
    items: contributors
  }
]

export default function TeamBoard() {
  return (
    <section className="home-team" aria-label="开发团队与贡献者名单">
      <h2>Team</h2>
      <div className="home-team-grid">
        {teams.map((team) => (
          <TeamCard key={team.title}
                    title={team.title}
                    items={team.items}></TeamCard>))}
      </div>
    </section>  )
}
