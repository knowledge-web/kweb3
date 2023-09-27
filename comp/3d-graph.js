/* global ForceGraph3D */

let graph = null
async function initGraph (data) {
  const elem = document.getElementById('3d-graph')

  // const width = elem.clientWidth
  // const height = elem.clientHeight

  graph = ForceGraph3D()(elem)
    // .width(width)
    // .height(height)
    .backgroundColor('rgba(0,0,0,0)')
    .graphData(data)
    .nodeLabel('name')
    .nodeColor(node => node.color || 'rgba(255,255,255,0.8)')
    .enableNodeDrag(false)
    .onNodeClick(node => {
      const event = new CustomEvent('selectNode', { detail: { node } })
      window.dispatchEvent(event)
    })
    .onNodeHover((node, prevNode) => {
      // console.log('hover', node, prevNode)
      const event = new CustomEvent('hoverNode', { detail: { node } })
      window.dispatchEvent(event)
    })
}

window.addEventListener('nodeSelected', event => {
  const { nodes, links } = event.detail
  if (!graph) return initGraph({ nodes, links })
  graph.graphData({ nodes, links })
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
