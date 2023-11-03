function findPreviousValdIdFromSubtitleToNodeMap (subtitleToNodeMap, currentTime, onlySelect) {
  const times = Object.keys(subtitleToNodeMap).map(Number).sort((a, b) => b - a)
  for (let i = 0; i < times.length; i++) {
    if (times[i] <= currentTime) {
      const line = subtitleToNodeMap[times[i]].trim()
      let [id, action] = line.split(':')
      if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) continue
      action = action || 'select'
      if (onlySelect && action !== 'select') continue
      return [id, action]
    }
  }
  return []
}

class KWebVideo extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    const enabled = window.location.search.includes('video')
    if (!enabled) {
      // this.shadowRoot.innerHTML = `<div style="margin: 4px;">
      //     <a href="?video">video experiment</a>
      //   </div>`
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
        <a href="/">close video</a>
      </div>
    `

    const videoPlayer = this.shadowRoot.getElementById('videoPlayer')
    const currentNodeIdElement = this.shadowRoot.getElementById('currentNodeId')

    const savedTime = localStorage.getItem('videoTime')
    if (savedTime) {
      videoPlayer.currentTime = parseFloat(savedTime)
    }

    fetch(subtitleUrl)
      .then(response => response.text())
      .then(text => {
        const subtitleToNodeMap = this.parseSubtitles(text)
        const sortedTimestamps = Object.keys(subtitleToNodeMap).sort((a, b) => a - b)

        let lastId = null
        videoPlayer.addEventListener('timeupdate', function () {
          localStorage.setItem('videoTime', videoPlayer.currentTime)
          const currentTime = Math.floor(videoPlayer.currentTime)

          const [ id, action ] = findPreviousValdIdFromSubtitleToNodeMap(subtitleToNodeMap, currentTime)
          if (id === lastId) return
          lastId = id
          currentNodeIdElement.textContent = `${id}`
          
          // trigger node focus event
          // console.log('TRIGGER:', { id, action })
          const node = { id }
          if (action === 'unhover') {
            action = 'hover'
            node.id = null
          }
          if (action === 'hover') { // if hover, make sure the previous selection is still selected
            const [prevId, ] = findPreviousValdIdFromSubtitleToNodeMap(subtitleToNodeMap, currentTime, true)
            console.log('prevId:', prevId)
            if (prevId) window.dispatchEvent(new CustomEvent('selectNode', { detail: { node: { id: prevId }, origin: 'video' } }))
          }
          const event = new CustomEvent(`${action}Node`, { detail: { node, origin: 'video' } })
          window.dispatchEvent(event)
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