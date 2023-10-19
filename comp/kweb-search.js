/* global HTMLElement, customElements, document, window */
function toMap (arr) { // TODO: move to utils.js - DRY
  const map = {}
  arr.forEach(item => { map[item.id] = item })
  return map
}

function findPaths ({ nodes, links }, id1, id2, maxPaths = 1) {
  // Create a mapping from node id to node object
  const nodeMap = {};
  nodes.forEach(node => {
    nodeMap[node.id] = node;
  });

  // Initialize BFS queue and visited set
  const queue = [{ nodeId: id1, path: [], linkNames: [] }];
  const visited = new Set([id1]);

  // To hold the found paths
  const foundPaths = [];

  while (queue.length > 0 && foundPaths.length < maxPaths) {
    const { nodeId, path, linkNames } = queue.shift();

    // Exclude nodes with a tag named "Meta"
    if (nodeMap[nodeId].tags && nodeMap[nodeId].tags.some(tag => tag.name === "Meta")) {
      continue;
    }

    if (nodeId === id2) {
      // Found a path to the target node, add it to the found paths
      foundPaths.push({
        nodeNames: [nodeMap[id1].name, ...path.map(id => nodeMap[id].name)],
        linkNames: linkNames
      });
      continue;
    }

    // Add neighbors to the queue
    links.forEach(link => {
      if (link.source === nodeId && !visited.has(link.target)) {
        queue.push({
          nodeId: link.target,
          path: [...path, link.target],
          linkNames: [...linkNames, link.name]
        });
        visited.add(link.target);
      }
    });
  }

  // Sort found paths by length
  foundPaths.sort((a, b) => a.nodeNames.length - b.nodeNames.length);

  return foundPaths;
}

// Test the function assuming global nodes and links arrays are defined
// Replace these ids with the actual ids for "Swedenborg" and "Tesla" in your data
// const paths = findPaths('id_of_Swedenborg', 'id_of_Tesla', 3);
// console.log(paths);


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
          padding: 8px 4px;
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
    
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      const node = matchingNodes[0]
      if (!node) return
      const selectedId = window.location.hash.split('=')[1]
      console.time(node.name)
      const paths = findPaths({ nodes: this.nodes, links: this.links }, selectedId, node.id)
      console.timeEnd(node.name)
      let jumps = null 
      if (paths[0]?.nodeNames?.length) jumps = paths[0].nodeNames.length - 1
      console.log({ jumps })
    }, 500)

    for (const node of matchingNodes) {
      const div = document.createElement('div')
      div.className = 'autocomplete-item'
      div.id = `search-${node.id}`
      let html = ''
      const icon = getIcon(node.id) || getIcon(node.typeId)
      if (icon) html += `<img class="icon" src="${icon}" style="padding-right: 6px;" height="24" />`
      html += node.name
      // TODO ~: with a delay, not blocking... one at the time and cache results?
      // if (i++ < 1)  {
      
      //   const paths = findPaths({ nodes: this.nodes, links: this.links }, selectedId, node.id, 1)
      //   console.log(paths, 'PATHS')
      //   // paths.forEach(path => {
      //   //   console.log(path)
      //   //   // TODO show these!
      //   // })
      // }
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
