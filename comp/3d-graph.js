/* global ForceGraph3D SpriteText */
import { CSS2DRenderer, CSS2DObject } from '//unpkg.com/three/examples/jsm/renderers/CSS2DRenderer.js'

const settings = window.settings || {} // Meeeh
settings.brainArrows = true // TODO make this a setting

let allNodes = {}

function toMap (arr) {
  const map = {}
  arr.forEach(item => { map[item.id] = item })
  return map
}

let graph = null
let selectedNode = null
async function initGraph (raw, options = {}) {
  const data = {}
  data.nodes = JSON.parse(JSON.stringify(raw.nodes))
  data.links = JSON.parse(JSON.stringify(raw.links))
  const elem = document.getElementById('3d-graph')
  selectedNode = options.selectedNode || null
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

  const width = elem.clientWidth * 0.8
  // const height = elem.clientHeight
  graph = ForceGraph3D({
    extraRenderers: [new CSS2DRenderer()]
  })(elem)
    .width(width)
    // .height(height)
    .graphData(data)
    .backgroundColor('rgba(0,0,0,0)')
    .warmupTicks(40)
    .cooldownTicks(40)
    .enableNodeDrag(false)
    .nodeLabel('label')
    .nodeRelSize(2)
    .linkHoverPrecision(2)
    .nodeColor(node => {
      // node.color || 'rgba(255,255,255,0.8)'
      if (selectedNode && node.id === selectedNode.id) return 'steelblue'
      // if (!highlightNodes.has(node)) return 'rgba(255,255,255,0.8)'
      if (node === hoverNode) return 'rgb(255,0,0,1)'
      return node.color || 'rgba(255,255,255,0.8)'
    })
    .linkColor(link => {
      return link.color || 'white'
    })
    .linkWidth(link => highlightLinks.has(link) ? 1 : 0)
    // .linkDirectionalParticles(link => highlightLinks.has(link) ? 4 : 0)
    // .linkDirectionalParticleWidth(1)

    .nodeThreeObject(node => {
      const nodeEl = document.createElement('div')

      const iconPath = (id) => `/brain/${id}/.data/Icon.png`
      let icon = node.icon && iconPath(node.id)
      if (!icon && allNodes[node.typeId]?.icon) icon = iconPath(node.typeId)
      let html = icon ? `<img class="icon" src="${icon}" style="opacity: 1.0; margin-right: 4px; margin-bottom: -4px;" height="24" />` : ''

      html += node.name
      nodeEl.innerHTML = html

      // const img = 'https://picsum.photos/seed/derp/150/150' // random profile image
      // nodeEl.innerHTML = `${node.name}<br><img class="prof" src="${img}" />`
      nodeEl.style.color = node.color || 'rgba(255,255,255,0.8)'
      nodeEl.className = 'node-label'
      // nodeEl.setAttribute('data-id', node.id)
      // FIXME the below work but breaks scroll wheel zoom etc...
      // nodeEl.style['pointer-events'] = 'all'
      // nodeEl.addEventListener('pointerdown', () => { window.location.hash = `id=${node.id}` })
      // nodeEl.addEventListener('pointerover', () => { nodeEl.classList.add('hover') })
      // nodeEl.addEventListener('pointerout', () => { nodeEl.classList.remove('hover') })
      return new CSS2DObject(nodeEl)
    })
    .nodeThreeObjectExtend(true)

    .linkLabel('')
    .linkThreeObjectExtend(true)
    .linkThreeObject(link => {
      // extend link with text sprite
      const sprite = new SpriteText(`${link.name || ''}`)
      sprite.color = link.color || 'rgba(127, 196, 255, 0.66)'
      sprite.textHeight = 2
      // sprite.rotation = 100
      return sprite
    })
    .linkDirectionalArrowLength(link => {
      if (!settings.brainArrows) return 0
      if (!link.dir) return null
      return 4
    })
    .linkDirectionalArrowRelPos(1)
    .linkCurvature(link => link.secundary ? 0.5 : 0)
    .linkPositionUpdate((sprite, { start, end }) => {
      const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
        [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
      })))
      // if (settings.dimensions === 2) middlePos.z = 0
      // Position sprite
      Object.assign(sprite.position, middlePos)
    })

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
      if (node.neighbors) node.neighbors.forEach(neighbor => highlightNodes.add(neighbor))
      if (node.links) node.links.forEach(link => highlightLinks.add(link))
    }
    hoverNode = node || null
    updateHighlight()
  }

  window.addEventListener('nodeHovered', event => {
    const { node, origin } = event.detail
    if (origin === 'graph') return
    if (!graph) return
    const nodes = graph.graphData().nodes // XXX Not needed
    const realNode = nodes.find(n => n.id === node.id)
    honverEffect(realNode)
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

window.addEventListener('dataLoaded', event => {
  const { nodes } = event.detail
  allNodes = toMap(nodes)
  if (!settings.brainArrows) return

  event.detail.links.map(link => {
    if (link.dir === -1) { // NOTE this is a hack to reverse the arrows & ~volatile
      const { source } = link
      link.source = link.target
      link.target = source
      link.dir = 1
    }
  })
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
