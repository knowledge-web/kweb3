/* eslint-env browser */
/* global Cesium */
class CesiumMap extends HTMLElement {
  constructor () {
    super()
    this.viewer = null
    this.billboards = []
    this.selected = {} // { node, nodes }
    this.hovered = {}
  }

  connectedCallback () {
    this.initializeMap()

    this.classList.add('no-location')
    const placeInfo = document.createElement('div')
    placeInfo.id = 'placeInfo'
    placeInfo.innerHTML = 'No location'
    this.appendChild(placeInfo)

    this.listenToNodeSelected()
    this.listentoNodeHovered()
  }

  initializeMap () {
    this.apiKey = this.getAttribute('api-key') || 'default_api_key'
    Cesium.Ion.defaultAccessToken = this.apiKey
  
    this.viewer = new Cesium.Viewer(this, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      // Add any Cesium Ion assets here
      imageryProvider: new Cesium.IonImageryProvider({ assetId: 3812 })
    })
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
    this.clearMap()

    let noLocation = true
    if (node?.birth?.place?.coordinates) {
      this.showPlaceOnMap(node, node.birth.place.coordinates, false)
      noLocation = false
    }
    this.setPlaceInfo(node?.birth?.place)

    nodes.forEach(n => {
      if (n !== node && n?.birth?.place?.coordinates) {
        this.showPlaceOnMap(n, n.birth.place.coordinates, true)
        noLocation = false
      }
    })
    this.classList.toggle('no-location', noLocation)
  }

  listentoNodeHovered () {
    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas)
    const defaultIcon = 'secundary-icon.png'
    const hoverIcon = 'hover-icon.png'
  
    handler.setInputAction(event => {
      const pickedObject = this.viewer.scene.pick(event.position)
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const node = pickedObject.id.node
        const eventDetail = { node, origin: 'map' }
        window.dispatchEvent(new CustomEvent('nodeHovered', { detail: eventDetail }))
  
        if (pickedObject.id.secundary) {
          pickedObject.id.image = hoverIcon
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  
    handler.setInputAction(event => {
      const pickedObject = this.viewer.scene.pick(event.position)
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.secundary) {
        pickedObject.id.image = defaultIcon
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_OUT)
  
    window.addEventListener('nodeHovered', event => {
      let { node, origin } = event.detail
      this.setPlaceInfo(node.id ? node?.birth?.place : this.selected.node?.birth?.place)
      if (origin === 'map') return
  
      let billboard = this.billboards.find(billboard => billboard.node.name === node.name)
      if (!node.id) {
        node = this.selected.node
        billboard = this.billboards.find(billboard => billboard.node.name === (this.hovered || {}).name)
        if (billboard && billboard.secundary) billboard.image = defaultIcon
      } else {
        if (billboard && billboard.secundary) billboard.image = hoverIcon
      }
  
      if (node?.birth?.place?.coordinates) {
        this.panToCoordinates(node.birth.place.coordinates)
      }
      this.hovered = node
    })
  }  

  panToCoordinates (coordinates) {
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(coordinates[1], coordinates[0], 5000)
    })
  }

  showPlaceOnMap (node, [lat, lng], secundary = false) {
    const billboardCollection = new Cesium.BillboardCollection()
    this.viewer.scene.primitives.add(billboardCollection)

    const billboard = billboardCollection.add({
      position: Cesium.Cartesian3.fromDegrees(lng, lat),
      image: secundary ? 'secundary-icon.png' : 'primary-icon.png'
    })

    billboard.node = node
    billboard.secundary = secundary
    this.billboards.push(billboard)
  }

  clearMap () {
    this.billboards.forEach(billboard => {
      billboardCollection.remove(billboard)
    })
    this.billboards = []
  }
}

customElements.define('cesium-map', CesiumMap)
