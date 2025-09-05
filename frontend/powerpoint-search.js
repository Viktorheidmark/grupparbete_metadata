export function pptSearchPageContent() {
  return `
      <h2>Sök powerpoint</h2>
      <label>
        Sök på: <select name="ppt-meta-field">
          <option value="Company">Company</option>
          <option value="Author">Författare</option>
        </select>
      </label>
      <label>
        <input name="ppt-search" type="text" placeholder="Sök bland ppt-filer">
      </label>
      <section class="ppt-search-result"></section>
    `;
}

document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="ppt-search"]');
  if (!inputField) { return; }
  pptSearch();
});

document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="ppt-meta-field"]');
  if (!select) { return; }
  pptSearch();
});

document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-ppt-metadata');
  if (!button) { return; }
  let id = button.getAttribute('data-id');
  let rawResponse = await fetch('/api/powerpoint-all-meta/' + encodeURIComponent(id));
  let result = await rawResponse.json();
  let pre = document.createElement('pre');
  pre.textContent = JSON.stringify(result, null, 2);
  button.after(pre);
});

async function pptSearch() {
  let inputField = document.querySelector('input[name="ppt-search"]');
  if (!inputField || inputField.value === '') {
    document.querySelector('.ppt-search-result').innerHTML = '';
    return;
  }
  let field = document.querySelector('select[name="ppt-meta-field"]').value;
  let q = encodeURIComponent(inputField.value.trim());
  let rawResponse = await fetch(`/api/powerpoint-search/${field}/${q}`);
  let result = await rawResponse.json();
  let resultAsHtml = '';
  for (let { id, FileName, Company, Author } of result) {
    resultAsHtml += `
      <article>
        <h3>${Company || 'unknown Company'}</h3>
        <p><b>Author:</b> ${Author || 'unknown author'}</p>
        <a href="/data/ppt/${FileName}" download>Ladda ned PowerPoint</a>
        <p><button class="btn-show-all-ppt-metadata" data-id="${id}">Visa all metadata</button></p>
      </article>
    `;
  }
  document.querySelector('.ppt-search-result').innerHTML = resultAsHtml;
}