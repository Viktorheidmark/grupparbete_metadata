// Click on menu link
document.body.addEventListener('click', event => {
  let navLink = event.target.closest('header nav a');
  if (!navLink) { return; }
  // don't try to follow the link in the a tag
  event.preventDefault();
  // read the text in the link
  let linkText = navLink.textContent;
  // show correct content depending on menu choice
  showContent(linkText);
});

// Function to show page content
function showContent(label) {
  let content;
  if (label === 'Start') {
    content = `
      <h1>Start</h1>
      <p>Välkommen till våra sökmotor för metadata, där det är tänkt vi så småningom ska kunna söka i viktiga filer från företagets filservrar.</p>
      <p>Vi har börjat med musikfiler och nuvarande import gjorde 2025-08-27.</p>
      <p>Kontakta din vänliga <b>data manager</b> Thomas om du känner till fler musikfiler som ska indexeras. <a href="mailto:thomas@nodehill.com">thomas@nodehill.com</a>.</p>
    `;
  }
  else if (label === 'Sök musik') {
    content = `
      <h1>Sök musik</h1>
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
  document.querySelector('main').innerHTML = content;
}

// When the page loads
showContent('Start');

// Listen to key up events in the music-search input field
document.body.addEventListener('keyup', event => {
  let inputField = event.target.closest('input[name="music-search"]');
  if (!inputField) { return; }
  musicSearch();
});

// Listen to changes to the select/dropdown music meta field
document.body.addEventListener('change', event => {
  let select = event.target.closest('select[name="music-meta-field"]');
  if (!select) { return; }
  musicSearch();
});

// event handler to show all metadata for a music file on click
// on the button btn-show-all-music-metadata
document.body.addEventListener('click', async event => {
  let button = event.target.closest('.btn-show-all-music-metadata');
  if (!button) { return; }
  // if we have clicked a  btn-show-all-music-metadata
  let id = button.getAttribute('data-id');
  // fetch detailed metadata
  let rawResponse = await fetch('/api/music-all-meta/' + id);
  let result = await rawResponse.json();
  // create a pre element
  let pre = document.createElement('pre');
  pre.innerHTML = JSON.stringify(result, null, '  ');
  // add the newly created pre element after the button
  button.after(pre);
});


// music search (called on key up in search field and on changes to the select/dropdown)
async function musicSearch() {
  let inputField = document.querySelector('input[name="music-search"]');
  // if empty input field do not search just empty search results
  // if(!inputField.value){
  if (inputField.value === '') {
    document.querySelector('.music-search-result').innerHTML = '';
    return;
  }
  // get the chosen field to search for in the meta data
  let field = document.querySelector(
    'select[name="music-meta-field"]'
  ).value;
  // ask the rest-api (correct rest route) for search results
  let rawResponse = await fetch(
    `/api/music-search/${field}/${inputField.value}`
  );
  // unpack search results from json
  let result = await rawResponse.json();
  let resultAsHtml = '';
  for (let { id, fileName, title, artist, album, genre } of result) {
    resultAsHtml += `
      <article>
        <h3>${artist || 'Okänd artist'}</h3>
        <h2>${title || 'Okänd titel'}</h2>
        <p><b>Från albumet:</b> ${album || 'Okänt album'}</p>
        <p><b>Genre:</b> ${genre || 'Okänd genre'}</p>
        <audio controls src="/music/${fileName}"></audio>
        <p><a href="/music/${fileName}" download>Ladda ned filen</a></p>
        <p><button class="btn-show-all-music-metadata" data-id="${id}">Visa all metadata</button></p>
      </article>
    `;
  }
  // replace content in the .music-search-result element (a section tag)
  document.querySelector('.music-search-result').innerHTML = resultAsHtml;
}