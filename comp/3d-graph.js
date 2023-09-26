/* global ForceGraph3D */
async function initGraph () {
  const Graph = ForceGraph3D()
  const graphDiv = document.getElementById('3d-graph')

  const width = graphDiv.clientWidth
  const height = graphDiv.clientHeight
  Graph(graphDiv)
    .width(width)
    .height(height)
    .graphData({ nodes: [], links: [] })
    .nodeLabel('name')
    .nodeAutoColorBy('name')

  // this.shadowRoot.appendChild(graphDiv)

  // Listen for the 'nodeSelected' event
  window.addEventListener('nodeSelected', event => {
    const { nodes, links } = event.detail
    Graph.graphData({ nodes, links })
  })
}
initGraph()
