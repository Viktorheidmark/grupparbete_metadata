// A function to create the music search page content
export function musicSearchPageContent() {
  return `
      <h2>Sök musik</h2>
      <label>
        Sök på: <select name="music-meta-field">
          <option value="artist">Artist</option>
          <option value="title">Låttitel</option>
          <option value="album">Album</option>
          <option value="genre">Genre</option>
        </select>
      </label>
      <label>
        <input name="music-search" type="text" placeholder="Sök bland musikfiler">
      </label>
      <section class="music-search-result"></section>
    `;
}

// Listen to key up events
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="music-search"]');
  if (!inputField) { return; }
  musicSearch();
});

// Listen to select changes
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="music-meta-field"]');
  if (!select) { return; }
  musicSearch();
});

// Show all metadata on click
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
        <h3><b>Artist: </b>${artist || 'Okänd artist'}</h3>
        <h2>${title || 'Okänd titel'}</h2>
        <p><b>Från albumet:</b> ${album || 'Okänt album'}</p>
        <p><b>Genre:</b> ${genre || 'Okänd genre'}</p>
        <audio controls src="/data/music/${fileName}"></audio>
        <p><a href="/data/music/${fileName}" download>Ladda ned filen</a></p>
        <p><button class="btn-show-all-music-metadata" data-id="${id}">Visa all metadata</button></p>
      </article>
    `;
  }
  document.querySelector('.music-search-result').innerHTML = resultAsHtml;
}