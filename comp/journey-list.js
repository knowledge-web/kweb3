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

  render () {
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
  }
}

// Define the custom element
customElements.define('journey-list', JourneyList)
