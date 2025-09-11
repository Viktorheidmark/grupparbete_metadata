// Ladda som ES-modul i index.html
import { musicSearchPageContent } from './music-search.js';
import { pdfSearchPageContent } from './pdf-search.js';
import { picturesSearchPageContent } from './pictures-search.js';
import { pptSearchPageContent } from './powerpoint-search.js';
import { startPageContent } from './start-page.js';

let map; // Google Maps-instans

// Gör initMap global så att Google Maps API kan anropa den
window.initMap = function () {
  map = new google.maps.Map(document.getElementById('map')
)};


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
  const saveButton = document.querySelector('.save-search');

  if (page === 'start') {
    html = startPageContent();
    saveButton.style.display = 'none'; // Dölj knappen på startsidan
  } else if (page === 'music') {
    html = `
      <h1>Search Music</h1>
      ${musicSearchPageContent()}
    `;
    saveButton.style.display = 'block'; // Visa knappen för musik
  } else if (page === 'pdf') {
    html = `
      <h1>Search PDF</h1>
      ${pdfSearchPageContent()}
    `;
    saveButton.style.display = 'block'; // Visa knappen för PDF
  } else if (page === 'pictures') {
    html = `
      <h1>Search Pictures</h1>
      ${picturesSearchPageContent()}
    `;
    saveButton.style.display = 'block'; // Visa knappen för bilder
    loadImages(); // Ladda bilder när "Search Pictures" visas
  } else if (page === 'ppt') {
    html = `
      <h1>Search PowerPoint</h1>
      ${pptSearchPageContent()}
    `;
    saveButton.style.display = 'block'; // Visa knappen för PowerPoint
  } else {
    html = startPageContent(); // fallback
    saveButton.style.display = 'none'; // Dölj knappen
  }

  document.querySelector('main article').innerHTML = html;
}

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

// Hantera klick på "Save Search"-knappen
document.body.addEventListener('click', (event) => {
  let saveButton = event.target.closest('.save-search');
  if (!saveButton) return;

  // Hämta sökfras och metaField från inputfält
  const searchPhrase = document.querySelector('input[name="music-search"]')?.value || '';
  const metaField = document.querySelector('select[name="music-meta-field"]')?.value || '';

  if (!searchPhrase) {
    alert('No search phrase to save.');
    return;
  }

  // Uppdatera URL med sökparametrar
  const url = `?search=${encodeURIComponent(searchPhrase)}&metaField=${encodeURIComponent(metaField)}`;
  history.pushState(null, null, url);

  alert(`Search saved: ${searchPhrase}`);
});

// Hämta sökparametrar från URL och utför sökning
function searchForUrlQuery() {
  const params = new URLSearchParams(location.search);
  const search = params.get('search') || '';
  const metaField = params.get('metaField') || '';

  // Sätt värden i inputfält
  const inputField = document.querySelector('input[name="music-search"]');
  const selectField = document.querySelector('select[name="music-meta-field"]');
  if (inputField) inputField.value = search;
  if (selectField) selectField.value = metaField;

  // Utför sökning om sökfras finns
  if (search) {
    musicSearch();
  }
}

// Utför sökning vid sidladdning
searchForUrlQuery();

// Lyssna på framåt/bakåt-knappar i webbläsaren
window.addEventListener('popstate', () => {
  searchForUrlQuery();
});