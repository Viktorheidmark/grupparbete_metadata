// main.js

import { musicSearchPageContent } from './music-search.js';
import { pdfSearchPageContent } from './pdf-search.js';
import { picturesSearchPageContent } from './pictures-search.js';
import { pptSearchPageContent } from './powerpoint-search.js';
import { startPageContent } from './start-page.js';

// Gör initMap global
window.initMap = function () {
  window.map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 59.3293, lng: 18.0686 }, // Stockholm
    zoom: 10
  });
  console.log(map)
};

// Ladda Google Maps API
let script = document.createElement('script');
script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap&v=weekly';
document.body.append(script);

// Meny – byt sida
document.body.addEventListener('click', (e) => {
  const navLink = e.target.closest('header nav a');
  if (!navLink) return;

  e.preventDefault();
  const page = navLink.getAttribute('data-page') || 'start';
  showContent(page);
});

function showContent(page = 'start') {
  let html = '';
  const mapDiv = document.getElementById('map');

  // Dölj kartan som standard
  mapDiv.style.display = 'none';

  if (page === 'start') {
    html = startPageContent();
  } else if (page === 'music') {
    html = `<h1></h1>${musicSearchPageContent()}`;
  } else if (page === 'pdf') {
    html = `<h1></h1>${pdfSearchPageContent()}`;
  } else if (page === 'pictures') {
    html = `<h1></h1>${picturesSearchPageContent()}`;
    loadImages();
    mapDiv.style.display = 'block'; // Visa kartan bara här
  } else if (page === 'ppt') {
    html = `<h1></h1>${pptSearchPageContent()}`;
    setTimeout(() => {
      const evt = new Event('change');
      document.querySelector('select[name="ppt-meta-field"]')?.dispatchEvent(evt);
    }, 0);
  } else {
    html = startPageContent();
  }

  document.querySelector('main article').innerHTML = html;
}

// Funktion för att ladda bilder och visa länkar till Google Maps
async function loadImages() {
  try {
    const response = await fetch('/api/images');
    const images = await response.json();

    let html = '';
    for (let image of images) {
      html += `
        <section>
          <a href="https://maps.google.com/?q=${image.metadata.latitude},${image.metadata.longitude}" target="_blank">
            <img src="/images/${image.fileName}" alt="Image">
          </a>
        </section>
      `;
    }

    document.querySelector('article').innerHTML += html;
  } catch (err) {
    // console.error('Kunde inte ladda bilder:', err);
  }
}

// Visa startsidan vid sidladdning
showContent('start');