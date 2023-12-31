class CesiumGlobeComponent extends HTMLElement {
  cesiumViewer = null
  zoomLevel = 10000

  constructor () {
    super()
    this.attachShadow({ mode: 'open' }) // Encapsulate styles and markup

    // Set innerHTML with Cesium container and place info div
    const style = `
      #cesiumContainer {
        width: 100%;
        height: 100%;
        opacity: 0.33;
        transition: width 0.5s ease-in-out, height 0.5s ease-in-out, opacity 0.5s ease-in;
      }
      :host(.active) #cesiumContainer {
        width: 100%;
        height: 100%;
        opacity: 1;
      }
      #placeInfo {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 100;
        padding-left: 10px;
        padding-right: 10px;
        color: white;
        opacity: 0.8;
        background-color: rgba(0, 0, 0, 0.5);
        width: 100%;
      }
      #placeInfo.empty {
        display: none;
      }
      .cesium-widget canvas {
        width: 100%;
        height: 300px;
      }
      .cesium-credit-lightbox, .cesium-credit-lightbox * {
        display: none !important;
      }
        `
    this.shadowRoot.innerHTML = `<style>${style}</style>
      <div id="cesiumContainer"></div>
      <div id="placeInfo"></div>
    `;

    // Listen to the nodeSelected event
    window.addEventListener('nodeSelected', event => {
      const { node } = event.detail
      this.showPlaceOnMap(node?.birth?.place?.coordinates)
      this.showPlaceInfo(node?.birth?.place)
    })
  }

  connectedCallback () {
    this.initializeCesiumViewer()
  }

  async initializeCesiumViewer () {
    const apiKey = this.getAttribute('api-key') || 'your_default_access_token'
    Cesium.Ion.defaultAccessToken = apiKey

    // Initialize the Cesium Viewer in the cesiumContainer
    this.cesiumViewer = new Cesium.Viewer(this.shadowRoot.getElementById('cesiumContainer'), {
      animation: false,
      skyBox: false,
      skyAtmosphere: false,
      contextOptions: { webgl: { alpha: true } },
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      creditContainer: this.createHiddenElement()
    })

    this.cesiumViewer.scene.backgroundColor = Cesium.Color.TRANSPARENT
    this.cesiumViewer.camera.changed.addEventListener(this.updateZoomLevel.bind(this))
    this.zoomToWorld()
  }

  updateZoomLevel () {
    if (this.machineZoom) return
    this.toggleActive(true)
    this.zoomLevel = this.cesiumViewer.camera.positionCartographic.height
  }

  zoomToWorld () {
    this.toggleActive(false)
    this.machineZoom = true
    this.cesiumViewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 10000000),
      complete: () => { this.machineZoom = false }
    })
  }

  toggleActive (active) {
    this.active = active
    this.classList.toggle('active', active)
  }

  createHiddenElement () {
    const creditContainer = document.createElement('div')
    creditContainer.style.display = 'none'
    return creditContainer
  }

  showPlaceOnMap (coordinates = []) {
    // Check if the viewer has been initialized
    if (!this.cesiumViewer) return
    const [latitude, longitude] = coordinates
    if (typeof longitude !== 'number' || typeof latitude !== 'number') return this.zoomToWorld()
    this.machineZoom = true
    this.toggleActive(true)
    this.cesiumViewer.camera.flyTo({ // Fly the camera to the point
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, this.zoomLevel),
      complete: () => {
        this.machineZoom = false
        // Create a point on the map
        this.cesiumViewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
          point: {
            pixelSize: 10,
            color: Cesium.Color.RED
          }
        })
      }
    })
  }

  showPlaceInfo (place = {}) {
    // TODO add continent here... to the raw data or deduce it here from existing data
    // TODO one may select [earth, ] continent, country, city or position for different zoom & highlights (borders for continents & countries, pins for the others probably)
    const text = (place.name || place.country) ? [place.country, place.name].join(' > ') : ''
    const placeInfo = this.shadowRoot.getElementById('placeInfo')
    placeInfo.classList.toggle('empty', !text)
    placeInfo.innerHTML = text
  }
}

// Define the new element
customElements.define('cesium-globe', CesiumGlobeComponent)
