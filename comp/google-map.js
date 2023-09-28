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
    this.selected = {} // { node, nodes }
    this.hovered = {}
  }

  connectedCallback () {
    this.apiKey = this.getAttribute('api-key') || 'default_api_key'

    this.loadGoogleMapsScript().then(() => {
      this.initializeMap()

      const placeInfo = document.createElement('div')
      placeInfo.id = 'placeInfo'
      placeInfo.innerHTML = 'No location'
      this.appendChild(placeInfo)

      this.listenToNodeSelected()
      this.listentoNodeHovered()
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
      zoom: 5,
      center: { lat: 0, lng: 0 }, // Initialize center at (0, 0)
      disableDefaultUI: true // Disable default UI controls
    }
    this.map = new window.google.maps.Map(this, mapOptions)
  }

  listenToNodeSelected () {
    window.addEventListener('nodeSelected', event => {
      this.selected = event.detail
      this.showPins(this.selected)
    })
  }

  setPlaceInfo (place) {
    let text = '<span class="empty">[ no location data ]</span>'
    if (place?.name || place?.country) text = [place.name, place.country].join(', ')
    const placeInfo = document.querySelector('#placeInfo')
    placeInfo.innerHTML = text
  }

  showPins ({ node, nodes }) {
    this.clearMap() // Clear previous pins if any

    // Show selected node
    if (node?.birth?.place?.coordinates) {
      this.showPlaceOnMap(node, node.birth.place.coordinates, false)
      this.panToCoordinates(node.birth.place.coordinates) // Pan to main pin
    }
    this.setPlaceInfo(node?.birth?.place)

    // Show additional nodes
    nodes.forEach(n => {
      if (n !== node && n?.birth?.place?.coordinates) {
        this.showPlaceOnMap(n, n.birth.place.coordinates, true)
      }
    })
  }

  listentoNodeHovered () {
    const defaultIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 5,
      fillColor: '#808080', // Gray color
      fillOpacity: 1.0,
      strokeWeight: 0
    }

    const hoverIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 5,
      fillColor: '#DD0000', // Red color
      fillOpacity: 1.0,
      strokeWeight: 0
    }

    window.addEventListener('nodeHovered', event => {
      let { node, origin } = event.detail
      this.setPlaceInfo(node.id ? node?.birth?.place : this.selected.node?.birth?.place)
      if (origin === 'map') return
      let marker = this.markers.find(marker => marker.title === node.name)
      if (!node.id) {
        node = this.selected.node // pan to original node instead
        marker = this.markers.find(marker => marker.title === (this.hovered || {}).name)
        if (marker && marker.secundary) marker.setIcon(defaultIcon)
      } else {
        if (marker && marker.secundary) marker.setIcon(hoverIcon)
      }
      if (node?.birth?.place?.coordinates) {
        this.panToCoordinates(node.birth.place.coordinates) // Pan to pin
      }
      this.hovered = node
    })
  }

  // TODO perhaps zoom out a bit if the coordinates are too far away?
  panToCoordinates (coordinates) {
    const latLng = new google.maps.LatLng(coordinates[0], coordinates[1])
    this.map.panTo(latLng)
  }

  showPlaceOnMap (node, [lat, lng], secundary = false) {
    const position = { lat, lng }

    const defaultIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 5,
      fillColor: '#808080', // Gray color
      fillOpacity: 1.0,
      strokeWeight: 0
    }

    const hoverIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 5,
      fillColor: '#DD0000', // Red color
      fillOpacity: 1.0,
      strokeWeight: 0
    }

    const markerOptions = {
      title: node.name,
      position,
      map: this.map,
      icon: secundary ? defaultIcon : null,
      secundary
    }

    const marker = new google.maps.Marker(markerOptions)

    marker.addListener('click', () => {
      const event = new CustomEvent('selectNode', { detail: { node, origin: 'map' } })
      window.dispatchEvent(event)
    })
    marker.addListener('mouseover', () => {
      if (secundary) marker.setIcon(hoverIcon)
      const event = new CustomEvent('hoverNode', { detail: { node, origin: 'map' } })
      window.dispatchEvent(event)
    })
    marker.addListener('mouseout', () => {
      if (secundary) marker.setIcon(defaultIcon)
      const event = new CustomEvent('hoverNode', { detail: { node: null, origin: 'map' } })
      window.dispatchEvent(event)
    })
    this.markers.push(marker)
  }

  clearMap () {
    // Clearing the map by setting it to null
    if (this.map) {
      // this.map.setCenter({ lat: 0, lng: 0 })
      // this.map.setZoom(0)
      this.markers.forEach(marker => marker.setMap(null))
      this.markers = []
    }
  }
}

customElements.define('google-map', MapComponent)
