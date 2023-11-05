let nodes = {}
let links = {}
let selectedNode = {}
// let hoveredNode = {}

function updateQueryParam (key, value, { history } = { history: true }) {
  const currentURL = new URL(window.location.href)
  const params = new URLSearchParams(currentURL.search)
  params.set(key, value)
  currentURL.search = params.toString()
  if (history) window.history.pushState({}, '', currentURL.toString())
}

// let trail = []
export async function loadData () {
  try {
    const response = await fetch('./data/all.json')
    const data = await response.json()

    nodes = data.nodes || {}
    links = data.links || {}
  } catch (error) {
    console.error('Error loading JSON:', error)
    throw error
  }

  const event = new CustomEvent('dataLoaded', { detail: { nodes, links } })
  window.dispatchEvent(event)

  return { nodes, links }
}

export function selectNode (id, history = true) { // selects the node (fetches neighbors, etc. triggers event etc)
  const node = nodes.find(node => node.id === id)
  if (!node) return console.error(`Node with id ${id} not found`)
  if (node === selectedNode) return console.log(`Node with id ${id} already selected`)
  // if (!trail.includes(node)) trail.push(node)
  selectedNode = node
  const neighborLinks = links.filter(link => link.source === id || link.target === id)
  const neighborIds = new Set()
  neighborLinks.forEach(link => {
    neighborIds.add(link.source)
    neighborIds.add(link.target)
  })
  // FIXME uncomment & fix make the journey-list work with this data!
  // trail.forEach(node => neighborIds.add(node.id))
  neighborIds.delete(id)

  const neighbors = Array.from(neighborIds).map(id => nodes.find(node => node.id === id))

  const additionalLinks = links.filter(link => neighborIds.has(link.source) && neighborIds.has(link.target))
  additionalLinks.map(link => { link.secundary = true })

  const allLinks = [...neighborLinks, ...additionalLinks]
  const allNodes = [node, ...neighbors]

  const nodeSelectedEvent = new CustomEvent('nodeSelected', {
    detail: { node, nodes: allNodes, links: allLinks }
  })
  window.dispatchEvent(nodeSelectedEvent)

  updateQueryParam('id', id, { history })
  return { node, nodes: allNodes, links: allLinks }
}

export function hoverNode (id, origin, prevNodeId) { // id === null to clear
  const node = id ? nodes.find(node => node.id === id) : {}
  // hoveredNode = mainNode
  const detail = { node, origin }
  if (prevNodeId) detail.prevNode = { id: prevNodeId }
  const nodeHoveredEvent = new CustomEvent('nodeHovered', { detail })
  window.dispatchEvent(nodeHoveredEvent)

  return { node }
}

window.addEventListener('selectNode', event => {
  const { node } = event.detail
  selectNode(node.id)
})
window.addEventListener('hoverNode', event => {
  // TODO add prevNode for "unHovered" event
  const { node, origin } = event.detail
  hoverNode(node?.id, origin)
})

// load all data unless body attribute = "false"
if (document.body.getAttribute('data-auto-load')) {
  loadData().then(({ nodes, links }) => {
  }).catch(error => {
    console.error('Error:', error)
  })
}