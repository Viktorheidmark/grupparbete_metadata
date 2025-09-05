// ---------- Klick på meny-länk ----------
document.body.addEventListener('click', event => {
  const navLink = event.target.closest('header nav a');
  if (!navLink) return;
  event.preventDefault();
  showContent();
});

// ---------- Visa sökfält + karta ----------
function showContent() {
  document.querySelector('main').innerHTML = `
    <h1>Sök metadata</h1>

    <section>
      <h2>Sök musik</h2>
      <label>Sök på:
        <select name="music-meta-field">
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
      <label>Sök på:
        <select name="pdf-meta-field">
          <option value="title">Pdftitel</option>
          <option value="author">Författare</option>
        </select>
      </label>
      <input name="pdf-search" type="text" placeholder="Sök bland pdffiler">
      <section class="pdf-search-result"></section>
    </section>

    <section>
      <h2>Sök bilder</h2>
      <label>Sök på:
        <select name="picture-meta-field">
          <option value="Make">Märke</option>
          <option value="Model">Modell</option>
        </select>
      </label>
      <input name="picture-search" type="text" placeholder="Sök bland bildfiler">
      <section class="picture-search-result"></section>
    </section>

    <section>
      <h2>Sök powerpoint</h2>
      <label>Sök på:
        <select name="ppt-meta-field">
          <option value="Title">Titel</option>
          <option value="Author">Författare</option>
        </select>
      </label>
      <input name="ppt-search" type="text" placeholder="Sök bland ppt-filer">
      <section class="ppt-search-result"></section>
    </section>

    <section class="map-wrapper">
      <h2>Karta (Geo-data)</h2>
      <div id="map-fixed">Laddar karta...</div>
    </section>
  `;

  initMapEmbedded().catch(err => {
    console.warn('Kunde inte initiera kartan:', err);
    const mapEl = document.getElementById('map-fixed');
    if (mapEl) mapEl.innerText = 'Kartan kunde inte laddas. Se konsolen.';
  });
}

// Visa innehåll vid sidladdning
showContent();

// ---------- Event-lyssnare för sök ----------
document.body.addEventListener('keyup', e => {
  if (e.target.matches('input[name="music-search"]')) musicSearch();
  if (e.target.matches('input[name="pdf-search"]')) pdfSearch();
  if (e.target.matches('input[name="picture-search"]')) pictureSearch();
  if (e.target.matches('input[name="ppt-search"]')) pptSearch();
});

document.body.addEventListener('change', e => {
  if (e.target.matches('select[name="music-meta-field"]')) musicSearch();
  if (e.target.matches('select[name="pdf-meta-field"]')) pdfSearch();
  if (e.target.matches('select[name="picture-meta-field"]')) pictureSearch();
  if (e.target.matches('select[name="ppt-meta-field"]')) pptSearch();
});

document.body.addEventListener('click', async e => {
  const btn = e.target;
  if (btn.classList.contains('btn-show-all-music-metadata')) showMeta(btn, '/api/music-all-meta/');
  if (btn.classList.contains('btn-show-all-pdf-metadata')) showMeta(btn, '/api/pdf-all-meta/');
  if (btn.classList.contains('btn-show-all-picture-metadata')) showMeta(btn, '/api/pictures-all-meta/');
  if (btn.classList.contains('btn-show-all-ppt-metadata')) showMeta(btn, '/api/powerpoint-all-meta/');
});

async function showMeta(button, endpoint) {
  const id = button.dataset.id;
  const result = await (await fetch(endpoint + id)).json();
  const pre = document.createElement('pre');
  pre.innerHTML = JSON.stringify(result, null, '  ');
  button.after(pre);
}

// ---------- Sökfunktioner ----------
async function musicSearch() {
  const input = document.querySelector('input[name="music-search"]');
  if (!input || !input.value) return document.querySelector('.music-search-result').innerHTML = '';
  const field = document.querySelector('select[name="music-meta-field"]').value;
  const result = await (await fetch(`/api/music-search/${field}/${input.value}`)).json();
  let html = '';
  for (let r of result) {
    html += `<article>
      <h3>${r.artist || 'Okänd artist'}</h3>
      <h2>${r.title || 'Okänd titel'}</h2>
      <p><b>Album:</b> ${r.album || 'Okänt album'}</p>
      <p><b>Genre:</b> ${r.genre || 'Okänd genre'}</p>
      <audio controls src="/data/music/${r.fileName}"></audio>
      <p><a href="/data/music/${r.fileName}" download>Ladda ned filen</a></p>
      <p><button class="btn-show-all-music-metadata" data-id="${r.id}">Visa all metadata</button></p>
    </article>`;
  }
  document.querySelector('.music-search-result').innerHTML = html;
}

