// Make sure to run `npm install node-fetch` before running this script.
import fetch from 'node-fetch';
import express from 'express';

function parseDate (dateString) {
  // Attempt to parse date assuming the dateString is in ISO format
  const date = new Date(dateString)
  if (!isNaN(date)) return date
  // Implement additional parsing logic if necessary, based on the observed date formats
  return null // Return null if the date cannot be parsed
}

const API_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';

async function searchImagesAndMetadata ({ q, limit = 25, deathDate }) {
  const searchParams = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: q,
    gsrlimit: limit,
    gsrnamespace: 6,
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata', // Now you can add this here
  });

  const searchUrl = `${API_ENDPOINT}?${searchParams.toString()}`;

  try {
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    let imagesWithData = [];

    for (const page of Object.values(searchData.query.pages)) {
      const imageInfo = page.imageinfo[0];

      // if (imageInfo.size > 500 * 1024) continue // exclude images larger than 500KB

      const date = parseDate(imageInfo.extmetadata.DateTimeOriginal?.value || imageInfo.extmetadata.DateTime?.value);
      // Exclude images without date or dated after Darwin's death (1882)
      if (!date) continue // exclude images without dates
      if (deathDate) {
        deathDate = parseDate(deathDate)
        if (date > deathDate) continue // exclude images after death date
      }

      const image = {
        title: page.title,
        thumbUrl: imageInfo.thumburl, // This is the URL of the thumbnail
        url: imageInfo.url,
        date: imageInfo.extmetadata.DateTimeOriginal?.value || imageInfo.extmetadata.DateTime?.value || '',
        parsedDate: date,
        metadata: imageInfo.extmetadata,
        size: imageInfo.size
      };
  
      imagesWithData.push(image)
    }

    imagesWithData.sort((a, b) => (a.parsedDate > b.parsedDate) ? 1 : ((b.parsedDate > a.parsedDate) ? -1 : 0));
    return imagesWithData
  } catch (error) {
    console.error('Error fetching data: ', error);
  }
}

function toHTML (images) {
  let htmlContent = `
  <html>
  <head>
    <title>Images of Charles Darwin</title>
    <style>
      body { font-family: Arial, sans-serif; }
      .image-container { margin-bottom: 20px; }
      .image-container img { max-height: 300px;}
      .image-title { font-weight: bold; }
      .metadata { font-size: 0.9em; }
      .no-date { margin-top: 50px; }
    </style>
  </head>
  <body>
    <h1>Images of Charles Darwin</h1>
    ${images.map(image => `
      <div class="image-container">
        <div class="image-title">${image.title}</div>
        <img src="${image.url}" alt="${image.title}" style="max-width:100%;height:auto;">
        <div class="metadata">Date: ${image.date || 'Unknown'}, parsed: ${image.parsedDate.getFullYear()}</div>
        <div class="metadata">Categories: ${image.metadata.Categories?.value || 'None'}</div>
      </div>
    `).join('')}
  </body>
  </html>
`;
  return htmlContent
}

const app = express()
app.get('/', async (req, res) => {
  let { q, html } = req.query; // q example: Charles Darwin portrait
  q = q || 'Charles Darwin portrait' // debug fallback
  const images = await searchImagesAndMetadata({ q, deathDate: '1943', limit: 100 })
  if (!html) return res.send(images)
  res.send(toHTML(images))
})

app.listen(3000, () => console.log('Web server started'))