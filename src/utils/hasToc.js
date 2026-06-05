const tocOwners = ['preknowledge', 'wiki', 'collaboration']

export default function hasToc(view) {
  return tocOwners.includes(view)
}
