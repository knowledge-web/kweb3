// Your access token can be found at: https://ion.cesium.com/tokens.
// Replace `your_access_token` with your Cesium ion access token.

// TODO embed these inside the component also
// <script src="https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Cesium.js"></script>
// <link href="https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Widgets/widgets.css" rel="stylesheet">

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNTRmNjQ1MC0xOTIxLTRkM2QtOTNmNC1lZDkxODYxNWE4ODMiLCJpZCI6MTM3NTg3LCJpYXQiOjE2ODM3Mzc5NjB9.KwjcnhYYtZbFEfG-H0TbssroK5gHFKTp8tdhe3EE6JA'
Cesium.Ion.defaultAccessToken = apiKey

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Cesium.Viewer('cesiumContainer', {
  terrain: Cesium.Terrain.fromWorldTerrain(),
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
  creditContainer: document.createElement("none")
})

viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;