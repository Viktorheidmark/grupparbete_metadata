// Ladda som ES-modul i index.html
import { musicSearchPageContent } from './music-search.js';
import { pdfSearchPageContent } from './pdf-search.js';
import { picturesSearchPageContent } from './pictures-search.js';
import { pptSearchPageContent } from './powerpoint-search.js';
import { startPageContent } from './start-page.js';

let map; // Google Maps-instans

// Gör initMap global så att Google Maps API kan anropa den
window.initMap = function () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 59.3293, lng: 18.0686 }, // Exempel: Stockholm
    zoom: 10,
  });
};

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

  if (page === 'start') {
    html = startPageContent();
  } else if (page === 'music') {
    html = `
      <h1>Search Music</h1>
      ${musicSearchPageContent()}
    `;
  } else if (page === 'pdf') {
    html = `
      <h1>Search PDF</h1>
      ${pdfSearchPageContent()}
    `;
  } else if (page === 'pictures') {
    html = `
      <h1>Search Pictures</h1>
      ${picturesSearchPageContent()}
    `;
    loadImages(); // Ladda bilder när "Search Pictures" visas
  } else if (page === 'ppt') {
    html = `
      <h1>Search PowerPoint</h1>
      ${pptSearchPageContent()}
    `;
  } else {
    html = startPageContent(); // fallback
  }

  document.querySelector('main').innerHTML = html;
}

// Visa startsidan vid laddning
showContent('start');

// Funktion för att ladda bilder och visa länkar till Google Maps
async function loadImages() {
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

  // Lägg bilderna i <article> istället för att lägga till dem i <main>
  document.querySelector('article').innerHTML = html;
}