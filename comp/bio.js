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

class BioComponent extends HTMLElement {
  constructor () {
    super()
    this.selected = {} // { node, nodes, links }
    this.hovered = {} // node
  }

  connectedCallback () {
    window.addEventListener('nodeSelected', event => {
      this.selected = event.detail
      this.showBio(this.selected.node)
    })

    window.addEventListener('nodeHovered', event => {
      const { node, origin } = event.detail
      if (origin === 'bio') return
      this.hovered = node
      this.showBio(this.hovered)
    })
  }

  async showBio (node) {
    const bio = document.getElementById('bio')
    if (!node || !node.id) node = this.selected.node

    const markdown = await this.fetchContent(node)
    // render markdown
    const html = marked.parse(markdown)

    bio.innerHTML = `
      <h2>${node.name}</h2>
      <p>${html}</p>
    `
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
