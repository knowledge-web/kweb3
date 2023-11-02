class PersonImages extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentImageIndex = 0;
    this.images = [];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .person-image-container {
          text-align: center;
          margin-bottom: 20px;
        }
        .navigation-button {
          margin: 5px;
        }
        img {
          max-width: 100%;
          height: auto;
          border: 1px solid #ccc;
        }
      </style>
      <div class="person-image-container">
        <img id="personImage" src="" alt="Person Image">
      </div>
      <button id="prevButton" class="navigation-button">Previous</button>
      <button id="nextButton" class="navigation-button">Next</button>
    `;

    this.shadowRoot.getElementById('prevButton').addEventListener('click', () => this.navigateImages(-1));
    this.shadowRoot.getElementById('nextButton').addEventListener('click', () => this.navigateImages(1));

    window.addEventListener('nodeSelected', (event) => this.onNodeSelected(event));
    window.addEventListener('timetravel', (event) => this.onTimeTravel(event));
  }

  onNodeSelected(event) {
    const { wikidataId } = event.detail.node;
    this.fetchImages(wikidataId);
  }

  onTimeTravel(event) {
    const year = this.parseYear(event.detail.date);
    const relevantImage = this.findRelevantImage(year);
    this.displayImage(relevantImage);
  }

  parseYear(dateString) {
    const year = parseInt(dateString.replace(/[\+−-]/, ''), 10);
    return dateString.startsWith('-') ? -year : year;
  }

  async fetchImages(searchTerm) {
    try {
      const response = await fetch(`/api/images?searchTerm=${encodeURIComponent(searchTerm)}`);
      const images = await response.json();
      this.images = images.filter(image => image.date);
      this.currentImageIndex = 0;
      this.updateImage();
    } catch (error) {
      console.error('Error fetching images:', error);
      // Handle errors, e.g., show a message to the user
    }
  }

  findRelevantImage(year) {
    const relevantImage = this.images.slice().reverse().find(image => {
      const imageYear = new Date(image.date).getFullYear();
      return imageYear <= year;
    });
    return relevantImage || this.images[0];
  }

  displayImage(image) {
    if (image) {
      this.images = [image];
      this.currentImageIndex = 0;
      this.updateImage();
    }
  }

  navigateImages(direction) {
    const newIndex = this.currentImageIndex + direction;
    if (newIndex >= 0 && newIndex < this.images.length) {
      this.currentImageIndex = newIndex;
      this.updateImage();
  
      // Update the slider value to reflect the new image's date
      const yearSlider = document.querySelector('#yearSlider');
      const imageDate = new Date(this.images[this.currentImageIndex].date);
      yearSlider.value = imageDate.getFullYear();
      document.querySelector('#selectedYear').textContent = yearSlider.value;
    }
  }

  updateImage() {
    const imgElement = this.shadowRoot.getElementById('personImage');
    const currentImage = this.images[this.currentImageIndex];
    if (currentImage) {
      imgElement.src = currentImage.thumbUrl;
      imgElement.alt = currentImage.title;
  
      // Dispatch a custom event to notify the change of image
      const imageChangeEvent = new CustomEvent('imageChange', {
        detail: { date: currentImage.date }
      });
      window.dispatchEvent(imageChangeEvent);
    } else {
      imgElement.src = '';
      imgElement.alt = 'No image available';
    }
  }
}

window.customElements.define('person-images', PersonImages);