async function pdfSearch() {
  const input = document.querySelector('input[name="pdf-search"]');
  if (!input || !input.value) return document.querySelector('.pdf-search-result').innerHTML = '';
  const field = document.querySelector('select[name="pdf-meta-field"]').value;
  const result = await (await fetch(`/api/pdf-search/${field}/${input.value}`)).json();
  let html = '';
  for (let r of result) {
    html += `<article>
      <h3>${r.title || 'Okänd titel'}</h3>
      <p><b>Författare:</b> ${r.author || 'Okänd'}</p>
      <a href="/data/pdf/${r.fileName}" download>Ladda ned PDF</a>
      <p><button class="btn-show-all-pdf-metadata" data-id="${r.id}">Visa all metadata</button></p>
    </article>`;
  }
  document.querySelector('.pdf-search-result').innerHTML = html;
}

async function pictureSearch() {
  const input = document.querySelector('input[name="picture-search"]');
  if (!input || !input.value) return document.querySelector('.picture-search-result').innerHTML = '';
  const field = document.querySelector('select[name="picture-meta-field"]').value;
  const result = await (await fetch(`/api/pictures-search/${field}/${input.value}`)).json();
  let html = '';
  for (let r of result) {
    html += `<article>
      <h3>${r.title || 'Okänd titel'}</h3>
      <p><b>Fotograf:</b> ${r.author || 'Okänd'}</p>
      <p><b>Datum:</b> ${r.date || 'Okänt datum'}</p>
      <img src="/data/pictures/${r.fileName}" alt="${r.title || r.fileName}" style="max-width:200px;">
      <p><a href="/data/pictures/${r.fileName}" download>Ladda ned bild</a></p>
      <p><button class="btn-show-all-picture-metadata" data-id="${r.id}">Visa all metadata</button></p>
    </article>`;
  }
  document.querySelector('.picture-search-result').innerHTML = html;
}

async function pptSearch() {
  const input = document.querySelector('input[name="ppt-search"]');
  if (!input || !input.value) return document.querySelector('.ppt-search-result').innerHTML = '';
  const field = document.querySelector('select[name="ppt-meta-field"]').value;
  const result = await (await fetch(`/api/powerpoint-search/${field}/${input.value}`)).json();
  let html = '';
  for (let r of result) {
    html += `<article>
      <h3>${r.Title || 'Okänd titel'}</h3>
      <p><b>Skapare:</b> ${r.Author || 'Okänd'}</p>
      <a href="/data/ppt/${r.FileName}" download>Ladda ned PowerPoint</a>
      <p><button class="btn-show-all-ppt-metadata" data-id="${r.id}">Visa all metadata</button></p>
    </article>`;
  }
  document.querySelector('.ppt-search-result').innerHTML = html;
}

// ---------- Google Maps ----------
let _googleLoaded = false;
let _mapInstance = null;
let _mapInitialized = false;

function loadGoogleMaps(apiKey) {
  if (_googleLoaded && window.google && window.google.maps) return Promise.resolve(window.google);
  return new Promise((resolve, reject) => {
    window._onGoogleMapsLoaded = () => {
      _googleLoaded = true;
      resolve(window.google);
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=_onGoogleMapsLoaded`;
    script.async = true;
    script.defer = true;
    script.onerror = e => reject(e);
    document.head.appendChild(script);
  });
}

async function initMapEmbedded() {
  if (_mapInitialized) return;
  const mapEl = document.getElementById('map-fixed');
  if (!mapEl) return;

  const google = await loadGoogleMaps('DIN_FAKTISKA_GOOGLE_MAPS_API_KEY');

  _mapInstance = new google.maps.Map(mapEl, { center: { lat: 59.334591, lng: 18.06324 }, zoom: 12 });
  const infoWindow = new google.maps.InfoWindow();

  // Hämta GeoJSON
  let geojson = null;
  try {
    const resp = await fetch('/api/pictures-geojson');
    if (resp.ok) geojson = await resp.json();
  } catch (e) { console.warn(e); }

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

  _mapInitialized = true;
}