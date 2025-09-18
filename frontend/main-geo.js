async function start() {
    let data = await fetch('/api/images');
    let images = await data.json();
    let html = '';
    for (let image of images) {
        html += `<section>
      <a href="https://maps.google.com/?q=${image.metadata.latitude},${image.metadata.longitude}" target="_blank"><img src="/images/${image.fileName}"></a>
    </section>`;
    }
    document.querySelector('article').innerHTML = html;
}

start();