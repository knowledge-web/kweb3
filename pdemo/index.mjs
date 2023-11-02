import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const API_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';

async function fetchImages(wikidataId) {
  const searchParams = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    generator: 'search',
    gsrnamespace: 6, // Search only within the file namespace
    gsrlimit: 50, // Limit the number of results
    gsrsearch: `haswbstatement:P180=${wikidataId}`, // Search for images with the specified Wikidata item
    iiprop: 'url|extmetadata',
  });

  const searchUrl = `${API_ENDPOINT}?${searchParams.toString()}`;
  const response = await fetch(searchUrl);
  const data = await response.json();

  if (!data.query) {
    throw new Error('No images found');
  }

  const images = Object.values(data.query.pages)
    .filter(page => page.imageinfo) // Filter out pages without imageinfo
    .map(page => {
      const imageinfo = page.imageinfo[0];
      const date = imageinfo.extmetadata.DateTimeOriginal?.value || imageinfo.extmetadata.DateTime?.value;
      return {
        title: page.title,
        thumbUrl: imageinfo.thumburl || imageinfo.url,
        date: date,
      };
    });

  return images;
}

app.get('/api/images', async (req, res) => {
  const { searchTerm } = req.query;
  try {
    const images = await fetchImages(searchTerm);
    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).send(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
