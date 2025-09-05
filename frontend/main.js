
// Click on menu link
document.body.addEventListener('click', event => {
  let navLink = event.target.closest('header nav a');
  if (!navLink) return;
  event.preventDefault();
  showContent();
});

// Function to show all search fields at once (inkl. kartsektion)
function showContent() {
  let content = `
    <h1>Sök metadata</h1>

    <section>
      <h2>Sök musik</h2>
      <label>
        Sök på: <select name="music-meta-field">
          <option value="artist">Artist</option>
          <option value="title">Låttitel</option>
          <option value="album">Album</option>
          <option value="genre">Genre</option>
        </select>
      </label>
      <input name="music-search" type="text" placeholder="Sök bland musikfiler">
      <section class="music-search-result"></section>
    </section>

    <section>
      <h2>Sök pdf</h2>
      <label>
        Sök på: <select name="pdf-meta-field">
          <option value="title">Pdftitel</option>
          <option value="author">Författare</option>
        </select>
      </label>
      <input name="pdf-search" type="text" placeholder="Sök bland pdffiler">
      <section class="pdf-search-result"></section>
    </section>

    <section>
      <h2>Sök bilder</h2>
      <label>
        Sök på: <select name="picture-meta-field">
          <option value="Make">Märke</option>
          <option value="Model">Modell</option>
        </select>
      </label>
      <input name="picture-search" type="text" placeholder="Sök bland bildfiler">
      <section class="picture-search-result"></section>
    </section>

    <section>
      <h2>Sök powerpoint</h2>
      <label>
        Sök på: <select name="ppt-meta-field">
          <option value="Title">Titel</option>
          <option value="Author">Författare</option>
        </select>
      </label>
      <input name="ppt-search" type="text" placeholder="Sök bland ppt-filer">
      <section class="ppt-search-result"></section>
    </section>

    <!-- Kartsektion -->
    <section class="map-wrapper">
      <h2>Karta (Geo-data)</h2>
      <div id="map-fixed">Laddar karta...</div>
    </section>
  `;
  document.querySelector('main').innerHTML = content;

  // Initiera karta
  initMapEmbedded().catch(err => {
    console.warn('Kunde inte initiera kartan:', err);
    const mapEl = document.getElementById('map-fixed');
    if (mapEl) mapEl.innerText = 'Kartan kunde inte laddas. Se konsolen.';
  });
}

// Visa innehåll vid sidladdning
showContent();

/* ---------- Event-lyssnare för sökfunktionalitet ---------- */
document.body.addEventListener('keyup', event => {
  if (event.target.matches('input[name="music-search"]')) musicSearch();
  if (event.target.matches('input[name="pdf-search"]')) pdfSearch();
  if (event.target.matches('input[name="picture-search"]')) pictureSearch();
  if (event.target.matches('input[name="ppt-search"]')) pptSearch();
});

document.body.addEventListener('change', event => {
  if (event.target.matches('select[name="music-meta-field"]')) musicSearch();
  if (event.target.matches('select[name="pdf-meta-field"]')) pdfSearch();
  if (event.target.matches('select[name="picture-meta-field"]')) pictureSearch();
  if (event.target.matches('select[name="ppt-meta-field"]')) pptSearch();
});

document.body.addEventListener('click', async event => {
  if (event.target.matches('.btn-show-all-music-metadata')) {
    let id = event.target.dataset.id;
    let result = await (await fetch('/api/music-all-meta/' + id)).json();
    let pre = document.createElement('pre');
    pre.innerHTML = JSON.stringify(result, null, '  ');
    event.target.after(pre);
  }
  if (event.target.matches('.btn-show-all-pdf-metadata')) {
    let id = event.target.dataset.id;
    let result = await (await fetch('/api/pdf-all-meta/' + id)).json();
    let pre = document.createElement('pre');
    pre.innerHTML = JSON.stringify(result, null, '  ');
    event.target.after(pre);
  }
  if (event.target.matches('.btn-show-all-picture-metadata')) {
    let id = event.target.dataset.id;
    let result = await (await fetch('/api/pictures-all-meta/' + id)).json();
    let pre = document.createElement('pre');
    pre.innerHTML = JSON.stringify(result, null, '  ');
    event.target.after(pre);
  }
  if (event.target.matches('.btn-show-all-ppt-metadata')) {
    let id = event.target.dataset.id;
    let result = await (await fetch('/api/ppt-all-meta/' + id)).json();
    let pre = document.createElement('pre');
    pre.innerHTML = JSON.stringify(result, null, '  ');
    event.target.after(pre);
  }
});

