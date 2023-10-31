/* global HTMLElement, vis, customElements */
import { getIcon } from '../utils.js'

function fixDate (dateString) { // TODO fix all.json instead!
  if (!dateString) return
  if (dateString[0] === '+') dateString = dateString.substring(1)
  return new Date(dateString)
}

const prettyLifespan = (node) => {
  if (!node.birth?.date) return ''
  const birth = fixDate(node.birth.date).getFullYear().toString()
  const death = node.death?.date ? fixDate(node.death.date).getFullYear().toString() : 'present'
  return `${birth}–${death}`
}

class TimelineVis extends HTMLElement {
  constructor () {
    super()
    this.prevNode = {}
    this.attachShadow({ mode: 'open' })
    this.closed = false

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
      #wrapper.empty *, #wrapper.closed :not(.toggle) {
        display: none;
      }
      #visualization .vis-time-axis .vis-text {
        color: rgba(255, 255, 255, 0.5) !important;
      }
      #visualization * { /* NOTE hacky way to do this */
        border-color: rgba(255, 255, 255, 0.5) !important;
      }

      .vis-item {
        border-width: 0 !important;
      }
      .vis-item:not(.selected) {
        opacity: 0.75;
        height: 20px !important;
        cursor: pointer;
      }
      .vis-item.selected {
        height: 25px !important;
        font-weight: bold;
      }
      .vis-item:not(.selected) .vis-item-content {
        font-size: 14px !important;
        padding: 0 4px !important;
        top: -3px;
      }
      .vis-item.selected  .vis-item-content {
        font-size: 16px !important;
        top: -3px;
      }

      .vis-item img {
        position: relative !important;
        top: 4px !important;
      }

      .vis-item:hover, .vis-item.hovered {
        opacity: 1.0 !important;
      }

      div.arrow {
        position: absolute;
        top: -44px;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        font-size: 1.5em;
        color: rgba(255, 255, 255, 0.5);
        z-index: 100;
      }

      div.toggle {
        position: absolute;
        top: -33px;
        right: 0;
        padding: 4px;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.5);
        background: rgba(0, 0, 0, 0.5);
        z-index: 100;
      }
    `

    // Container for Timeline
    const wrapper = document.createElement('div')
    wrapper.id = 'wrapper'
    wrapper.classList.add('empty')
    wrapper.classList.toggle('closed', localStorage.getItem('timelineClosed') === 'yes')
    wrapper.innerHTML = `<div class="arrow">
      <span class="year">1807</span><br>↓
    </div>
    <div class="toggle">🕙 toggle</div>
    <div id="visualization"></div>`

    // Add elements to shadow DOM
    this.shadowRoot.appendChild(style)
    this.shadowRoot.appendChild(wrapper)

    this.shadowRoot.querySelector('.toggle').addEventListener('click', () => {
      const closed = this.shadowRoot.querySelector('#wrapper').classList.toggle('closed')
      localStorage.setItem('timelineClosed', closed ? 'yes' : '')
    })

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

      const options = {
        verticalScroll: true,
        maxHeight: 250,
        // option groupOrder can be a property name or a sort function
        // the sort function must compare two groups and return a value
        //     > 0 when a > b
        //     < 0 when a < b
        //       0 when a == b
        groupOrder: function (a, b) {
          return a.value - b.value;
        }
      }

      this.timeline = new vis.Timeline(container, this.items, options)

      var groups = new vis.DataSet([
        { id: 0, content: "-", value: 1 }, // needs to have some content or the scrollbar breaks(?)
        { id: 1, content: "", value: 2 },
      ]);
      this.timeline.setGroups(groups)      
      this.timeline.setOptions(options)


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
        if (!id) return
        const hoveredItem = this.items.get(id)
        const node = { id: hoveredItem.id, name: hoveredItem.content }
        this.prevNode = node
        const ev = new CustomEvent('hoverNode', { detail: { node, origin: 'timeline' } })
        window.dispatchEvent(ev)
      })

      // Add mouseout event listener
      this.timeline.on('itemout', (properties) => {
        // const id = properties.item
        // if (!id) return
        const ev = new CustomEvent('hoverNode', { detail: { node: {}, prevNode: this.prevNode, origin: 'timeline' } })
        window.dispatchEvent(ev)
      })

      function middleYear (start, end) {
        const middleTimestamp = (start.getTime() + end.getTime()) / 2
        const middleDate = new Date(middleTimestamp)
        const middleYear = middleDate.getFullYear().toString()
        return middleYear
      }

      this.timeline.on('rangechange', ({ start, end }) => {
        this.shadowRoot.querySelector('.arrow .year').textContent = middleYear(start, end)
      })
      
      this.timeline.on('rangechanged', ({ start, end }) => {
        this.shadowRoot.querySelector('.arrow .year').textContent = middleYear(start, end)
      })

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
          n.title = prettyLifespan(node) // hover text
          if (node.color) n.style = `background: ${node.color};`
          if (node.id === selectedId) n.className += ' selected'
          n.group = node.id === selectedId ? 0 : 1
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


  // NOTE before we just did this:
  // this.items.clear()
  // this.items.add(newItems)
  // this.timeline.fit({ animation: { duration: 1000, easingFunction: 'easeInOutQuad' }})
  // NOTE Unhappy about the size of this new function, but it works for now
  async updateData (newItems) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
    this.shadowRoot.querySelector('#wrapper').classList.toggle('empty', newItems.length === 0)
    const { items } = this

    // Get current and new item IDs
    const currentIds = new Set(items.get().map(item => item.id));
    const newIds = new Set(newItems.map(item => item.id));

    // Identify items to add and remove
    const toAdd = newItems.filter(item => !currentIds.has(item.id));
    const toRemove = Array.from(currentIds).filter(id => !newIds.has(id));

    const nrOperations = toAdd.length + toRemove.length
    const step = Math.min(100, 1000 / nrOperations) // never take more than 1s

    // Remove items one by one
    for (const id of toRemove) {
      items.remove([id]);
      await delay(step);
    }

    // Add items one by one
    for (const item of toAdd) {
      items.add([item]);
      await delay(step);
    }

    // Find the item with group=0, if it exists
    const groupZeroItem = items.get({ filter: item => item.group === 0 })[0];

    if (groupZeroItem) {
      items.update([{ id: groupZeroItem.id, group: 0 }])
      const middleDate = new Date((new Date(groupZeroItem.start).getTime() + new Date(groupZeroItem.end || groupZeroItem.start).getTime()) / 2);
      this.timeline.moveTo(middleDate, { animation: { duration: 1000, easingFunction: 'easeInOutQuad' } });
    }

    this.timeline.fit({ animation: { duration: 1000, easingFunction: 'easeInOutQuad' } });

    const scrollbar = this.shadowRoot.querySelector('.vis-vertical-scroll')
    if (!scrollbar) return
    setTimeout(() => { // NOTE All is smooth except this...
      scrollbar.scrollTop = 0
    }, 100)
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
