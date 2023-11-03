class CesiumGlobeComponent extends HTMLElement {
  cesiumViewer = null
  countryToContinent = {}
  zoomLevel = 10000

  constructor () {
    super()
    this.attachShadow({ mode: 'open' }) // Encapsulate styles and markup

    // Set innerHTML with Cesium container and place info div
    const style = `
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
        `
    this.shadowRoot.innerHTML = `<style>${style}</style>
      <div id="cesiumContainer" style="height: 100%;"></div>
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
    // Check if Cesium scripts are already loaded
    if (typeof Cesium === 'undefined') {
      this.loadCesiumScripts()
    } else {
      this.initializeCesiumViewer()
    }
  }

  loadCesiumScripts () {
    // Load Cesium.js
    const cesiumScript = document.createElement('script')
    cesiumScript.src = 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Cesium.js'
    cesiumScript.onload = () => {
      // Load widgets.css
      const widgetsLink = document.createElement('link')
      widgetsLink.href = 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Widgets/widgets.css'
      widgetsLink.rel = 'stylesheet'
      this.shadowRoot.appendChild(widgetsLink)

      this.initializeCesiumViewer()
    }
    this.shadowRoot.appendChild(cesiumScript)
  }

  initializeCesiumViewer () {
    const apiKey = this.getAttribute('api-key') || 'your_default_access_token'
    Cesium.Ion.defaultAccessToken = apiKey

    // Initialize the Cesium Viewer in the cesiumContainer
    this.cesiumViewer = new Cesium.Viewer(this.shadowRoot.getElementById('cesiumContainer'), {
      // terrain: Cesium.createWorldTerrain(),
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
    this.cesiumViewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 10000000)
    })
  }

  createHiddenElement () {
    const creditContainer = document.createElement('div')
    creditContainer.style.display = 'none'
    return creditContainer
  }

  showPlaceOnMap (coordinates = []) {
    // Check if the viewer has been initialized
    if (!this.cesiumViewer) return
    const [latitude, longitude] = coordinates;
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      this.cesiumViewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(0, 0, 10000000) })
      return
    }
    this.cesiumViewer.camera.flyTo({ // Fly the camera to the point
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, this.zoomLevel),
      complete: () => {
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
    console.log('text', text)
    placeInfo.innerHTML = text
  }
}

// Define the new element
customElements.define('cesium-globe', CesiumGlobeComponent)
