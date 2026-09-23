const gallery = document.querySelector('#gallery');
const status = document.querySelector('#status');
const template = document.querySelector('#card-template');

function setStatus(message) {
  status.textContent = message;
}

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
  video.muted = true;
  video.loop = true;
  video.preload = 'metadata';
  video.src = entry.preview;
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
