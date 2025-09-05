// Ladda som ES-modul i index.html: <script type="module" src="main.js"></script>

import { musicSearchPageContent }    from './music-search.js';
import { pdfSearchPageContent }      from './pdf-search.js';
import { picturesSearchPageContent } from './pictures-search.js';
import { pptSearchPageContent }      from './powerpoint-search.js';
import { startPageContent }          from './start-page.js';

// Meny: växla vy baserat på data-page
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
  } else if (page === 'search') {
    html = `
      <h1>Sök metadata</h1>
      <section id="music-section">
        ${musicSearchPageContent()}
      </section>
      <section id="pdf-section">
        ${pdfSearchPageContent()}
      </section>
      <section id="pictures-section">
        ${picturesSearchPageContent()}
      </section>
      <section id="ppt-section">
        ${pptSearchPageContent()}
      </section>
    `;
  } else {
    // Fallback om något okänt råkar skickas in
    html = startPageContent();
  }

  document.querySelector('main').innerHTML = html;
}

// Visa startsidan när appen laddar
showContent('start');