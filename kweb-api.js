let nodes = {}
let links = {}
// let selectedNode = {}
// let hoveredNode = {}

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

export function selectNode (id) { // selects the node (fetches neighbors, etc. triggers event etc)
  const node = nodes.find(node => node.id === id)
  // selectedNode = node
  const neighborLinks = links.filter(link => link.source === id || link.target === id)
  const neighborIds = new Set()
  neighborLinks.forEach(link => {
    neighborIds.add(link.source)
    neighborIds.add(link.target)
  })
  neighborIds.delete(id)

  const neighbors = Array.from(neighborIds).map(id => nodes.find(node => node.id === id))

  const additionalLinks = links.filter(link => neighborIds.has(link.source) && neighborIds.has(link.target))

  const allLinks = [...neighborLinks, ...additionalLinks]
  const allNodes = [node, ...neighbors]

  const nodeSelectedEvent = new CustomEvent('nodeSelected', {
    detail: { node, nodes: allNodes, links: allLinks }
  })
  window.dispatchEvent(nodeSelectedEvent)

  return { node, nodes: allNodes, links: allLinks }
}

export function hoverNode (id) { // id === null to clear
  const node = id ? nodes.find(node => node.id === id) : {}
  // hoveredNode = mainNode

  const nodeHoveredEvent = new CustomEvent('nodeHovered', {
    detail: { node }
  })
  window.dispatchEvent(nodeHoveredEvent)

  return { node }
}

window.addEventListener('selectNode', event => {
  const { node } = event.detail
  selectNode(node.id)
})
window.addEventListener('hoverNode', event => {
  const { node } = event.detail
  hoverNode(node?.id)
})

// load all data unless body attribute = "false"
if (document.body.getAttribute('data-auto-load') !== 'false') {
  loadData().then(({ nodes, links }) => {
    // console.log('Nodes:', nodes)
    // console.log('Links:', links)
  }).catch(error => {
    console.error('Error:', error)
  })
} else {
  console.log('no load')
}