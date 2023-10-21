function findPaths ({ nodes, links }, id1, id2) {
  const maxPaths = 1
  const nodeMap = {};
  const neighbors = {};
  nodes.forEach(node => {
    nodeMap[node.id] = node;
  });
  links.forEach(link => {
    if (!neighbors[link.source]) {
      neighbors[link.source] = [];
    }
    neighbors[link.source].push(link);
  });

  const queue = [{ nodeId: id1, path: [], linkNames: [] }];
  const visited = new Set([id1]);
  const foundPaths = [];

  while (queue.length > 0 && foundPaths.length < maxPaths) {
    const { nodeId, path, linkNames } = queue.shift();

    if (nodeMap[nodeId].tags && nodeMap[nodeId].tags.some(tag => (tag.name === "Meta" || tag.name === "Journey"))) {
      continue;
    }

    if (nodeId === id2) {
      foundPaths.push({
        nodes: [{id: id1, name: nodeMap[id1].name}, ...path.map(id => ({id: id, name: nodeMap[id].name}))],
        linkNames: linkNames
      });
      continue;
    }

    const nodeNeighbors = neighbors[nodeId] || [];
    nodeNeighbors.forEach(link => {
      if (!visited.has(link.target)) {
        queue.push({
          nodeId: link.target,
          path: [...path, link.target],
          linkNames: [...linkNames, link.name]
        });
        visited.add(link.target);
      }
    });
  }

  foundPaths.sort((a, b) => a.nodes.length - b.nodes.length);

  return foundPaths;
}

self.addEventListener('message', function(e) {
  const { nodes, links, selectedId, nodeId, maxPaths } = e.data;

  // Your findPaths function goes here
  
  const paths = findPaths({ nodes, links }, selectedId, nodeId, maxPaths);

  // Post the found paths back to the main thread
  self.postMessage({ paths });
}, false);