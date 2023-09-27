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
  console.log(data, 'data')

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
    `
    this.shadow.appendChild(style)

    // Add an SVG container
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    // this.selectedSvg = null
    this.shadow.appendChild(this.svg)
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
      let data = this.selected.nodes.filter(node => node.birth.date && node.death.date)
      data = data.map(node => { return { name: node.name, birth: fixDate(node.birth.date), death: fixDate(node.death.date) } })
      this.render(data)
    })

    window.addEventListener('nodeHovered', event => {
      const { node, origin } = event.detail
      if (origin === 'timeline') return
      this.hovered = node
      // this.selectedSvg = this.svg
      // TODO highlight node (don't replace timeline)
    })
  }

  render (data) {
    // Clear the SVG
    // while (this.svg.firstChild) {
    //   this.svg.removeChild(this.svg.firstChild)
    // }

    // data = [
    //   { name: 'Christopher Columbus', birth: 1451, death: 1506 },
    //   { name: 'Suleiman the Magnificent', birth: 1494, death: 1566 },
    //   { name: 'Queen Elizabeth I', birth: 1533, death: 1603 },
    //   { name: 'Toyotomi Hideyoshi', birth: 1537, death: 1598 },
    //   { name: 'Peter the Great', birth: 1672, death: 1725 },
    //   // { name: "George Washington", birth: 1732, death: 1799 },
    //   // { name: "Thomas Jefferson", birth: 1743, death: 1826 },
    //   // { name: "Abraham Lincoln xxxxxxxxxxxxxx", birth: 1809, death: 1865 },
    //   // { name: "Winston Churchill", birth: 1874, death: 1965 },
    //   // { name: "Benjamin Franklin", birth: 1706, death: 1790 },
    //   // { name: "Kangxi Emperor", birth: 1654, death: 1722 },
    //   // { name: "Qianlong Emperor", birth: 1711, death: 1799 },
    //   // { name: "Louis XIV", birth: 1638, death: 1715 },
    //   // { name: "Louis XVI", birth: 1754, death: 1793 },
    //   // { name: "Queen Victoria", birth: 1819, death: 1901 },
    //   // { name: "Otto von Bismarck", birth: 1815, death: 1898 },
    //   // { name: "Napoleon", birth: 1769, death: 1821 },
    //   // { name: "Franklin D. Roosevelt", birth: 1882, death: 1945 },
    //   // { name: "Li Hongzhang", birth: 1823, death: 1901 },
    //   // { name: "Adolf Hitler", birth: 1889, death: 1945 },
    //   { name: 'Vladimir Lenin', birth: 1870, death: 1924 },
    //   { name: 'Joseph Stalin', birth: 1878, death: 1953 },
    //   { name: 'Sun Yat-sen', birth: 1866, death: 1925 },
    //   { name: 'Mao Zedong', birth: 1893, death: 1976 },
    //   { name: 'Deng Xiaoping', birth: 1904, death: 1997 },
    //   { name: 'Emperor Meiji', birth: 1852, death: 1912 },
    //   // { name: "Mahatma Gandhi", birth: 1869, death: 1948 },
    //   // { name: "Queen Elizabeth II", birth: 1926, death: 2022 },
    //   // { name: "Nelson Mandela", birth: 1918, death: 2013 },
    //   { name: 'Martin Luther King Jr.', birth: 1929, death: 1968 },
    //   { name: 'Mikhail Gorbachev', birth: 1931, death: 2022 },
    //   { name: 'Lee Kuan Yew', birth: 1923, death: 2015 }
    //   // add more figures here
    // ]

    this.svg = Timeline(data)
    // console.log(this.svg)
    this.shadow.appendChild(this.svg)
    // Add your existing Timeline code here, using this.data and this.svg
    // For demonstration, let's add a simple text element to the SVG.
    // const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    // textElement.setAttribute('x', '10')
    // textElement.setAttribute('y', '50')
    // textElement.textContent = 'Your timeline will appear here.'
    // this.svg.appendChild(textElement)
  }
}

// Define the custom element
customElements.define('kweb-timeline', HistoricalTimeline)
