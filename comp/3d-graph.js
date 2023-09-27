/* global ForceGraph3D */

function toMap (arr) {
  const map = {}
  arr.forEach(item => { map[item.id] = item })
  return map
}

let graph = null
async function initGraph (data, { selectedNode } = {}) {
  const elem = document.getElementById('3d-graph')

  // NOTE Hover Effects ahead
  // cross-link node objects
  const map = toMap(data.nodes)
  data.links.forEach(link => {
    const a = map[link.source]
    const b = map[link.target]
    !a.neighbors && (a.neighbors = [])
    !b.neighbors && (b.neighbors = [])
    a.neighbors.push(b)
    b.neighbors.push(a)
    !a.links && (a.links = [])
    !b.links && (b.links = [])
    a.links.push(link)
    b.links.push(link)
  })
  const highlightNodes = new Set()
  const highlightLinks = new Set()
  let hoverNode = null

  if (graph) return graph.graphData(data)

  // const width = elem.clientWidth
  // const height = elem.clientHeight
  graph = ForceGraph3D()(elem)
    // .width(width)
    // .height(height)
    .backgroundColor('rgba(0,0,0,0)')
    .enableNodeDrag(false)
    .graphData(data)
    .nodeLabel('name')
    .nodeColor(node => {
      // node.color || 'rgba(255,255,255,0.8)'
      if (selectedNode && node.id === selectedNode.id) return 'steelblue'
      if (!highlightNodes.has(node)) return 'rgba(255,255,255,0.8)'
      return (node === hoverNode) ? 'rgb(255,0,0,1)' : 'rgba(255,160,0,0.8)'
    })
    .linkWidth(link => highlightLinks.has(link) ? 1 : 0)
    // .linkDirectionalParticles(link => highlightLinks.has(link) ? 4 : 0)
    // .linkDirectionalParticleWidth(1)
    .onNodeHover((node, prevNode) => {
      const event = new CustomEvent('hoverNode', { detail: { node, origin: 'graph' } })
      window.dispatchEvent(event)

      // NOTE Hover Effects ahead
      // no state change
      honverEffect(node)
    })
    .onNodeClick(node => {
      const event = new CustomEvent('selectNode', { detail: { node, origin: 'graph' } })
      window.dispatchEvent(event)
    })

  function honverEffect (node) {
    if ((!node && !highlightNodes.size) || (node && hoverNode === node)) return
    highlightNodes.clear()
    highlightLinks.clear()
    if (node) {
      highlightNodes.add(node)
      node.neighbors.forEach(neighbor => highlightNodes.add(neighbor))
      node.links.forEach(link => highlightLinks.add(link))
    }
    hoverNode = node || null
    updateHighlight()
  }

  window.addEventListener('nodeHovered', event => {
    const { node, origin } = event.detail
    if (origin === 'graph') return
    if (!graph) return
    // const nodes = graph.graphData().nodes // XXX Not needed
    // const realNode = nodes.find(n => n.id === node.id)
    honverEffect(node)
  })
}

function updateHighlight () {
  // trigger update of highlighted objects in scene
  graph
    .nodeColor(graph.nodeColor())
    .linkWidth(graph.linkWidth())
    .linkDirectionalParticles(graph.linkDirectionalParticles())
}

window.addEventListener('nodeSelected', event => {
  const { node, nodes, links } = event.detail
  initGraph({ nodes, links }, { selectedNode: node })
})

// Test by triggering custom event like:
// window.dispatchEvent(new CustomEvent('nodeSelected', {
//   detail: {
//     node: { id: 'node1', name: 'node1' },
//     nodes: [
//       { id: 'node1', name: 'node1' },
//       { id: 'node2', name: 'node2' },
//       { id: 'node3', name: 'node3' }
//     ],
//     links: [
//       { source: 'node1', target: 'node2' },
//       { source: 'node1', target: 'node3' }
//     ]
//   }
// }))
