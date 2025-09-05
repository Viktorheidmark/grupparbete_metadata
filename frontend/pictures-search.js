export function picturesSearchPageContent() {
  return `
      <h2>Search pictures</h2>
      <label>
        Categories: <select name="picture-meta-field">
          <option value="Make">Make</option>
          <option value="Model">Model</option>
        </select>
      </label>
      <label>
        <input name="picture-search" type="text" placeholder="Search among pictures">
      </label>
      <section class="picture-search-result"></section>
    `;
}

// Lyssna på keyup i sökfältet
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="picture-search"]');
  if (!inputField) { return; }
  pictureSearch();
});

// Lyssna på ändringar i select
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="picture-meta-field"]');
  if (!select) { return; }
  pictureSearch();
});

// Visa all metadata på knapp-klick
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-picture-metadata');
  if (!button) { return; }
  let id = button.getAttribute('data-id');
  let rawResponse = await fetch('/api/pictures-all-meta/' + encodeURIComponent(id));
  let result = await rawResponse.json();
  let pre = document.createElement('pre');
  pre.textContent = JSON.stringify(result, null, 2);
  button.after(pre);
});

// Sök-funktion
async function pictureSearch() {
  let inputField = document.querySelector('input[name="picture-search"]');
  if (!inputField || inputField.value === '') {
    document.querySelector('.picture-search-result').innerHTML = '';
    return;
  }

  let field = document.querySelector('select[name="picture-meta-field"]').value;
  let q = encodeURIComponent(inputField.value.trim());
  let rawResponse = await fetch(`/api/pictures-search/${field}/${q}`);
  let result = await rawResponse.json();

  let resultAsHtml = '';
  for (let { id, file, Make, Model } of result) {
    resultAsHtml += `
      <article>
        <h2><b>Make: </b>${Make || 'unknown make'}<h2>
        <h4><b>Model: </b>${Model || 'unknown model'}</h2>
        <img src="/data/pictures/${file}" alt="${file}" style="max-width:200px;">
        <p><a href="/data/pictures/${file}" download>download picture</a></p>
        <p><button class="btn-show-all-picture-metadata" data-id="${id}">Show all metadata</button></p>
      </article>
    `;
  }

  document.querySelector('.picture-search-result').innerHTML = resultAsHtml;
}