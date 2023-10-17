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

function ucfirst (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function endWithPeriod (str) {
  if (!str) return ''
  return str.endsWith('.') ? str : str + '.'
}

function fomatOneliner (str) {
  if (!str) return ''
  return ucfirst(endWithPeriod(str || ''))
}

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

function normalizeString (str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function toMap (arr) { // TODO: move to utils.js - DRY
  const map = {}
  arr.forEach(item => { map[item.id] = item })
  return map
}

class BioComponent extends HTMLElement {
  constructor () {
    super()
    this.selected = {} // { node, nodes, links }
    this.hovered = {} // node
    this.nodeIds = []
    this.allNodes = {}
  }

  connectedCallback () {
    window.addEventListener('dataLoaded', event => {
      const { nodes } = event.detail
      this.allNodes = toMap(nodes)
      this.nodeIds = nodes.map(n => n.id)
    })

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
    let html = marked.parse(markdown)

    // Extract 'href="#id=' + link text from html
    const textLinks = [...html.matchAll(/href="#id=([^"]+)">([^<]+)<\/a>/g)].reduce((acc, [, id, text]) => {
      acc[id] = text
      return acc
    }, {})
    const onlyInText = Object.keys(textLinks).filter(id => !nodes.map(n => n.id).includes(id))

    const neighbors = nodes.filter(n => n.id !== node.id)
    const onlyMentioned = neighbors.filter(({ id, name }) => normalizeString(html).includes(normalizeString(name)) && !html.includes(`href="#id=${id}"`)).map(n => n.id)

    // example .data/md-images/3afdc8c4-0738-4fac-aa63-651d5d2d2097.webp#$width=70p$
    html = html.replaceAll('.data/md-images/', `/brain/${node.id}/.data/md-images/`)

    const iconPath = (id) => `/brain/${id}/.data/Icon.png`
    let icon = node.icon && iconPath(node.id)
    if (!icon && this.allNodes[node.typeId]?.icon) icon = iconPath(node.typeId)

    // FIXME css --> Shadow DOM only
    bio.innerHTML = `
      <style>
        * {
          font-family: 'Source Serif Pro', sans-serif;
          font-size: 18px;
        }
        h1, h2, h3 {
          font-weight: 700;
          letter-spacing: 0.025em;
        }
        h2 { font-size: 36px; }
        h3 { font-size: 20px; }
        h4 { font-size: 16px; }
        .title {
          margin-bottom: 4px;
        }
        .oneliner {
          font-style: italic;
          margin-bottom: 16px;
        }
        p {
          line-height: 1.5em;
          color: rgba(0, 0, 0, 0.9);
        }
        a.dead-link { color: #f00; }
        a.dead-link::after { content: ' 💀'; }
        a.external-link { color: #008000; }
        a.external-link::after {
          content: ' 🔗';
          font-size: smaller;
        }
        .external-link:visited { color: #800080; }
        li.in-text a { font-weight: bold; }
        li.only-mentioned::after { content: ' (unlinked mention)'; opacity: 0.5; }
        img { max-width: 100%; }
        .icon-title-wrapper {
          display: flex;
          align-items: center;
        }
        img.icon-main {
          width: 32px;
          height: 32px;
          margin-right: 10px; /* Adjust the margin to position the icon */
        }
        img.icon[src=""] { display: none; }
      </style>
      <div class="icon-title-wrapper">
        <img class="icon icon-main" src="${icon ? icon : ''}" />
        <h2 class="title">${node.name}</h2>
      </div>
      <p class="oneliner">${fomatOneliner(node.label)}</p>
      ${html}
      <h3>Links (${neighbors.length})</h3>
      <ul>
        ${neighbors.map(n => `<li class="${Object.keys(textLinks).includes(n.id) ? 'in-text' : ''}${onlyMentioned.includes(n.id) ? 'only-mentioned' : ''}">
          <a href="#id=${n.id}">${n.name}</a>
        </li>`).join('\n')}
      </ul>
      <h4 style="${onlyInText.length ? '' : 'display: none;'}">Only in text (${onlyInText.length})</h4>
      <ul>${onlyInText.map(id => `<li><a href="#id=${id}">${textLinks[id]}</a></li>`).join('\n')}</ul>
      `
      // TODO ~:
      // <h3>Linking here</h4>
      // TODO
      // <h4>Likely mentions</h4>

    // Add hover events to all links with #id=<some-id>
    addHoverEventsToLinks(bio)

    // highlight dead links
    bio.querySelectorAll('a[href^="#id="]').forEach(link => {
      const id = link.getAttribute('href').split('#id=')[1]
      if (!this.nodeIds.includes(id)) link.classList.add('dead-link')
    })
    // style external links
    bio.querySelectorAll('a[href^="http"]').forEach(link => {
      link.setAttribute('target', '_blank')
      link.classList.add('external-link')
    })

    bio.scrollTop = 0
  }

  async fetchContent (node) {
    try {
      const response = await fetch(`./brain/${node.id}/Notes.md`)
      const text = await response.text()
      return text
    } catch (error) {
      console.error('Error loading JSON:', error)
      return ''
    }
  }
}

customElements.define('kweb-bio', BioComponent)
