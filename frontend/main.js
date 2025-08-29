// Click on menu link
document.body.addEventListener('click', event => {
  let navLink = event.target.closest('header nav a');
  if (!navLink) { return; }
  event.preventDefault();
  let linkText = navLink.textContent;
  showContent(linkText);
});

// Function to show page content
function showContent(label) {
  let content;
  if (label === 'Start') {
    content = `
      <h1>Start</h1>
      <p>Välkommen till våra sökmotor för metadata, där ska kunna söka i viktiga filer från företagets filservrar.</p>
      <p>Vi är Viktor, Isse, Tannz och Benereta som utvecklar detta sida.</p>
      <p>Kontakta oss för fler frågor.</p>
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
  else if (label === 'Sök pdf') {
    content = `
      <h1>Sök pdf</h1>
      <label>
        Sök på: <select name="pdf-meta-field">
          <option value="title">Pdftitel</option>
          <option value="author">Författare</option>
          <option value="subject">Ämne</option>
        </select>
      </label>
      <label>
        <input name="pdf-search" type="text" placeholder="Sök bland pdffiler">
      </label>
      <section class="pdf-search-result"></section>
    `;
  }
  else if (label === 'Sök bilder') {
    content = `
      <h1>Sök bilder</h1>
      <label>
        Sök på: <select name="picture-meta-field">
          <option value="title">Titel</option>
          <option value="author">Fotograf</option>
          <option value="date">Datum</option>
        </select>
      </label>
      <label>
        <input name="picture-search" type="text" placeholder="Sök bland bildfiler">
      </label>
      <section class="picture-search-result"></section>
    `;
  }
  else if (label === 'Sök powerpoint') {
    content = `
      <h1>Sök powerpoint</h1>
      <label>
        Sök på: <select name="ppt-meta-field">
          <option value="title">Titel</option>
          <option value="author">Skapare</option>
          <option value="date">Datum</option>
        </select>
      </label>
      <label>
        <input name="ppt-search" type="text" placeholder="Sök bland ppt-filer">
      </label>
      <section class="ppt-search-result"></section>
    `;
  }
  document.querySelector('main').innerHTML = content;
}

// When the page loads
showContent('Start');

// Listen to key up events in all search input fields
document.body.addEventListener('keyup', event => {
  if (event.target.matches('input[name="music-search"]')) musicSearch();
  if (event.target.matches('input[name="pdf-search"]')) pdfSearch();
  if (event.target.matches('input[name="picture-search"]')) pictureSearch();
  if (event.target.matches('input[name="ppt-search"]')) pptSearch();
});

// Listen to changes to all select/dropdown meta fields
document.body.addEventListener('change', event => {
  if (event.target.matches('select[name="music-meta-field"]')) musicSearch();
  if (event.target.matches('select[name="pdf-meta-field"]')) pdfSearch();
  if (event.target.matches('select[name="picture-meta-field"]')) pictureSearch();
  if (event.target.matches('select[name="ppt-meta-field"]')) pptSearch();
});

// event handler to show all metadata for a file on click
document.body.addEventListener('click', async event => {
  if (event.target.matches('.btn-show-all-music-metadata')) {
    let id = event.target.getAttribute('data-id');
    let rawResponse = await fetch('/api/music-all-meta/' + id);
    let result = await rawResponse.json();
    let pre = document.createElement('pre');
    pre.innerHTML = JSON.stringify(result, null, '  ');
    event.target.after(pre);
  }
  if (event.target.matches('.btn-show-all-pdf-metadata')) {
    let id = event.target.getAttribute('data-id');
    let rawResponse = await fetch('/api/pdf-all-meta/' + id);
    let result = await rawResponse.json();
    let pre = document.createElement('pre');
    pre.innerHTML = JSON.stringify(result, null, '  ');
    event.target.after(pre);
  }
  if (event.target.matches('.btn-show-all-picture-metadata')) {
    let id = event.target.getAttribute('data-id');
    let rawResponse = await fetch('/api/picture-all-meta/' + id);
    let result = await rawResponse.json();
    let pre = document.createElement('pre');
    pre.innerHTML = JSON.stringify(result, null, '  ');
    event.target.after(pre);
  }
  if (event.target.matches('.btn-show-all-ppt-metadata')) {
    let id = event.target.getAttribute('data-id');
    let rawResponse = await fetch('/api/ppt-all-meta/' + id);
    let result = await rawResponse.json();
    let pre = document.createElement('pre');
    pre.innerHTML = JSON.stringify(result, null, '  ');
    event.target.after(pre);
  }
});

// music search
async function musicSearch() {
  let inputField = document.querySelector('input[name="music-search"]');
  if (!inputField || inputField.value === '') {
    document.querySelector('.music-search-result').innerHTML = '';
    return;
  }
  let field = document.querySelector('select[name="music-meta-field"]').value;
  let rawResponse = await fetch(`/api/music-search/${field}/${inputField.value}`);
  let result = await rawResponse.json();
  let resultAsHtml = '';
  for (let { id, fileName, title, artist, album, genre } of result) {
    resultAsHtml += `
      <article>
        <h3>${artist || 'Okänd artist'}</h3>
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

// pdf search
async function pdfSearch() {
  let inputField = document.querySelector('input[name="pdf-search"]');
  if (!inputField || inputField.value === '') {
    document.querySelector('.pdf-search-result').innerHTML = '';
    return;
  }
  let field = document.querySelector('select[name="pdf-meta-field"]').value;
  let rawResponse = await fetch(`/api/pdf-search/${field}/${inputField.value}`);
  let result = await rawResponse.json();
  let resultAsHtml = '';
  for (let { id, fileName, title, author, subject } of result) {
    resultAsHtml += `
      <article>
        <h3>${title || 'Okänd titel'}</h3>
        <p><b>Författare:</b> ${author || 'Okänd författare'}</p>
        <p><b>Ämne:</b> ${subject || 'Okänt ämne'}</p>
        <a href="/data/pdf/${fileName}" download>Ladda ned PDF</a>
        <p><button class="btn-show-all-pdf-metadata" data-id="${id}">Visa all metadata</button></p>
      </article>
    `;
  }
  document.querySelector('.pdf-search-result').innerHTML = resultAsHtml;
}

// picture search
async function pictureSearch() {
  let inputField = document.querySelector('input[name="picture-search"]');
  if (!inputField || inputField.value === '') {
    document.querySelector('.picture-search-result').innerHTML = '';
    return;
  }
  let field = document.querySelector('select[name="picture-meta-field"]').value;
  let rawResponse = await fetch(`/api/picture-search/${field}/${inputField.value}`);
  let result = await rawResponse.json();
  let resultAsHtml = '';
  for (let { id, fileName, title, author, date } of result) {
    resultAsHtml += `
      <article>
        <h3>${title || 'Okänd titel'}</h3>
        <p><b>Fotograf:</b> ${author || 'Okänd fotograf'}</p>
        <p><b>Datum:</b> ${date || 'Okänt datum'}</p>
        <img src="/data/pictures/${fileName}" alt="${title || fileName}" style="max-width:200px;">
        <p><a href="/data/pictures/${fileName}" download>Ladda ned bild</a></p>
        <p><button class="btn-show-all-picture-metadata" data-id="${id}">Visa all metadata</button></p>
      </article>
    `;
  }
  document.querySelector('.picture-search-result').innerHTML = resultAsHtml;
}

// ppt search
async function pptSearch() {
  let inputField = document.querySelector('input[name="ppt-search"]');
  if (!inputField || inputField.value === '') {
    document.querySelector('.ppt-search-result').innerHTML = '';
    return;
  }
  let field = document.querySelector('select[name="ppt-meta-field"]').value;
  let rawResponse = await fetch(`/api/ppt-search/${field}/${inputField.value}`);
  let result = await rawResponse.json();
  let resultAsHtml = '';
  for (let { id, fileName, title, author, date } of result) {
    resultAsHtml += `
      <article>
        <h3>${title || 'Okänd titel'}</h3>
        <p><b>Skapare:</b> ${author || 'Okänd skapare'}</p>
        <p><b>Datum:</b> ${date || 'Okänt datum'}</p>
        <a href="/data/ppt/${fileName}" download>Ladda ned PowerPoint</a>
        <p><button class="btn-show-all-ppt-metadata" data-id="${id}">Visa all metadata</button></p>
      </article>
    `;
  }
    document.querySelector('.ppt-search-result').innerHTML = resultAsHtml;
  }
  