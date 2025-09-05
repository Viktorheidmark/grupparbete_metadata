// Ladda som ES-modul i index.html: <script type="module" src="/frontend/main.js"></script>

import { musicSearchPageContent }    from './music-search.js';
import { pdfSearchPageContent }      from './pdf-search.js';
import { picturesSearchPageContent } from './pictures-search.js';
import { pptSearchPageContent }      from './powerpoint-search.js';

// Meny: låtsas-Spa (rendera om vyn)
document.body.addEventListener('click', (e) => {
  let navLink = e.target.closest('header nav a');
  if (!navLink) return;
  e.preventDefault();
  showContent();
});

function showContent() {
  let content = `
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
  document.querySelector('main').innerHTML = content;
}

showContent();