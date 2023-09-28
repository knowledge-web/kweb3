/* eslint-env browser */
// import * as d3 from 'https://d3js.org/d3.v7.min.js'

function computeBarYPosition (data, direction = 'center') {
  function xOverlaps (a, b) {
    return a.birth < b.death + 1 && a.death + 1 > b.birth
  }

  const yPos = []
  const lastBars = {}

  let minRow = 0
  let maxRow = 0

  data.sort((a, b) => a.birth - b.birth)

  data.forEach((d, i) => {
    if (i === 0) {
      yPos[i] = 0
      lastBars[0] = d
      return;
    }

    let optimalRow
    let minDeathYear = Infinity

    for (const row of Object.keys(lastBars).map(Number)) {
      if (!xOverlaps(lastBars[row], d) && lastBars[row]?.death < minDeathYear) {
        optimalRow = row
        minDeathYear = lastBars[row]?.death
      }
    }

    if (optimalRow === undefined) {
      if (direction === 'top') {
        optimalRow = maxRow + 1
      } else if (direction === 'bottom') {
        optimalRow = minRow - 1
      } else {
        optimalRow = Math.abs(minRow - 1) < maxRow + 1 ? minRow - 1 : maxRow + 1
      }
    }

    yPos[i] = optimalRow
    lastBars[optimalRow] = d

    if (optimalRow < minRow) {
      minRow = optimalRow
    }
    if (optimalRow > maxRow) {
      maxRow = optimalRow
    }
  })

  return yPos
}

function Timeline (data) {
  // Chart dimensions and configuration
  const margin = { top: 10, right: 20, bottom: 50, left: 20 }
  const width = 1000

  // Bar height
  const barHeight = 20

  data.forEach((d) => {
    d.birth = d.birth instanceof Date ? d.birth.getFullYear() : d.birth
    d.death = d.death instanceof Date ? d.death.getFullYear() : d.death
  })

  // Calculate max of the death year and min of the birth year
  const maxYear = Math.max(...data.map((d) => d.death)) + 20
  const minYear = Math.min(...data.map((d) => d.birth)) - 20

  // Compute the y position for each bar
  const yPos = computeBarYPosition(data)

  // Calculate the maximum yPos value and the height of the chart
  const yPosMax = Math.max(...yPos)
  const yPosMin = Math.min(...yPos)
  const chartHeight = (yPosMax - yPosMin) * barHeight * 2
  const height = chartHeight + margin.top + margin.bottom

  // Create X and Y scales
  const xScale = d3
    .scaleLinear()
    .domain([minYear, maxYear])
    .range([margin.left, width - margin.right])
  const yScale = d3
    .scalePoint()
    .domain(d3.range(yPosMin, yPosMax + 1))
    .range([height - margin.bottom, margin.top])
    .padding(1.5)

  // Create the chart
  const svg = d3
    .select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
    .attr('width', width)
    .attr('height', height)
    .style('color', 'white')

  const centuryStart = Math.ceil(minYear / 100) * 100
  const centuries = d3.range(centuryStart, maxYear, 100)

  // Draw vertical gridlines at every century mark
  const linesLayer = svg.append('g').attr('class', 'lines-layer')

  linesLayer
    .append('g')
    .selectAll('line')
    .data(centuries)
    .join('line')
    .attr('x1', (d) => xScale(d))
    .attr('x2', (d) => xScale(d))
    .attr('y1', margin.bottom)
    .attr('y2', chartHeight)
    .style('stroke', 'rgba(255,255,255,0.2)')
    .style('stroke-dasharray', '2,2')

  // Draw x-axis with labels every 20 years, starting from 1700
  svg
    .append('g')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(
      d3
        .axisBottom(xScale)
        .tickValues(d3.range(Math.floor(minYear / 20) * 20, maxYear, 20))
        .tickFormat(d3.format('.0f'))
        .tickSizeOuter(0)
    )

  // Create bars and labels
  const bars = svg.append('g').selectAll('g').data(data).join('g')

  // Create bars
  bars
    .append('rect')
    .attr('data-id', (d) => d.id)
    .attr('x', (d) => xScale(d.birth))
    .attr('width', (d) => xScale(d.death) - xScale(d.birth))
    .attr('y', (d, i) => yScale(yPos[i]))
    .attr('height', barHeight)
    .attr('fill', 'steelblue')

  // Create labels displaying only name
  bars
    .append('text')
    .text((d) => d.name)
    .attr('x', (d) => xScale(d.birth) + 4)
    .attr('y', (d, i) => yScale(yPos[i]) + barHeight / 2)
    .attr('alignment-baseline', 'central')
    .attr('font-size', 12)
    .attr('fill', 'white')
    .attr('white-space', 'nowrap')
    .attr('text-overflow', 'ellipsis')

  bars.on('click', function (event, d) {
    const node = { id: d.id, name: d.name }
    const ev = new CustomEvent('selectNode', { detail: { node, origin: 'timeline' } })
    window.dispatchEvent(ev)
  })

  let prevNode = null // hovered node
  bars.on('mouseover', function (event, d) {
    const node = { id: d.id, name: d.name }
    prevNode = node
    const ev = new CustomEvent('hoverNode', { detail: { node, origin: 'timeline' } })
    window.dispatchEvent(ev)
  })
  bars.on('mouseout', function (event, d) {
    const ev = new CustomEvent('hoverNode', { detail: { node: {}, prevNode, origin: 'timeline' } })
    window.dispatchEvent(ev)
  })

  // Mouseover and mouseout events for scrolling labels and showing dates on the timeline
  // bars.on('mouseover', function (event, d) {
  //   const bar = d3.select(this)

  //   // Show vertical lines and dates along the timeline
  //   const lineGroup = svg.append('g')
  //     .attr('class', 'timeline-hover')
  //     .lower() // Lower the group so that it is positioned behind the bars

  //   lineGroup.append('line')
  //     .attr('x1', xScale(d.birth))
  //     .attr('x2', xScale(d.birth))
  //     .attr('y1', yScale(yPos[data.indexOf(d)]) + barHeight) // Start from the bottom of the bar
  //     .attr('y2', chartHeight)
  //     .style('stroke', 'rgba(225,0,0,0.3)')

  //   lineGroup.append('line')
  //     .attr('x1', xScale(d.death))
  //     .attr('x2', xScale(d.death))
  //     .attr('y1', yScale(yPos[data.indexOf(d)]) + barHeight) // Start from the bottom of the bar
  //     .attr('y2', chartHeight)
  //     .style('stroke', 'rgba(225,0,0,0.3)')

  //   lineGroup.append('text')
  //     .text(d.birth)
  //     .attr('x', xScale(d.birth))
  //     .attr('y', chartHeight + 30)
  //     .attr('text-anchor', 'middle')
  //     .attr('fill', 'red') // Display birth date in red

  //   lineGroup.append('text')
  //     .text(d.death)
  //     .attr('x', xScale(d.death))
  //     .attr('y', chartHeight + 30)
  //     .attr('text-anchor', 'middle')
  //     .attr('fill', 'red') // Display death date in red

  //   // Scroll label if necessary
  //   const label = bar.select('text')
  //   const labelWidth = label.node().getComputedTextLength()
  //   const barWidth = xScale(d.death) - xScale(d.birth)
    
  //   if (labelWidth > barWidth - 8) {
  //     const scrollAmount = labelWidth - barWidth + 12 // Leave some padding for visual clarity
  //     label.interrupt() // Stop any active transition
  //       .transition()
  //       .duration(2000)
  //       .ease(d3.easeQuadInOut)
  //       .attr('x', d => xScale(d.birth) + 4 - scrollAmount)
  //       .attr('clip-path', 'polygon(0,0,${barWidth},0,${barWidth},${barHeight},0,${barHeight})')
  //   }
  // })
  //   .on('mouseout', function (event, d) {
  //     // Hide vertical lines and dates along the timeline
  //     svg.selectAll('.timeline-hover').remove()
  
  // Reset the label position to original
  //   const label = d3.select(this).select('text')
  //   const currentXPosition = parseFloat(label.attr('x'))
  //   const originalXPosition = xScale(d.birth) + 4

  //   if (currentXPosition !== originalXPosition) {
  //     label.interrupt() // Stop any active transition
  //       .transition()
  //       .duration(2000)
  //       .ease(d3.easeQuadInOut)
  //       .attr('x', originalXPosition)
  //   }
  // })

  // Return the SVG node as a value
  return svg.node()
}

