/* global HTMLElement, vis, customElements */

function fixDate (dateString) { // TODO fix all.json instead!
  if (!dateString) return
  if (dateString[0] === '+') dateString = dateString.substring(1)
  return new Date(dateString)
}

class TimelineVis extends HTMLElement {
  constructor () {
    super()

    this.attachShadow({ mode: 'open' })

    // Styles
    const style = document.createElement('style')
    style.textContent = `
      #visualization {
        position: fixed;
        bottom: 0;
        width: 100%;
        height: 100%;
        border: 1px solid #444;
        background-color: #333;
        color: #fff;
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
      window.addEventListener('nodeSelected', (event) => this.handleNodeSelected(event))
    })
  }

  handleNodeSelected (event) {
    console.log('TimelineVis received nodeSelected event', event.detail)
    this.selected = event.detail
    let data = this.selected.nodes.filter(node => node.birth?.date && node.death?.date)
    data = data.map(node => {
      return { id: node.id, content: node.name, start: fixDate(node.birth.date), end: fixDate(node.death.date) }
    })
    console.log(data, 'data')
    this.updateData(data)
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
