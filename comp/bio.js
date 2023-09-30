/* eslint-env browser */
const { marked } = window
marked.setOptions({
  // renderer: new marked.Renderer(),
  // highlight: function(code, lang) {
  //   const hljs = require('highlight.js');
  //   const language = hljs.getLanguage(lang) ? lang : 'plaintext';
  //   return hljs.highlight(code, { language }).value;
  // },
  // langPrefix: 'hljs language-', // highlight.js css expects a top-level 'hljs' class.
  // pedantic: false,
  gfm: true,
  breaks: true
  // sanitize: false,
  // smartypants: false,
  // xhtml: false
})

function addHoverEventsToLinks (elem) {
  const links = elem.querySelectorAll('a[href^="#id="]')
  links.forEach(link => {
    link.addEventListener('mouseover', function () {
      const id = this.getAttribute('href').split('#id=')[1]
      const node = { id }
      const event = new CustomEvent('hoverNode', { detail: { node, origin: 'bio' } })
      window.dispatchEvent(event)
    })

    link.addEventListener('mouseout', function () {
      const id = this.getAttribute('href').split('#id=')[1]
      const prevNode = { id }
      const node = {}
      const event = new CustomEvent('hoverNode', { detail: { node, prevNode, origin: 'bio' } })
      window.dispatchEvent(event)
    })
  })
}

class BioComponent extends HTMLElement {
  constructor () {
    super()
    this.selected = {} // { node, nodes, links }
    this.hovered = {} // node
  }

  connectedCallback () {
    window.addEventListener('nodeSelected', event => {
      this.selected = event.detail
      this.showBio(this.selected)
    })

    window.addEventListener('nodeHovered', event => {
      const { node, origin } = event.detail
      if (origin === 'bio') return
      this.hovered = node
      this.showBio({ node })
    })
  }

  async showBio ({ node, nodes, links }) {
    nodes = nodes || this.selected.nodes || []
    links = links || this.selected.links || []
    const bio = document.getElementById('bio')
    if (!node || !node.id) node = this.selected.node

    const markdown = await this.fetchContent(node)
    // render markdown
    const html = marked.parse(markdown)

    const neighbors = nodes.filter(n => n.id !== node.id)
    bio.innerHTML = `
      <h2>${node.name}</h2>
      <p>${html}</p>
      <h3>Links</h3>
      <ul>${neighbors.map(n => `<li><a href="#id=${n.id}">${n.name}</a></li>`).join('\n')}</ul>
    `

    // Add hover events to all links with #id=<some-id>
    addHoverEventsToLinks(bio)
  }

  async fetchContent (node) {
    try {
      const response = await fetch(`./data/md/${node.id}/Notes.md`)
      const text = await response.text()
      return text
    } catch (error) {
      console.error('Error loading JSON:', error)
      return ''
    }
  }
}

customElements.define('kweb-bio', BioComponent)
