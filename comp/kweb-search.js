/* global HTMLElement, customElements, document, window */
function toMap (arr) { // TODO: move to utils.js - DRY
  const map = {}
  arr.forEach(item => { map[item.id] = item })
  return map
}

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
    
    for (const node of matchingNodes) {
      const div = document.createElement('div')
      div.className = 'autocomplete-item'
      let html = ''
      const icon = getIcon(node.id) || getIcon(node.typeId)
      if (icon) html += `<img class="icon" src="${icon}" style="padding-right: 6px;" height="24" />`
      html += node.name
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
