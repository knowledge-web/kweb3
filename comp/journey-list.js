/* global customElements, HTMLElement, localStorage */
function addHoverEventsToLinks (elem) { // FIXME copied from bio.js
  const links = elem.querySelectorAll('a[href^="#id="]')
  links.forEach(link => {
    link.addEventListener('mouseover', function () {
      const id = this.getAttribute('href').split('#id=')[1]
      const node = { id }
      const event = new CustomEvent('hoverNode', { detail: { node, origin: 'journey' } })
      window.dispatchEvent(event)
    })

    link.addEventListener('mouseout', function () {
      const id = this.getAttribute('href').split('#id=')[1]
      const prevNode = { id }
      const node = {}
      const event = new CustomEvent('hoverNode', { detail: { node, prevNode, origin: 'journey' } })
      window.dispatchEvent(event)
    })
  })
}

class JourneyList extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.visitedNodes = []
  }

  connectedCallback () {
    this.loadState()
    // Listen for the custom event on the document
    window.addEventListener('nodeSelected', this.nodeSelectedHandler.bind(this))
    window.addEventListener('hoverNode', event => {
      const { node, prevNode } = event.detail
      const links = this.shadow.querySelectorAll('a[href^="#id="]')
      links.forEach(a => {
        a.classList.remove('hovered')
        if (!node || !node.id) return
        const nodeId = a.getAttribute('href').split('=')[1]
        if (nodeId === node.id) a.classList.add('hovered')
      })
    })
  }

  disconnectedCallback () {
    window.removeEventListener('nodeSelected', this.nodeSelectedHandler.bind(this))
    // FIXME remove the hover one also
  }

  nodeSelectedHandler (event) {
    const { node, nodes, links } = event.detail
    let link = null

    // If this is not the first node
    if (this.visitedNodes.length > 0) {
      const prev = this.visitedNodes[this.visitedNodes.length - 1].node
      link = links.find(l => (l.source === prev.id && l.target === node.id) || (l.source === node.id && l.target === prev.id))
    }

    // Add node and link to visitedNodes if not already visited
    if (!this.visitedNodes.some(visitedNode => visitedNode.node.id === node.id)) {
      this.visitedNodes.push({ node, link })
    }

    this.currentNodes = nodes // Store the current nodes on screen
    this.render()
  }

  clearJourney () {
    if (window.confirm('Are you sure you want to clear the journey?')) {
      this.visitedNodes = []
      this.render()
    }
  }

  saveState () {
    const journeyState = JSON.stringify({ visitedNodes: this.visitedNodes, currentNodes: this.currentNodes })
    localStorage.setItem('journeyState', journeyState)
  }

  loadState () {
    const savedState = localStorage.getItem('journeyState')
    if (savedState) {
      const { visitedNodes, currentNodes } = JSON.parse(savedState)
      this.visitedNodes = visitedNodes
      this.currentNodes = currentNodes
    }
  }

  removeLastNode () {
    if (!this.visitedNodes.length) return
    this.visitedNodes.pop()
    this.saveState()
    const id = this.visitedNodes[this.visitedNodes.length - 1].node.id
    window.location.hash = `#id=${id}`
  }

  render () {
    this.saveState()
    this.shadow.innerHTML = `
      <style>
        ul {
          list-style-type: disc;
          margin: 0;
          padding: 0;
        }
        li {
          margin: 5px 0;
        }
        a {
          color: steelblue;
          text-decoration: none;
          opacity: 0.5;
        }
        a:hover {
          opacity: 1;
        }
        a.selected {
          color: #84f;
          opacity: 1;
          font-weight: bold;
        }
        a.on-screen {
          opacity: 1;
        }
        a.hovered {
          text-decoration: underline;
        }
        button {
          position: relative;
          z-index: 100;
          cursor: pointer;
          opacity: 0.5;
          margin-top: 10px;
          margin-bottom: 6px;

          border: none;
          background: none;
          color: white;
        }
        button:hover {
          opacity: 1;
        }
        button.clear {
          margin-left: 10px;
        }
      </style>`

    const lastVisited = this.visitedNodes[this.visitedNodes.length - 1]
    const list = this.visitedNodes // [...this.visitedNodes].reverse()
    this.shadow.innerHTML += `
      <h3>Knowledge Trail (Journey)</h3>
      <ul>
      ${list.map(({ node, link }, index) => {
        link = link || {}
        const classes = []
        if (node === lastVisited.node) classes.push('selected')
        if (this.currentNodes.some(currentNode => currentNode.id === node.id)) classes.push('on-screen')
        return `<li>${link.name && index !== 0 ? `<span class="link-name">${link.name}</span>` : ''} <a href="#id=${node.id}" class="${classes.join(' ')}">${node.name}</a></li>`
      }).join('')}
    </ul>
    `
    addHoverEventsToLinks(this.shadow)

    const links = this.shadow.querySelectorAll('a[href^="#id="]')
    links.forEach(a => {
      const nodeId = a.getAttribute('href').split('=')[1]
      if (this.currentNodes.some(node => node.id === nodeId)) {
        a.classList.add('on-screen')
      }
    })

    // Add buttons
    const clearButton = document.createElement('button')
    clearButton.classList.add('clear')
    clearButton.textContent = 'Clear'
    clearButton.addEventListener('click', () => this.clearJourney())
    this.shadow.querySelector('h3').appendChild(clearButton)

    const removeLastButton = document.createElement('button')
    removeLastButton.classList.add('remove-last')
    if (list.length === 0) removeLastButton.style.display = 'none'
    removeLastButton.textContent = 'Remove last'
    removeLastButton.addEventListener('click', () => this.removeLastNode())
    this.shadow.appendChild(removeLastButton)
  }
}

// Define the custom element
customElements.define('journey-list', JourneyList)
