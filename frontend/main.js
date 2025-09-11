// Ladda som ES-modul i index.html
import { musicSearchPageContent } from './music-search.js';
import { pdfSearchPageContent } from './pdf-search.js';
import { picturesSearchPageContent } from './pictures-search.js';
import { pptSearchPageContent } from './powerpoint-search.js';
import { startPageContent } from './start-page.js';

// Gör initMap global
window.initMap = function () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 59.3293, lng: 18.0686 }, // Stockholm
    zoom: 10
  });
};
// Nu kan vi använda Google Maps API
let map; // Google Maps-instans

// Gör initMap global så att Google Maps API kan anropa den
window.initMap = function () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 59.3293, lng: 18.0686 }, // Stockholm
    zoom: 10
  });
};


// Now "mount"/include Google Map script
// (because now we are sure that initMap exists for Google's
//  JavaScript to call)
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
  const saveButton = document.querySelector('.save-search');
  const mapDiv = document.getElementById('map');

  // Dölj kartan som standard
  mapDiv.style.display = 'none';

  if (page === 'start') {
    html = startPageContent();
    saveButton.style.display = 'none';
  } else if (page === 'music') {
    html = `<h1></h1>${musicSearchPageContent()}`;
    saveButton.style.display = 'block';
  } else if (page === 'pdf') {
    html = `<h1></h1>${pdfSearchPageContent()}`;
    saveButton.style.display = 'block';
  } else if (page === 'pictures') {
    html = `<h1></h1>${picturesSearchPageContent()}`;
    saveButton.style.display = 'block';
    loadImages();
    mapDiv.style.display = 'block'; // Visa kartan bara här
  } else if (page === 'ppt') {
    html = `<h1></h1>${pptSearchPageContent()}`;
    saveButton.style.display = 'block';
  } else {
    html = startPageContent();
    saveButton.style.display = 'none';
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
    console.error('Kunde inte ladda bilder:', err);
  }
}

// Hantera klick på "Save Search"-knappen
document.body.addEventListener('click', (event) => {
  let saveButton = event.target.closest('.save-search');
  if (!saveButton) return;

  const searchPhrase = document.querySelector('input[name="music-search"]')?.value || '';
  const metaField = document.querySelector('select[name="music-meta-field"]')?.value || '';

  if (!searchPhrase) {
    alert('No search phrase to save.');
    return;
  }

  const url = `?search=${encodeURIComponent(searchPhrase)}&metaField=${encodeURIComponent(metaField)}`;
  history.pushState(null, null, url);

  alert(`Search saved: ${searchPhrase}`);
});

// Hämta sökparametrar från URL och utför sökning
function searchForUrlQuery() {
  const params = new URLSearchParams(location.search);
  const search = params.get('search') || '';
  const metaField = params.get('metaField') || '';

  const inputField = document.querySelector('input[name="music-search"]');
  const selectField = document.querySelector('select[name="music-meta-field"]');
  if (inputField) inputField.value = search;
  if (selectField) selectField.value = metaField;

  if (search) {
    musicSearch();
  }
}

// Utför sökning vid sidladdning
searchForUrlQuery();

// Lyssna på framåt/bakåt-knappar
window.addEventListener('popstate', () => {
  searchForUrlQuery();
});

// Visa startsidan vid sidladdning
showContent('start');
