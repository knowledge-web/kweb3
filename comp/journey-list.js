/* global customElements, HTMLElement */
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
    this.render()
  }

  connectedCallback () {
    console.log('connectedCallback')
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
    // TODO for the other one also
  }

  nodeSelectedHandler (event) {
    const { node, nodes, links } = event.detail
    if (!this.visitedNodes.some(visitedNode => visitedNode.id === node.id)) { // don't add the same node twice
      this.visitedNodes.push(node)
    }
    this.currentNodes = nodes // Store the current nodes on screen
    this.render()
  }

  render () {
    const lastVisitedNode = this.visitedNodes[this.visitedNodes.length - 1]
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
      </style>
      <h3>Visited Nodes (Journey)</h3>
      <ul>
      ${this.visitedNodes.map(node => `<li><a href="#id=${node.id}" class="${node === lastVisitedNode ? 'selected' : ''}">${node.name}</a></li>`).join('')}
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
  }
}

// Define the custom element
customElements.define('journey-list', JourneyList)
