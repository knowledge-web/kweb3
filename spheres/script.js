const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add light to the scene
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(0, 0, 0);
scene.add(light);

// GUI
const gui = new dat.GUI();
const controls = {
  rotationSpeed: 0.01,
  zoom: 10,
  sphereRadius: 5,
  numNodes: 100,
  numLinks: 500,
  avgLinksPerNode: 5,
  repulsionForce: 0.1,
  attractionForce: 0.01,
  algorithm: 'Fruchterman-Reingold',
  enableMapping: false
};
gui.add(controls, 'rotationSpeed', 0, 0.1);
gui.add(controls, 'zoom', 1, 20).onChange(value => camera.position.z = value);
gui.add(controls, 'sphereRadius', 1, 10);
gui.add(controls, 'numNodes', 10, 200);
gui.add(controls, 'numLinks', 10, 800);
gui.add(controls, 'avgLinksPerNode', 1, 15);
gui.add(controls, 'repulsionForce', 0, 0.2);
gui.add(controls, 'attractionForce', 0, 0.1);
gui.add(controls, 'algorithm', ['Fruchterman-Reingold', 'Kamada-Kawai']);
gui.add(controls, 'enableMapping');

// Nodes
const geometry = new THREE.SphereGeometry(0.1, 32, 32);
const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const nodes = [];
const edges = [];

for (let i = 0; i < controls.numNodes; i++) {
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(Math.random() * 5, Math.random() * 5, Math.random() * 5);
  scene.add(sphere);
  nodes.push(sphere);
}

// Edges
for (let i = 0; i < controls.numLinks; i++) {
  const startNode = nodes[Math.floor(Math.random() * nodes.length)];
  let endNode = nodes[Math.floor(Math.random() * nodes.length)];
  while (startNode === endNode) {
    endNode = nodes[Math.floor(Math.random() * nodes.length)];
  }
  const points = [startNode.position.clone(), endNode.position.clone()];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.33 });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);
  edges.push({ line, startNode, endNode });
}

camera.position.z = controls.zoom;

// Force layout
const applyForces = () => {
  if (controls.algorithm === 'Fruchterman-Reingold') {
    nodes.forEach((node, i) => {
      let force = new THREE.Vector3(0, 0, 0);
      nodes.forEach((otherNode, j) => {
        if (i !== j) {
          const diff = new THREE.Vector3().subVectors(node.position, otherNode.position);
          const distance = diff.length();
          const repulsion = diff.normalize().multiplyScalar(controls.repulsionForce / distance);
          force.add(repulsion);
        }
      });
      edges.forEach(edge => {
        if (edge.startNode === node || edge.endNode === node) {
          const otherNode = edge.startNode === node ? edge.endNode : edge.startNode;
          const diff = new THREE.Vector3().subVectors(otherNode.position, node.position);
          const distance = diff.length();
          const attraction = diff.normalize().multiplyScalar(controls.attractionForce * distance);
          force.add(attraction);
        }
      });
      node.position.add(force);
    });
  } else if (controls.algorithm === 'Kamada-Kawai') {
    nodes.forEach((node, i) => {
      let force = new THREE.Vector3(0, 0, 0);
      nodes.forEach((otherNode, j) => {
        if (i !== j) {
          const diff = new THREE.Vector3().subVectors(node.position, otherNode.position);
          const distance = diff.length();
          const repulsion = diff.normalize().multiplyScalar(controls.repulsionForce / Math.sqrt(distance));
          force.add(repulsion);
        }
      });
      edges.forEach(edge => {
        if (edge.startNode === node || edge.endNode === node) {
          const otherNode = edge.startNode === node ? edge.endNode : edge.startNode;
          const diff = new THREE.Vector3().subVectors(otherNode.position, node.position);
          const distance = diff.length();
          const attraction = diff.normalize().multiplyScalar(controls.attractionForce * Math.sqrt(distance));
          force.add(attraction);
        }
      });
      node.position.add(force);
    });
  }

  // Update edge positions
  edges.forEach(edge => {
    edge.line.geometry.setFromPoints([edge.startNode.position.clone(), edge.endNode.position.clone()]);
    edge.line.geometry.verticesNeedUpdate = true;
  });

  // Map nodes to a sphere
  if (controls.enableMapping) {
    nodes.forEach(node => {
      node.position.normalize().multiplyScalar(controls.sphereRadius);
    });
  }
};

const animate = function () {
  requestAnimationFrame(animate);
  scene.rotation.x += controls.rotationSpeed;
  scene.rotation.y += controls.rotationSpeed;
  applyForces();
  renderer.render(scene, camera);
};

animate();
