const gallery = document.querySelector('#gallery');
const status = document.querySelector('#status');
const template = document.querySelector('#card-template');
const viewButtons = document.querySelectorAll('.view-button');
const sizeInput = document.querySelector('#card-size');
const sizeOutput = document.querySelector('#card-size-value');

function setStatus(message) {
  status.textContent = message;
}

function setView(view) {
  gallery.classList.toggle('list-view', view === 'list');
  viewButtons.forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

viewButtons.forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

sizeInput.addEventListener('input', () => {
  const size = Number(sizeInput.value);
  gallery.style.setProperty('--card-min', `${size}px`);
  sizeOutput.value = `${size} px`;
  sizeOutput.textContent = `${size} px`;
});

async function loadComposition(entry) {
  const response = await fetch(`gallery/${entry.file}`);
  if (!response.ok) throw new Error(`No se pudo cargar ${entry.file}`);
  return response.json();
}

function createPreview(entry, card) {
  const preview = card.querySelector('.preview');
  if (!entry.preview) {
    preview.innerHTML = '<span class="no-preview">MP4 de demostración pendiente</span>';
    return;
  }
  const video = document.createElement('video');
  video.controls = true;
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  const source = document.createElement('source');
  source.src = new URL(entry.preview, window.location.href).href;
  source.type = 'video/mp4';
  video.append(source);
  video.addEventListener('error', () => {
    preview.innerHTML = '<span class="no-preview">Este navegador no puede reproducir el MP4. Usa Descargar o abre el vídeo directamente.</span>';
  }, { once: true });
  preview.append(video);
}

async function renderEntry(entry) {
  const card = template.content.cloneNode(true);
  card.querySelector('h2').textContent = entry.title;
  card.querySelector('.description').textContent = entry.description || '';
  card.querySelector('.license').textContent = entry.license || '';
  createPreview(entry, card);

  const composition = await loadComposition(entry);
  const json = `${JSON.stringify(composition, null, 2)}\n`;
  const copyButton = card.querySelector('.copy');
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(json);
      copyButton.textContent = 'Código copiado';
      setTimeout(() => { copyButton.textContent = 'Copiar código'; }, 1600);
    } catch {
      setStatus('No se pudo acceder al portapapeles. Puedes usar Descargar JSON.');
    }
  });

  const download = card.querySelector('.download');
  download.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  download.download = entry.file;
  gallery.append(card);
}

async function main() {
  try {
    const response = await fetch('gallery/manifest.json');
    if (!response.ok) throw new Error('No se pudo cargar gallery/manifest.json');
    const entries = await response.json();
    if (!Array.isArray(entries) || entries.length === 0) {
      setStatus('Todavía no hay composiciones publicadas.');
      return;
    }
    for (const entry of entries) await renderEntry(entry);
  } catch (error) {
    setStatus(`No se pudo cargar la galería: ${error.message}`);
  }
}

main();
