export function toMap (arr) { // TODO: move to utils.js - DRY
  const map = {}
  arr.forEach(item => { map[item.id] = item })
  return map
}

let map = {}

const iconPath = (id) => map[id]?.icon ? `/brain/${id}/.data/Icon.png` : ''
export function getIcon (node, typeIconFallback = true) {
  const iconFromId = iconPath(node.id)
  const iconFromType = typeIconFallback ? iconPath(node.typeId) : null
  return iconFromId || iconFromType || ''
}

window.addEventListener('dataLoaded', event => { // NOTE this seems like a big hack?
  map = toMap(event.detail.nodes)
})      
// export function loadUtils (event) { map = toMap(event.detail.nodes) } // <-- this better?