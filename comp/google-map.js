/* eslint-env browser */
/* global google */
window.initMapKweb123 = function () {
  document.querySelectorAll('map-component').forEach(map => {
    map.initializeMap()
  })
}
class MapComponent extends HTMLElement {
  constructor () {
    super()
    this.map = null
    this.markers = []
  }

  connectedCallback () {
    this.apiKey = this.getAttribute('api-key') || 'default_api_key'

    this.loadGoogleMapsScript().then(() => {
      this.initializeMap()
      this.listenToNodeSelected()
    }).catch(err => {
      console.error('Failed to load Google Maps:', err)
    })
  }

  loadGoogleMapsScript () {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve()
      } else {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&callback=initMapKweb123`
        script.async = true
        script.defer = true
        document.head.appendChild(script)
        script.onload = resolve
        script.onerror = reject
      }
    })
  }

  async initializeMap () {
    const mapOptions = {
      zoom: 8,
      center: { lat: 0, lng: 0 }, // Initialize center at (0, 0)
      disableDefaultUI: true // Disable default UI controls
    }
    this.map = new window.google.maps.Map(this, mapOptions)
  }

  listenToNodeSelected () {
    window.addEventListener('nodeSelected', event => {
      const { node, nodes } = event.detail
      this.clearMap() // Clear previous pins if any

      // Show selected node
      if (node?.birth?.place?.coordinates) {
        this.showPlaceOnMap(node, node.birth.place.coordinates, false)
      }

      // Show additional nodes
      nodes.forEach(n => {
        if (n !== node && n?.birth?.place?.coordinates) {
          this.showPlaceOnMap(n, n.birth.place.coordinates, true)
        }
      })
    })
  }

  showPlaceOnMap (node, [lat, lng], secundary = false) {
    const position = { lat, lng }
    const markerOptions = {
      title: node.name,
      position,
      map: this.map
    }

    if (secundary) {
      markerOptions.icon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5, // Adjust the scale to change the size of the marker
        fillColor: '#808080', // Gray color
        fillOpacity: 1.0,
        strokeWeight: 0
      }
    }

    const marker = new google.maps.Marker(markerOptions)
    marker.addListener('click', () => {
      const event = new CustomEvent('selectNode', { detail: { node } })
      window.dispatchEvent(event)
    })
    marker.addListener('mouseover', () => {
      const event = new CustomEvent('hoverNode', { detail: { node } })
      window.dispatchEvent(event)
    })
    marker.addListener('mouseout', () => {
      const event = new CustomEvent('hoverNode', { detail: { node: null } })
      window.dispatchEvent(event)
    })
    this.markers.push(marker)
  }

  clearMap () {
    // Clearing the map by setting it to null
    if (this.map) {
      this.map.setCenter({ lat: 0, lng: 0 })
      this.map.setZoom(0)
      this.markers.forEach(marker => marker.setMap(null))
      this.markers = []
    }
  }
}

customElements.define('google-map', MapComponent)
