/* eslint-env browser */
import { shortToLongId } from '../links.js'
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

function replaceBrainLinks (content) {
  const brainLinkPattern = /brain:\/\/([a-zA-Z0-9_-]+)(?:\/[^<>\[\]\(\)\s]*)?/g
  return content.replace(brainLinkPattern, (match, link) => {
    const longId = shortToLongId(link)
    return `#id=${longId}`
  })
}

function endWithPeriod (str) {
  if (!str) return ''
  return str.endsWith('.') ? str : str + '.'
}

function fomatOneliner (str) {
  if (!str) return ''
  return ucfirst(endWithPeriod(str || ''))
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
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `<style>
      * {
        color: rgba(255, 255, 255, 0.9);
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
      .type {
        font-size: 20px;
        padding-bottom: 12px;
      }
      .type span {
        padding: 3px 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
      }
      .type.empty, .tags.empty {
        display: none;
      }
      .oneliner {
        font-style: italic;
        margin-bottom: 16px;
      }
      p {
        line-height: 1.5em;
        color: rgba(255, 255, 255, 0.9);
      }
      a.dead-link {
        color: #ff5555; /* A softer red for better contrast on dark backgrounds */
      }
      a.dead-link::after {
        content: ' 💀';
      }
      a.external-link {
        color: #4e9a06; /* A softer green that's easier on the eyes in dark mode */
      }
      a.external-link::after {
        content: ' 🔗';
        font-size: smaller;
      }
      .external-link:visited {
        color: #9558b2; /* A softer purple for visited links */
      }
      li.in-text a { font-weight: bold; }
      li.only-mentioned::after { content: ' (unlinked mention)'; opacity: 0.5; }
      img { max-width: 100%; }
      .icon-title-wrapper {
        display: flex;
        align-items: center;
      }
      img.icon-small {
        width: 16px;
        height: 16px;
        margin-right: 4px; /* Adjust the margin to position the icon */
      }
      img.icon-main {
        width: 32px;
        height: 32px;
        margin-right: 10px; /* Adjust the margin to position the icon */
      }
      img.icon[src=""] { display: none; }
    </style>
    <div id="bio"></div>`
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
      if (this.selected.node.id === node.id) return // hover same node; do nothing
      if (!node.id && !this.hovered?.id) return // never hoved another node; do nothing
      this.hovered = node
      this.showBio({ node }, { hover: true })
    })
  }

  addHoverEventsToLinks (elem) {
    const links = elem.querySelectorAll('a[href^="#id="]')
    links.forEach(link => {
      const id = link.getAttribute('href').split('#id=')[1]
      const oneliner = this.allNodes[id]?.label || '[ no one-liner ]'
      link.setAttribute('title', oneliner)
      link.addEventListener('mouseover', function () {
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

  async showBio ({ node, nodes, links }, { hover = false } = {}) {
    this.scrollTops = this.scrollTops || {}
    if (!hover) this.scrollTops = {}

    nodes = nodes || this.selected.nodes || []
    links = links || this.selected.links || []
    const bio = this.shadowRoot.getElementById('bio')
    if (bio.scrollTop) this.scrollTops[this.selected.node.id] = bio.scrollTop
    if (!node || !node.id) node = this.selected.node

    let markdown = await this.fetchContent(node)
    markdown = replaceBrainLinks(markdown)
    let html = marked.parse(markdown) // render markdown

    // TODO show these somewhere?
    // const nWords = markdown.split(/\s+/).filter(Boolean).length
    // const nWikilinks = (markdown.match(/https:\/\/en\.wikipedia\.org\/wiki\/[A-Za-z0-9_-]+/g) || []).length
    // const nBrainlinks = (markdown.match(/#id=/g) || []).length // NOTE may change to ?id= in the future

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

    const getIcon = (id) => {
      const icon = this.allNodes[id]?.icon
      return icon ? iconPath(id) : ''
    }

    let wikilinks = ''
    if (node.wikilink || node.wikidata) {
      const links = []
      if (node.wikilink) links.push(`Wikipedia: <a href="${node.wikilink}" target="_blank">${(node.wikilink.split('/wiki/')[1] || '').replaceAll('_', ' ')}</a>`)
      if (node.wikidataId) links.push(`WikiData: <a href="https://www.wikidata.org/wiki/${node.wikidataId}" target="_blank">${node.wikidataId}</a>`)
      // wikilinks = `<h3>Mappings</h3><p>${links.join('<br>')}</p>`
      wikilinks = `<p>${links.join('<br>')}</p>`
    }

    node.tags = node.tags || []
    bio.innerHTML = `
      <div class="icon-title-wrapper">
        <img class="icon icon-main" src="${icon ? icon : ''}" />
        <h2 class="title">${node.name}</h2>
      </div>
      <div class="type ${!node.typeId ? 'empty' : ''}" title="Type"><span>
        <img class="icon icon-small" src="${getIcon(node.typeId)}" /> ${this.allNodes[node.typeId]?.name}
      </span></div>
      <div class="tags ${!node.tags.length ? 'empty' : ''}">Tags: ${node.tags.map(tag => `<span class="tag"><img class="icon icon-small" src="${getIcon(tag.id)}" /> ${tag.name}</span>`).join(', ')}</div>
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

      ${wikilinks}
      `
    // TODO ~:
    // <h3>Linking here</h4>
    // TODO
    // <h4>Likely mentions</h4>

    // Add hover events to all links with #id=<some-id>
    this.addHoverEventsToLinks(bio)

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

    bio.scrollTop = this.scrollTops[node.id] || 0
  }

  async fetchContent (node) {
    if (node.md === false) return ''
    // if (node.md === false && node.html) // TODO?
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
