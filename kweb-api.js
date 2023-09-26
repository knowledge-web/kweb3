let nodes = {}
let links = {}
// let selectedNode = {}

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

export function selectNode (nodeId) { // selects the node (fetches neighbors, etc. triggers event etc)
  const mainNode = nodes.find(node => node.id === nodeId)
  // selectedNode = mainNode
  const neighborLinks = links.filter(link => link.source === nodeId || link.target === nodeId)
  console.log(nodeId, 'neighborLinks', neighborLinks)
  const neighborIds = new Set()
  neighborLinks.forEach(link => {
    neighborIds.add(link.source)
    neighborIds.add(link.target)
  })
  neighborIds.delete(nodeId)

  const neighbors = Array.from(neighborIds).map(id => nodes.find(node => node.id === id))

  const additionalLinks = links.filter(link => neighborIds.has(link.source) && neighborIds.has(link.target))

  const allLinks = [...neighborLinks, ...additionalLinks]
  const allNodes = [mainNode, ...neighbors]

  const nodeSelectedEvent = new CustomEvent('nodeSelected', {
    detail: { node: mainNode, nodes: allNodes, links: allLinks }
  })
  window.dispatchEvent(nodeSelectedEvent)

  return { node: mainNode, nodes: allNodes, links: allLinks }
}

export function hoverNode (nodeId) {
  const mainNode = nodes.find(node => node.id === nodeId)

  const nodeHoveredEvent = new CustomEvent('nodeHovered', {
    detail: { node: mainNode }
  })
  window.dispatchEvent(nodeHoveredEvent)

  return { node: mainNode }
}

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
