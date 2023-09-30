class KWebVideo extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    const enabled = window.location.search.includes('video')
    if (!enabled) {
      this.shadowRoot.innerHTML = `<div style="margin: 4px;">
          <a href="?video">video experiment</a>
        </div>`
      return
    }
    const videoUrl = this.getAttribute('video-url')
    const subtitleUrl = this.getAttribute('subtitle-url')

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          z-index: 250;
          display: block;
          width: 100%;
          text-align: center;
        }

        #currentNodeId {
          /* NOTE debug printing of the subtitle / id */
          display: none;
          color: #fff;
          font-size: 24px;
          margin-top: 10px;
        }

        video {
          max-width: 100%;
          height: auto;
        }
      </style>
      <div id="video-container">
        <video id="videoPlayer" controls>
          <source src="${videoUrl}" type="video/mp4">
        </video>
        <div id="currentNodeId"></div>
      </div>
    `

    const videoPlayer = this.shadowRoot.getElementById('videoPlayer')
    const currentNodeIdElement = this.shadowRoot.getElementById('currentNodeId')

    fetch(subtitleUrl)
      .then(response => response.text())
      .then(text => {
        const subtitleToNodeMap = this.parseSubtitles(text)
        const sortedTimestamps = Object.keys(subtitleToNodeMap).sort((a, b) => a - b)

        let lastId = null
        videoPlayer.addEventListener('timeupdate', function () {
          const currentTime = Math.floor(videoPlayer.currentTime)

          let closestTimestamp = sortedTimestamps.reduce((acc, cur) => {
            return cur <= currentTime ? cur : acc
          }, -1)

          if (closestTimestamp !== -1) {
            let nodeId = subtitleToNodeMap[closestTimestamp]
            if (nodeId === lastId) return
            lastId = nodeId
            currentNodeIdElement.textContent = `${nodeId}`
            
            nodeId = nodeId.trim()
            if (nodeId.length === 36) {
              // trigger node focus event
              console.log('trigger node focus event for:', nodeId)
              const node = { id: nodeId }
              const event = new CustomEvent('selectNode', { detail: { node, origin: 'map' } })
              window.dispatchEvent(event)        
            }
          }
        })
      })
  }

  parseSubtitles(text) {
    const lines = text.split('\n')
    const subtitleToNodeMap = {}

    lines.forEach(line => {
      const match = line.match(/(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)/)
      if (match) {
        const startSeconds = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3])
        subtitleToNodeMap[startSeconds] = lines[lines.indexOf(line) + 1]
      }
    })

    return subtitleToNodeMap
  }
}

customElements.define('kweb-video', KWebVideo)