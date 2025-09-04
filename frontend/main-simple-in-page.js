// Load all images from the rest-api and create html
let data = await fetch('/api/images');
let images = await data.json();
let html = '';
for (let image of images) {
  let { latitude, longitude } = image.metadata;
  html += `<section class="geo-image">
      <img
        src="/images/${image.fileName}"
        alt="Arable land at latitude ${latitude}, longitude ${longitude}"
        data-longitude="${longitude}"
        data-latitude="${latitude}"
      >
    </section>`;
}
document.querySelector('article').innerHTML = html;

// Add a div with the id map to the web page
const div = document.createElement('div');
div.setAttribute('id', 'map-fixed');
document.body.append(div);

// Position on map
// (around Alicante, Spain)
let myPosition = {
  lat: 38.3502086913537,
  lng: -0.504140513818605
};

// Create the map variable here
// so that is is available for all functions/code
// in this file
let map;

function initMap() {
  // Create a new google map
  map = new google.maps.Map(
    // the html element to mount the map inside
    document.querySelector('#map-fixed'),
    // settings - coordinates to center the map around, zoom level
    {
      center: myPosition,
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
  );
}

// Make initMap global so Google's JavaScript can call it
globalThis.initMap = initMap;

// Now "mount"/include Google Map script
// (because now we are sure that initMap exists for Google's
//  JavaScript to call)
let script = document.createElement('script');
script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap&v=weekly';
document.body.append(script);

// Create the marker variable outside the listener
// so that it is available on next click
// (where we can remove the previous marker)
let marker;

// Listen to clicks on the images
document.body.addEventListener('click', event => {
  let img = event.target.closest('.geo-image img');
  if (!img) { return; }
  let longitude = +img.getAttribute('data-longitude');
  let latitude = +img.getAttribute('data-latitude');
  // Remove previous marker if it exists
  marker && marker.setMap(null);
  // Set a new marker
  marker = new google.maps.Marker({
    map,
    position: { lat: latitude, lng: longitude },
    title: 'Hey kid!'
  });
  // Pan to - pan the maker into view!
  map.panTo({ lat: latitude, lng: longitude });
});
