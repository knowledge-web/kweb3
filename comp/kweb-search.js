/* global HTMLElement, customElements, document, window */
function toMap (arr) { // TODO: move to utils.js - DRY
  const map = {}
  arr.forEach(item => { map[item.id] = item })
  return map
}

// Initialize the Web Worker
// const pathWorker = new Worker('comp/pathWorker.js')

class KWebSearch extends HTMLElement {
  constructor () {
    super()

    this.nodes = []
    this.links = []
    this.map = {}

    this.attachShadow({ mode: 'open' })

    this.shadowRoot.innerHTML = `
      <style>
        .search-container {
          display: flex;
          align-items: center;
          padding: 4px;
          margin-left: 4px;
        }
        .autocomplete {
          position: relative;
        }
        input {
          width: 300px;
          padding: 8px;
          font-size: 18px;
          background-color: #555;
          color: #fff;
          border: none;
          border-radius: 8px 0 0 8px;
        }
        .autocomplete-items {
          position: absolute;
          z-index: 200;
          width: 300px;
          background-color: #444;
          border-radius: 0 0 8px 8px;
        }
        .autocomplete-item {
          padding: 16px;
          cursor: pointer;
          font-size: 18px;
          color: #ddd;
        }
        .autocomplete-item:hover {
          background-color: #555;
        }
        .random-button {
          padding: 9px;
          font-size: 16px;
          background-color: #555;
          color: #fff;
          border: none;
          border-radius: 0 8px 8px 0;
          cursor: pointer;
        }
      </style>
      <div class="search-container">
        <div class="autocomplete">
          <input type="text" id="searchBox" placeholder="Search...">
          <div class="autocomplete-items"></div>
        </div>
        <button class="random-button">🎲</button>
      </div>
    `

    // Add Event Listeners
    this.addListeners()
  }

  addListeners () {
    const searchBox = this.shadowRoot.querySelector('#searchBox')
    const randomButton = this.shadowRoot.querySelector('.random-button')

    searchBox.addEventListener('input', (e) => this.showSuggestions(e.target.value))
    randomButton.addEventListener('click', () => this.randomSelection())
    searchBox.addEventListener('blur', (e) => {
      setTimeout(() => {
        const itemsDiv = this.shadowRoot.querySelector('.autocomplete-items')
        itemsDiv.innerHTML = ''
      }, 500)
    })

    // Set up a listener to receive messages from the worker
    // XXX not great perhaps remove & redo completely? (still too slow etc)
    // pathWorker.addEventListener('message', (e) => {
    //   const { paths } = e.data;
    //   let jumps = null;
    //   if (paths[0]?.nodes?.length) jumps = paths[0].nodes.length - 1;

    //   console.log(paths, '<-- paths')
    //   // debugger
    //   console.log(paths[0]?.nodes, '<-- paths')
    //   const nodes = paths[0]?.nodes || []
    //   const node = nodes[nodes.length - 1]
    //   console.log(node, 'node')
    //   if (!node || !node.id) return
    //   const jumpbox = this.shadowRoot.querySelector(`#search-${node.id} .jumps`);
    //   console.log(jumpbox, 'jumpbox')
    //   if (jumpbox) jumpbox.innerHTML = jumps ? `(${jumps} jumps)` : '';
    // })
  }

  showSuggestions (value) {
    const itemsDiv = this.shadowRoot.querySelector('.autocomplete-items')
    itemsDiv.innerHTML = ''

    const matchingNodes = this.nodes.filter(node => node.name.toLowerCase().includes(value.toLowerCase()))

    const iconPath = (id) => `/brain/${id}/.data/Icon.png` // DRY
    const getIcon = (id) => { // DRY
      const icon = this.map[id]?.icon
      return icon ? iconPath(id) : ''
    }

    // TODO remove this completely? Replace w something else...
    // clearTimeout(this.timeout);
    // this.timeout = setTimeout(() => {
    //   const node = matchingNodes[0];
    //   if (!node) return;

    //   const selectedId = window.location.hash.split('=')[1];
    //   console.time(node.name);

    //   // Post a message to the worker to start the path finding
    //   pathWorker.postMessage({
    //     nodes: this.nodes,
    //     links: this.links,
    //     selectedId: selectedId,
    //     nodeId: node.id,
    //     maxPaths: 3
    //   });

    //   // Timing and updating the UI will be handled in the worker's message listener
    //   console.timeEnd(node.name);
    // }, 500);

    for (const node of matchingNodes) {
      const div = document.createElement('div')
      div.className = 'autocomplete-item'
      div.id = `search-${node.id}`
      let html = ''
      const icon = getIcon(node.id) || getIcon(node.typeId)
      if (icon) html += `<img class="icon" src="${icon}" style="padding-right: 6px;" height="24" />`
      html += node.name
      html += '<span class="jumps" style="padding-left: 8px; opacity: 0.5;"></span>'

      div.innerHTML = html
      div.addEventListener('click', () => {
        window.location.hash = `#id=${node.id}`
        itemsDiv.innerHTML = ''
      })

      itemsDiv.appendChild(div)
    }
  }

  randomSelection () {
    if (this.nodes.length === 0) return

    const randomNode = this.nodes[Math.floor(Math.random() * this.nodes.length)]
    window.location.hash = `#id=${randomNode.id}`
  }
}

// Define the custom element
customElements.define('kweb-search', KWebSearch)

// Listen for the dataLoaded event
window.addEventListener('dataLoaded', function (event) {
  const kwebSearch = document.querySelector('kweb-search')
  kwebSearch.nodes = event.detail.nodes
  kwebSearch.links = event.detail.links
  kwebSearch.map = toMap(kwebSearch.nodes)
})
