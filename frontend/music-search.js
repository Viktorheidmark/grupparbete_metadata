// music-search.js
export function musicSearchPageContent() {
  return `
      <h2>Search music</h2>
      <label>
        Categories: <select name="music-meta-field">
          <option value="artist">Artist</option>
          <option value="title">Title</option>
          <option value="album">Album</option>
          <option value="genre">Genre</option>
        </select>
      </label>
      <label>
        <input name="music-search" type="text" placeholder="Search among music files">
      </label>
      <section class="music-search-result"></section>
    `;
}

// Hämta och visa bilder när sidan laddas
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="music-search"]');
  if (!inputField) { return; }
  musicSearch();
});

// Lyssna på ändringar i select-fältet
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="music-meta-field"]');
  if (!select) { return; }
  musicSearch();
});

// Visa all metadata när knappen klickas
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-music-metadata');
  if (!button) { return; }
  let id = button.getAttribute('data-id');
  let rawResponse = await fetch('/api/music-all-meta/' + encodeURIComponent(id));
  let result = await rawResponse.json();
  let pre = document.createElement('pre');
  pre.textContent = JSON.stringify(result, null, 2);
  button.after(pre);
});

// Music search
async function musicSearch() {
  let inputField = document.querySelector('input[name="music-search"]');
  if (!inputField || inputField.value === '') {
    document.querySelector('.music-search-result').innerHTML = '';
    return;
  }
  let field = document.querySelector('select[name="music-meta-field"]').value;
  let q = encodeURIComponent(inputField.value.trim());
  let rawResponse = await fetch(`/api/music-search/${field}/${q}`);
  let result = await rawResponse.json();
  let resultAsHtml = '';
  for (let { id, fileName, title, artist, album, genre } of result) {
    resultAsHtml += `
      <article>
        <h3><b>Artist: </b>${artist || 'unknown artist'}</h3>
        <h2>${title || 'unknown title'}</h2>
        <p><b>From album:</b> ${album || 'unknown album'}</p>
        <p><b>Genre:</b> ${genre || 'unknown genre'}</p>
        <audio controls src="/data/music/${fileName}"></audio>
        <p><a href="/data/music/${fileName}" download>Download file</a></p>
        <p><button class="btn-show-all-music-metadata" data-id="${id}">Show all metadata</button></p>
      </article>
    `;
  }
  document.querySelector('.music-search-result').innerHTML = resultAsHtml;
}