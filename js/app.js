// Log visivo
const log = (...args) => {
  const d = document.getElementById('log');
  d.appendChild(document.createTextNode(args.join(' ') + '\n'));
  d.scrollTop = d.scrollHeight;
};
log('JS caricato');

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => log('SW ok')).catch(e => log('SW err', e.message));
}

let cropper = null;

// 1) CHANGE con log e controlli
document.getElementById('imgInput').addEventListener('change', e => {
  log('CHANGE event');
  const file = e.target.files?.[0];
  if (!file) { log('Nessun file selezionato'); return; }
  if (!file.type.startsWith('image/')) { log('Tipo non immagine: ' + file.type); return; }
  log('File ok', file.name, file.size, file.type);
  openCrop(file);
}, false);

function openCrop(file) {
  const url = URL.createObjectURL(file);
  const cropImg = document.getElementById('cropImg');
  cropImg.src = url;
  document.getElementById('cropArea').style.display = 'block';
  if (cropper) cropper.destroy();
  cropper = new Cropper(cropImg, {
    aspectRatio: NaN,
    viewMode: 1,
    autoCropArea: 0.8,
    ready() { log('Cropper ready'); }
  });
}

// 2) CONFERMA CROP – con controllo canvas
document.getElementById('btnCropOK').addEventListener('click', () => {
  log('CLICK OK');
  if (!cropper) { log('Nessun cropper'); return; }
  const canvas = cropper.getCroppedCanvas({ maxWidth: 4096, maxHeight: 4096 });
  if (!canvas) { log('Canvas null – niente da ritagliare'); return; }
  log('Canvas creato', canvas.width, canvas.height);
  canvas.toBlob(blob => {
    if (!blob) { log('Blob null'); return; }
    const url = URL.createObjectURL(blob);
    document.querySelector('.immagine').src = url;
    document.getElementById('cropArea').style.display = 'none';
    cropper.destroy(); cropper = null;
    URL.revokeObjectURL(document.getElementById('cropImg').src);
    log('Crop finito');
  }, 'image/jpeg', 0.92);
});

// 3) ANNULLA / RIMUOVI
document.getElementById('btnCropCancel').addEventListener('click', () => {
  document.getElementById('cropArea').style.display = 'none';
  if (cropper) { cropper.destroy(); cropper = null; }
  URL.revokeObjectURL(document.getElementById('cropImg').src);
});

document.getElementById('btnDelImg').addEventListener('click', () => {
  document.querySelector('.immagine').src = 'img/default.jpg';
  document.getElementById('imgInput').value = '';
});