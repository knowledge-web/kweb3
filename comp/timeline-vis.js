/* global HTMLElement, vis, customElements */
import { getIcon } from '../utils.js'

function fixDate (dateString) { // TODO fix all.json instead!
  if (!dateString) return
  if (dateString[0] === '+') dateString = dateString.substring(1)
  return new Date(dateString)
}

class TimelineVis extends HTMLElement {
  constructor () {
    super()
    this.prevNode = {}
    this.attachShadow({ mode: 'open' })
    // Styles
    const style = document.createElement('style')
    style.textContent = `
      img.icon[src=""] { display: none; }
      #visualization {
        position: fixed;
        bottom: 0;
        width: 100%;
        height: 100%;
        color: #eee;
        border: 0;
      }
      #visualization.empty .vis-timeline {
        display: none;
      }
      #visualization .vis-time-axis .vis-text {
        color: #eee;
      }

      .vis-item {
        opacity: 0.7;
        height: 20px !important; /* Set height */
        border-width: 0 !important;
        cursor: pointer;
      }
      .vis-item .vis-item-content {
        font-size: 14px !important; /* Set font size */
        padding: 0 4px !important; /* Remove padding */
        top: -3px;
      }
      .vis-item.selected {
        font-weight: bold;
      }

      .vis-item img {
        position: relative !important;
        top: 4px !important;
      }

      .vis-item:hover, .vis-item.hovered {
        opacity: 1.0 !important;
      }
    `

    // Container for Timeline
    const container = document.createElement('div')
    container.id = 'visualization'
    container.classList.add('empty')

    // Add elements to shadow DOM
    this.shadowRoot.appendChild(style)
    this.shadowRoot.appendChild(container)

    this.initializeTimeline()
  }

  // FIXME Stop listening when unmounted?

  initializeTimeline () {
    // Dynamically import CSS and JS dependencies
    Promise.all([
      this.loadScript('https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js'),
      this.loadStyles('https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css')
    ]).then(() => {
      const container = this.shadowRoot.querySelector('#visualization')

      this.items = new vis.DataSet([
        // { id: '4', content: 'item 4', start: '2014-04-16', end: '2014-04-19' },
        // { id: '5', content: 'item 5', start: '2014-04-25' },
        // { id: '6', content: 'item 6', start: '2014-04-27', type: 'point' }
      ])

      const options = {}

      this.timeline = new vis.Timeline(container, this.items, options)

      // Add click event listener
      this.timeline.on('select', (properties) => {
        const selectedIds = properties.items
        if (selectedIds.length > 0) {
          const id = selectedIds[0]
          const clickedItem = this.items.get(id)
          const node = { id: clickedItem.id, name: clickedItem.content }
          const ev = new CustomEvent('selectNode', { detail: { node, origin: 'timeline' } })
          window.dispatchEvent(ev)
        }
      })

      // Add mouseover event listener
      this.timeline.on('itemover', (properties) => {
        const id = properties.item
        if (id) {
          const hoveredItem = this.items.get(id)
          const node = { id: hoveredItem.id, name: hoveredItem.content }
          this.prevNode = node
          const ev = new CustomEvent('hoverNode', { detail: { node, origin: 'timeline' } })
          window.dispatchEvent(ev)
        }
      })

      // Add mouseout event listener
      this.timeline.on('itemout', (properties) => {
        const ev = new CustomEvent('hoverNode', { detail: { node: {}, prevNode: this.prevNode, origin: 'timeline' } })
        window.dispatchEvent(ev)
      })

      // this.timeline.on('changed', () => {
      //   const itemElements = this.shadowRoot.querySelectorAll('.vis-item');
      //   itemElements.forEach((itemElement) => {
      //     itemElement.style.height = '20px';
      //     itemElement.style.top = (parseFloat(itemElement.style.top) - 10) + 'px';  // Adjust as needed
      //   });
      // });

      window.addEventListener('nodeSelected', (event) => {
        this.selected = event.detail
        const selectedId = this.selected.node.id
        let data = this.selected.nodes.filter(node => node.birth?.date && node.death?.date)
        
        data = data.map(node => {
          const n = {
            id: node.id,
            className: `node--${node.id}`,
            content: `<img class="icon" src="${getIcon(node)}" height="16" /> ${node.name}`,
            start: fixDate(node.birth.date),
            end: fixDate(node.death.date)
          }
          if (node.color) n.style = `background: ${node.color};`
          if (node.id === selectedId) n.className += ' selected'
          return n
        })
        this.updateData(data)
      })

      window.addEventListener('nodeHovered', event => {
        const { node, prevNode, origin } = event.detail
        if (node === prevNode) return
        this.prevNode = prevNode

        if (origin === 'timeline') return
        const items = this.shadowRoot.querySelectorAll('#visualization .vis-item')
        items.forEach((itemElement) => { itemElement.classList.remove('hovered') })
        for (const item of items) {
          const id = Array.from(item.classList).filter(cls => cls.startsWith('node--'))[0].split('--')[1]
          if (id !== node.id) continue
          return item.classList.add('hovered') // done
        }
      })
    })
  }

  updateData (newItems) {
    // Hide timeline if no items
    this.shadowRoot.querySelector('#visualization').classList.toggle('empty', newItems.length === 0)
    this.items.clear()
    this.items.add(newItems)
    this.timeline.fit()
  }

  loadScript (url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = url
      script.onload = resolve
      script.onerror = reject
      this.shadowRoot.appendChild(script)
    })
  }

  loadStyles (url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.type = 'text/css'
      link.href = url
      link.onload = resolve
      link.onerror = reject
      this.shadowRoot.appendChild(link)
    })
  }
}

customElements.define('timeline-vis', TimelineVis)
