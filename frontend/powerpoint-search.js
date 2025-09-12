// powerpoint-search.js

export function pptSearchPageContent() {
  return `
    <h2>Search powerpoint</h2>

    <div class="ppt-form">
      <label>
        Categories:
        <select name="ppt-meta-field">
          <option value="Company">Company</option>
          <option value="Author">Author</option>
        </select>
      </label>

      <label>
        <input name="ppt-search" type="text" placeholder="Search among ppt-files (optional)">
      </label>

      <div class="ppt-size-row">
        <label>
          Min size (KB)
          <input name="ppt-min-size" type="number" min="0" placeholder="e.g. 50">
        </label>
        <label>
          Max size (KB)
          <input name="ppt-max-size" type="number" min="0" placeholder="e.g. 200">
        </label>
      </div>
    </div>

    <section class="ppt-search-result"></section>
  `;
}

/* --- Triggers --- */

// Sök när man skriver i textfältet
document.body.addEventListener('keyup', (event) => {
  if (!event.target.closest('input[name="ppt-search"]')) return;
  pptSearch();
});

// Sök när man byter kategori
document.body.addEventListener('change', (event) => {
  if (!event.target.closest('select[name="ppt-meta-field"]')) return;
  pptSearch();
});

// Sök när min/max ändras
['keyup', 'change'].forEach((ev) => {
  document.body.addEventListener(ev, (event) => {
    if (
      !event.target.closest('input[name="ppt-min-size"]') &&
      !event.target.closest('input[name="ppt-max-size"]')
    ) return;
    pptSearch();
  });
});

// Visa all metadata för en rad
document.body.addEventListener('click', async (event) => {
  const button = event.target.closest('.btn-show-all-ppt-metadata');
  if (!button) return;

  const id = button.getAttribute('data-id');
  const rawResponse = await fetch('/api/powerpoint-all-meta/' + encodeURIComponent(id));
  const result = await rawResponse.json();

  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(result, null, 2);
  button.after(pre);
});

/* --- Sökfunktionen --- */

async function pptSearch() {
  const field = document.querySelector('select[name="ppt-meta-field"]')?.value || 'Company';
  const qInput = document.querySelector('input[name="ppt-search"]');
  const minInput = document.querySelector('input[name="ppt-min-size"]');
  const maxInput = document.querySelector('input[name="ppt-max-size"]');

  // Tillåt tomt sökord (då blir LIKE '%%' i backenden).
  const searchValue = encodeURIComponent((qInput?.value || '').trim());

  // Defaults om användaren lämnar tomt
  const minSize = Number(minInput?.value || 0);
  const maxSize = Number(maxInput?.value || 999999); // "praktiskt tak"

  // Bygg URL enligt din backend: /api/powerpoint-search/:field/:minSize/:maxSize/:searchValue
  const url = `/api/powerpoint-search/${encodeURIComponent(field)}/${minSize}/${maxSize}/${searchValue}`;

  let result = [];
  try {
    const rawResponse = await fetch(url);
    result = await rawResponse.json();
  } catch (e) {
    console.error('Search failed', e);
  }

  // Rendera
  const container = document.querySelector('.ppt-search-result');
  if (!Array.isArray(result) || result.length === 0) {
    container.innerHTML = `<p>No results.</p>`;
    return;
  }

  let html = '';
  for (const { id, FileName, Company, Author, FileSize } of result) {
    html += `
      <article class="ppt-card">
        <h3>${Company || 'unknown Company'}</h3>
        <p><b>Author:</b> ${Author || 'unknown author'}</p>
        <p><b>Size:</b> ${FileSize != null ? `${FileSize} KB` : '-'}</p>
        <p><a href="/data/ppt/${encodeURIComponent(FileName)}" download>download PowerPoint</a></p>
        <p><button class="btn-show-all-ppt-metadata" data-id="${id}">Show all metadata</button></p>
      </article>
    `;
  }
  container.innerHTML = html;
}