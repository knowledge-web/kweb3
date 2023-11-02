// Make sure to run `npm install node-fetch` before running this script.
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

const API_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';

async function searchImagesAndMetadata(searchTerm) {
  const searchParams = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'search',
    srsearch: searchTerm,
    srlimit: 50,
    srnamespace: 6,
  });

  const searchUrl = `${API_ENDPOINT}?${searchParams.toString()}`;

  try {
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    let imagesWithData = [];

    for (const page of searchData.query.search) {
      const imageInfoParams = new URLSearchParams({
        action: 'query',
        format: 'json',
        prop: 'imageinfo',
        titles: page.title,
        iiprop: 'url|extmetadata',
      });

      const imageInfoUrl = `${API_ENDPOINT}?${imageInfoParams.toString()}`;
      const imageInfoResponse = await fetch(imageInfoUrl);
      const imageInfoData = await imageInfoResponse.json();

      const pageId = Object.keys(imageInfoData.query.pages)[0];
      const imageInfo = imageInfoData.query.pages[pageId].imageinfo[0];

      imagesWithData.push({
        title: page.title,
        url: imageInfo.url,
        date: imageInfo.extmetadata.DateTimeOriginal?.value || imageInfo.extmetadata.DateTime?.value || '',
        metadata: imageInfo.extmetadata,
      });
    }

    imagesWithData.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));

    let htmlContent = `
      <html>
      <head>
        <title>Images of Charles Darwin</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .image-container { margin-bottom: 20px; }
          .image-title { font-weight: bold; }
          .metadata { font-size: 0.9em; }
          .no-date { margin-top: 50px; }
        </style>
      </head>
      <body>
        <h1>Images of Charles Darwin</h1>
        ${imagesWithData.map(image => `
          <div class="image-container">
            <div class="image-title">${image.title}</div>
            <img src="${image.url}" alt="${image.title}" style="max-width:100%;height:auto;">
            <div class="metadata">Date: ${image.date || 'Unknown'}</div>
            <div class="metadata">Categories: ${image.metadata.Categories?.value || 'None'}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const express = require('express')
    const app = express()
    app.get('/', (req, res) => {
      res.send(htmlContent)
    })
    app.listen(3000, () => console.log('Web server started'))
    
    console.log('Web server started');
  } catch (error) {
    console.error('Error fetching data: ', error);
  }
}

searchImagesAndMetadata('Charles Darwin portrait');