class HistoricalTimeline extends HTMLElement {
  constructor () {
    super()

    // this.loadScript("https://d3js.org/d3.v7.min.js").then(() => {
    // Attach shadow root
    this.shadow = this.attachShadow({ mode: 'open' })

    // Initial data
    this.data = []

    // Add default styles to the shadow DOM
    const style = document.createElement('style')
    style.innerHTML = `
      :host {
        display: block;
        background-color: #111;
      }
      .hovered {
        fill: blue;
        stroke: white;
        stroke-width: 1px;
        cursor: pointer;
      }
      .toggle {
        position: absolute;
        top: 0;
        left: 0;
        padding: 0.5em;
        background-color: #111;
        color: white;
        cursor: pointer;
      }
      .toggle:hover {
        background-color: #222;
      }
      svg.hidden {
        display: none;
      }
    `
    this.shadow.appendChild(style)

    const toggleDiv = document.createElement('div')
    toggleDiv.classList.add('toggle')
    toggleDiv.innerHTML = 'toggle'
    this.shadow.appendChild(toggleDiv)

    // Add an SVG container
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.shadow.appendChild(this.svg)

    toggleDiv.addEventListener('click', () => {
      this.classList.toggle('hidden')
      this.svg.classList.toggle('hidden')
    })
  }

  connectedCallback () {
    // Render when connected to the DOM
    // this.render()

    function fixDate (dateString) { // TODO fix all.json instead!
      if (!dateString) return
      if (dateString[0] === '+') dateString = dateString.substring(1)
      return new Date(dateString)
    }

    window.addEventListener('nodeSelected', event => {
      this.selected = event.detail
      let data = this.selected.nodes.filter(node => node.birth?.date && node.death?.date)
      data = data.map(node => { return { id: node.id, name: node.name, birth: fixDate(node.birth.date), death: fixDate(node.death.date) } })
      this.render(data)
    })

    window.addEventListener('nodeHovered', event => {
      const { node, prevNode, origin } = event.detail
      // if (origin === 'timeline') return

      this.svg.querySelectorAll('.hovered').forEach(elem => { // remove all existing 'hovered' classes
        elem.classList.remove('hovered')
      })

      this.hovered = node
      // find the node in the svg and highlight it
      if (!node || !node.name) return
      const elem = this.svg.querySelector(`[data-id="${node.id}"]`)
      if (!elem) return
      elem.classList.add('hovered')
    })
  }

  render (data) {
    if (this.svg) this.shadow.removeChild(this.svg)
    this.svg = Timeline(data)
    this.shadow.appendChild(this.svg)
  }
}

// Define the custom element
customElements.define('kweb-timeline', HistoricalTimeline)
