// Standard JS style
const fetchGraphData = async () => {
  const response = await fetch('../network_graph_with_rules.json')
  const data = await response.json()
  return data
}

const highlightNodeAndEdges = (node, edges) => {
  // Highlight the node
  node.material.color.set(0xffff00) // Set to highlighted
  node.material.opacity = 1.0

  // Highlight the edges
  edges.forEach(edge => {
    if (edge.startNode === node || edge.endNode === node) {
      edge.line.material.color.set(0xffff00) // Set to highlighted
      edge.line.material.opacity = 0.75 // Set opacity to 1
    }
  })
  setTimeout(() => {
    removeHighlight(node, edges)
  }, 1000)
}

const removeHighlight = (node, edges) => {
  // Remove highlight from the node
  node.material.color.set(0xffffff) // Set back to original color
  node.material.opacity = 0.5

  // Remove highlight from the edges
  edges.forEach(edge => {
    if (edge.startNode === node || edge.endNode === node) {
      edge.line.material.color.set(0xffffff) // Set back to white
      edge.line.material.opacity = 0.15 // Set opacity back to 0.15
    }
  })
}

const initGraph = async () => {
  const { nodes: allNodes, links } = await fetchGraphData()
  const nodesData = allNodes.filter(node => node.century === 17)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.getElementById('container').appendChild(renderer.domElement)

  const light1 = new THREE.PointLight(0xffffff, 1, 100)
  light1.position.set(0, 0, 0)
  const light2 = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(light1)
  scene.add(light2)
  scene.fog = new THREE.FogExp2(0x000000, 0.1);


  const gui = new dat.GUI()
  const controls = {
    rotationSpeed: 0.01,
    zoom: 10,
    sphereRadius: 5,
    repulsionForce: 0.1,
    attractionForce: 0.01,
    algorithm: 'Fruchterman-Reingold',
    enableMapping: false
  }

  gui.add(controls, 'rotationSpeed', 0, 0.1)
  gui.add(controls, 'zoom', 1, 20).onChange(value => { camera.position.z = value })
  gui.add(controls, 'sphereRadius', 1, 10)
  gui.add(controls, 'repulsionForce', 0, 0.2)
  gui.add(controls, 'attractionForce', 0, 0.1)
  gui.add(controls, 'algorithm', ['Fruchterman-Reingold', 'Kamada-Kawai'])
  gui.add(controls, 'enableMapping')

  const geometry = new THREE.SphereGeometry(0.03, 32, 32)
  // const material = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
  const nodes = []
  const nodeMap = {}
  const edges = []
  
  nodesData.forEach(nodeData => {
    const individualMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
    const sphere = new THREE.Mesh(geometry, individualMaterial)
    sphere.position.set(Math.random() * 5, Math.random() * 5, Math.random() * 5)
    sphere.userData = nodeData
    scene.add(sphere)
    nodes.push(sphere)
    nodeMap[nodeData.id] = sphere
  })

  links.forEach(link => {
    const startNode = nodeMap[link.source]
    const endNode = nodeMap[link.target]
    if (startNode && endNode) {
      const points = [startNode.position.clone(), endNode.position.clone()]
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 })
      const line = new THREE.Line(lineGeometry, lineMaterial)
      scene.add(line)
      edges.push({ line, startNode, endNode })
    }
  })
  console.log('edges', edges.length)

  camera.position.z = controls.zoom

    
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
    
      // Map nodes to a sphere
      if (controls.enableMapping) {
        nodes.forEach(node => {
          node.position.normalize().multiplyScalar(controls.sphereRadius);
        });
        // Update edge positions
        edges.forEach(edge => {
          const start = edge.startNode.position.clone().normalize().multiplyScalar(controls.sphereRadius);
          const end = edge.endNode.position.clone().normalize().multiplyScalar(controls.sphereRadius);
          edge.line.geometry.setFromPoints([start, end]);
          edge.line.geometry.verticesNeedUpdate = true;
        });
      } else {
        edges.forEach(edge => {
          edge.line.geometry.setFromPoints([edge.startNode.position.clone(), edge.endNode.position.clone()]);
          edge.line.geometry.verticesNeedUpdate = true;
        });
      }
    };
    
    setInterval(() => {
      // Pick a random node
      const randomIndex = Math.floor(Math.random() * nodes.length)
      const highlightedNode = nodes[randomIndex]
      // Highlight the node and its edges
      highlightNodeAndEdges(highlightedNode, edges)
    }, 250)

    const animate = function () {
      requestAnimationFrame(animate);
      scene.rotation.x += controls.rotationSpeed;
      scene.rotation.y += controls.rotationSpeed;
      applyForces();
      renderer.render(scene, camera);
    };
    
    animate();
}

initGraph()
