const fs = require('fs')
const path = require('path')

// Read the JSON file
fs.readFile('./data/all.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err)
    return
  }

  const json = JSON.parse(data)

  // Modify each node
  json.nodes = json.nodes.map((node) => {
    const idIconPath = path.join('./data-media', node.id, '.data', 'Icon.png')
    const typeIdIconPath = node.typeId ? path.join('./data-media', node.typeId, '.data', 'Icon.png') : false

    // Check if the icon file exists for id
    if (fs.existsSync(idIconPath)) {
      node.icon = node.id
    }

    // Check if the icon file exists for typeId
    if (typeIdIconPath && fs.existsSync(typeIdIconPath)) {
      node.typeIcon = node.typeId
      if (!node.icon) node.icon = node.typeId
    }

    return node
  })

  // Write the modified JSON back to the file
  fs.writeFile('./data/all.json', JSON.stringify(json, null, 2), (err) => {
    if (err) {
      console.error('Error writing the file:', err)
    } else {
      console.log('Successfully written the modified JSON to all_modified.json')
    }
  })
})
