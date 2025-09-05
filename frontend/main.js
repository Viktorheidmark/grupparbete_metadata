// Ladda som ES-modul i index.html
import { musicSearchPageContent }    from './music-search.js';
import { pdfSearchPageContent }      from './pdf-search.js';
import { picturesSearchPageContent } from './pictures-search.js';
import { pptSearchPageContent }      from './powerpoint-search.js';
import { startPageContent }          from './start-page.js';

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
  }
  else if (page === 'music') {
    html = `
      <h1>Sök musik</h1>
      ${musicSearchPageContent()}
    `;
  }
  else if (page === 'pdf') {
    html = `
      <h1>Sök pdf</h1>
      ${pdfSearchPageContent()}
    `;
  }
  else if (page === 'pictures') {
    html = `
      <h1>Sök bilder</h1>
      ${picturesSearchPageContent()}
    `;
  }
  else if (page === 'ppt') {
    html = `
      <h1>Sök powerpoint</h1>
      ${pptSearchPageContent()}
    `;
  }
  else {
    html = startPageContent(); // fallback
  }

  document.querySelector('main').innerHTML = html;
}

// Visa startsidan vid laddning
showContent('start');