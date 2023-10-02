/* global HTMLElement, vis, customElements */

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
      #visualization {
        position: fixed;
        bottom: 0;
        width: 100%;
        height: 100%;
        color: #eee;
        border: 0;
      }
      #visualization .vis-time-axis .vis-text {
        color: #eee;
      }

      .vis-item {
        height: 20px !important; /* Set height */
      }
      .vis-item .vis-item-content{
        font-size: 14px !important; /* Set font size */
        padding: 0 4px !important; /* Remove padding */
      }

      .vis-item:hover, .vis-item.hovered {
        background-color: steelblue !important;
      }
    `

    // Container for Timeline
    const container = document.createElement('div')
    container.id = 'visualization'

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
        { id: 'sdfsf1', content: 'item 1', start: '2014-04-20' },
        { id: 'ss2s', content: 'item 2', start: '2014-04-14' },
        { id: '3ffs', content: 'item 3', start: '2014-04-18' },
        { id: 'ff4', content: 'item 4', start: '2014-04-16', end: '2014-04-19' },
        { id: 'sfs5', content: 'item 5', start: '2014-04-25' },
        { id: 'fghfghhf', content: 'item 6', start: '2014-04-27', type: 'point' }
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
        let data = this.selected.nodes.filter(node => node.birth?.date && node.death?.date)
        data = data.map(node => {
          return { id: node.id, content: node.name, start: fixDate(node.birth.date), end: fixDate(node.death.date) }
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
          if (item.textContent !== node.name) continue
          return item.classList.add('hovered') // done
        }
      })
    })
  }

  updateData (newItems) {
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
