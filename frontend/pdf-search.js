
// pdf-search.js
export function pdfSearchPageContent() {
  return `
      <h2>Search pdf</h2>
      <label>
        Categories: <select name="pdf-meta-field">
          <option value="title">Pdftitel</option>
          <option value="author">Author</option>
        </select>
      </label>
      <label>
        <input name="pdf-search" type="text" placeholder="Search among pdffiles">
      </label>
      <section class="pdf-search-result"></section>
    `;
}

// Lyssna på keyup i sökfältet
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="pdf-search"]');
  if (!inputField) { return; }
  pdfSearch();
});

// Lyssna på ändringar i select
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="pdf-meta-field"]');
  if (!select) { return; }
  pdfSearch();
});

// Visa all metadata på knapp-klick
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-pdf-metadata');
  if (!button) { return; }
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
  if (!inputField || inputField.value === '') {
    document.querySelector('.pdf-search-result').innerHTML = '';
    return;
  }
  // Hämta valt fält och sökterm
  let field = document.querySelector('select[name="pdf-meta-field"]').value;
  let q = encodeURIComponent(inputField.value.trim());
  let rawResponse = await fetch(`/api/pdf-search/${field}/${q}`);
  let result = await rawResponse.json();
  let resultAsHtml = '';
  for (let { id, fileName, title, author } of result) {
    resultAsHtml += `
      <article>
        <h2><b>Title: </b>${title || 'unknown title'}</h2>
        <p><b>Author:</b> ${author || 'unknown author'}</p>
        <a href="/data/pdf/${fileName}" download>download PDF</a>
        <p><button class="btn-show-all-pdf-metadata" data-id="${id}">Show all metadata</button></p>
      </article>
    `;
  }
  document.querySelector('.pdf-search-result').innerHTML = resultAsHtml;
}