/* ---------- Sökfunktioner ---------- */
async function musicSearch() {
  let inputField = document.querySelector('input[name="music-search"]');
  if (!inputField || !inputField.value) return document.querySelector('.music-search-result').innerHTML = '';
  let field = document.querySelector('select[name="music-meta-field"]').value;
  let result = await (await fetch(`/api/music-search/${field}/${inputField.value}`)).json();
  let html = '';
  for (let { id, fileName, title, artist, album, genre } of result) {
    html += `
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
  document.querySelector('.music-search-result').innerHTML = html;
}

async function pdfSearch() {
  let inputField = document.querySelector('input[name="pdf-search"]');
  if (!inputField || !inputField.value) return document.querySelector('.pdf-search-result').innerHTML = '';
  let field = document.querySelector('select[name="pdf-meta-field"]').value;
  let result = await (await fetch(`/api/pdf-search/${field}/${inputField.value}`)).json();
  let html = '';
  for (let { id, fileName, title, author, subject } of result) {
    html += `
      <article>
        <h3>${title || 'Okänd titel'}</h3>
        <p><b>Författare:</b> ${author || 'Okänd författare'}</p>
        <p><b>Ämne:</b> ${subject || 'Okänt ämne'}</p>
        <a href="/data/pdf/${fileName}" download>Ladda ned PDF</a>
        <p><button class="btn-show-all-pdf-metadata" data-id="${id}">Visa all metadata</button></p>
      </article>
    `;
  }
  document.querySelector('.pdf-search-result').innerHTML = html;
}

async function pictureSearch() {
  let inputField = document.querySelector('input[name="picture-search"]');
  if (!inputField || !inputField.value) return document.querySelector('.picture-search-result').innerHTML = '';
  let field = document.querySelector('select[name="picture-meta-field"]').value;
  let result = await (await fetch(`/api/pictures-search/${field}/${inputField.value}`)).json();
  let html = '';
  for (let { id, fileName, title, author, date } of result) {
    html += `
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
  document.querySelector('.picture-search-result').innerHTML = html;
}

async function pptSearch() {
  let inputField = document.querySelector('input[name="ppt-search"]');
  if (!inputField || !inputField.value) return document.querySelector('.ppt-search-result').innerHTML = '';
  let field = document.querySelector('select[name="ppt-meta-field"]').value;
  let result = await (await fetch(`/api/powerpoint-search/${field}/${inputField.value}`)).json();
  let html = '';
  for (let { id, FileName, Title, Author } of result) {
    html += `
      <article>
        <h3>${Title || 'Okänd titel'}</h3>
        <p><b>Skapare:</b> ${Author || 'Okänd skapare'}</p>
        <a href="/data/ppt/${FileName}" download>Ladda ned PowerPoint</a>
        <p><button class="btn-show-all-ppt-metadata" data-id="${id}">Visa all metadata</button></p>
      </article>
    `;
  }
  document.querySelector('.ppt-search-result').innerHTML = html;
}

/* ---------- Google Maps + GeoJSON ---------- */
let _googleLoaded = false;
let _mapInstance = null;
let _mapInitializedForThisView = false;

function loadGoogleMaps(apiKey) {
  if (_googleLoaded && window.google && window.google.maps) return Promise.resolve(window.google);
  return new Promise((resolve, reject) => {
    window._onGoogleMapsLoaded = () => {
      _googleLoaded = true;
      resolve(window.google);
    };
    const script = document.createElement('script');
    const key = 'DIN_FAKTISKA_GOOGLE_MAPS_API_KEY'; // Sätt din nyckel här
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry&callback=_onGoogleMapsLoaded`;
    script.async = true;
    script.defer = true;
    script.onerror = e => reject(e);
    document.head.appendChild(script);
  });
}

async function initMapEmbedded() {
  if (_mapInitializedForThisView) return;
  const mapEl = document.getElementById('map-fixed');
  if (!mapEl) return;

  const google = await loadGoogleMaps();

  const center = { lat: 59.334591, lng: 18.06324 };
  _mapInstance = new google.maps.Map(mapEl, { center, zoom: 12 });
  const infoWindow = new google.maps.InfoWindow();

  // Hämta geojson från backend
  let geojson = null;
  try {
    const resp = await fetch('/api/pictures-geojson');
    if (resp.ok) geojson = await resp.json();
  } catch (e) {
    console.warn('Kunde inte hämta geojson:', e);
  }

  if (!geojson) geojson = { type: 'FeatureCollection', features: [] };

  _mapInstance.data.addGeoJson(geojson);
  _mapInstance.data.setStyle(feature => {
    const geomType = feature.getGeometry().getType();
    const isPolygon = geomType.includes('Polygon');
    return {
      fillOpacity: isPolygon ? 0.2 : 0.0,
      strokeWeight: isPolygon ? 2 : 1,
      strokeColor: '#3367d6',
      fillColor: '#3367d6',
      icon: !isPolygon ? { path: google.maps.SymbolPath.CIRCLE, scale: 6, strokeWeight: 2 } : null
    };
  });

  _mapInstance.data.addListener('click', e => {
    const props = e.feature.getProperty('name') || 'Feature';
    const more = e.feature.getProperty('info') || '';
    infoWindow.setContent(`<div style="min-width:160px"><b>${props}</b><br/>${more}</div>`);
    infoWindow.setPosition(e.latLng);
    infoWindow.open(_mapInstance);
  });

  // Anpassa vy
  const bounds = new google.maps.LatLngBounds();
  _mapInstance.data.forEach(feature => {
    feature.getGeometry().forEachLatLng(latLng => bounds.extend(latLng));
  });
  if (!bounds.isEmpty()) _mapInstance.fitBounds(bounds);

  _mapInitializedForThisView = true;
}