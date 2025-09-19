// pdf-search.js
export function pdfSearchPageContent() {
  return `
      <h2>Search PDF</h2>
      <label>
        Categories: 
        <select name="pdf-meta-field">
          <option value="title">Pdftitel</option>
          <option value="author">Author</option>
          <option value="text">Text</option>
          <option value="all">All fields</option>
        </select>
      </label>
      <label>
        <input name="pdf-search" type="text" placeholder="Search among PDF files">
      </label>
      <section class="pdf-search-result"></section>
    `;
}

// Lyssna på keyup i sökfältet
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="pdf-search"]');
  if (!inputField) return;
  pdfSearch();
});

// Lyssna på ändringar i select
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="pdf-meta-field"]');
  if (!select) return;
  pdfSearch();
});

// Visa all metadata på knapp-klick
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-pdf-metadata');
  if (!button) return;

  let id = button.getAttribute('data-id');
  let rawResponse = await fetch('/api/pdf-all-meta/' + encodeURIComponent(id));
  let result = await rawResponse.json();

  let pre = document.createElement('pre');
  pre.textContent = JSON.stringify(result, null, 2);
  button.after(pre);
});

// Sök-funktion
async function pdfSearch() {
  let inputField = document.querySelector('input[name="pdf-search"]');
  if (!inputField || inputField.value.trim() === '') {
    document.querySelector('.pdf-search-result').innerHTML = '';
    return;
  }

  let field = document.querySelector('select[name="pdf-meta-field"]').value.toLowerCase();
  let query = encodeURIComponent(inputField.value.trim());

  try {
    let rawResponse = await fetch(`/api/pdf-search/${field}/${query}`);
    let result = await rawResponse.json();

    // Hantera fel från backend
    if (!Array.isArray(result)) {
      document.querySelector('.pdf-search-result').innerHTML =
        `<p style="color:red;">${result.error || "Unknown error"}</p>`;
      return;
    }

    let html = '';
    for (let { id, fileName, title, author, text } of result) {
      html += `
        <article>
          <h2><b>Title:</b> ${title || 'unknown title'}</h2>
          <p><b>Author:</b> ${author || 'unknown author'}</p>
          <a href="/data/pdf/${fileName}" download>Download PDF</a>
          <p><b>Text:</b> ${text ? text.substring(0, 200) + '...' : 'No text available'}</p>
          <p><button class="btn-show-all-pdf-metadata" data-id="${id}">Show all metadata</button></p>
        </article>
      `;
    }

    document.querySelector('.pdf-search-result').innerHTML = html;

  } catch (err) {
    console.error("Fetch error:", err);
    document.querySelector('.pdf-search-result').innerHTML =
      `<p style="color:red;">Failed to fetch data</p>`;
  }
}
