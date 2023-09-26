window.initMapKweb123 = function () {
  document.querySelectorAll('map-component').forEach(map => {
    map.initializeMap()
  })
  console.log('dfdsfsdf')
}
class MapComponent extends HTMLElement {
  constructor () {
    super()
    this.map = null
  }

  connectedCallback () {
    this.apiKey = this.getAttribute('api-key') || 'default_api_key';

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
      center: { lat: 0, lng: 0 } // Initialize center at (0, 0)
    }
    this.map = new google.maps.Map(this, mapOptions)
  }

  listenToNodeSelected () {
    window.addEventListener('nodeSelected', event => {
      const { node } = event.detail
      if (node && node.birth && node.birth.place && node.birth.place.coordinates) {
        this.showPlaceOnMap(node.birth.place.coordinates)
      } else {
        this.clearMap()
      }
    })
  }

  showPlaceOnMap ([lat, lng]) {
    console.log('333', lat, lng)
    const position = { lat, lng }
    this.map.setCenter(position)
    new google.maps.Marker({
      position,
      map: this.map
    })
  }

  clearMap () {
    // Clearing the map by setting it to null
    if (this.map) {
      this.map.setCenter({ lat: 0, lng: 0 })
      this.map.setZoom(0)
    }
  }
}

customElements.define('google-map', MapComponent)
