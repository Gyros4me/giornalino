// Log visivo
const log  = (...a) => console.log(...a) || document.getElementById('log').appendChild(document.createTextNode(a.join(' ')+'\n'));
const stat = (...a) => document.getElementById('cropStatus').textContent = a.join(' ');

log('JS caricato');

// Service Worker
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then(() => log('SW ok')).catch(e => log('SW err', e.message));

let cropper = null;

// 1) CHANGE → mostriamo cropper
document.getElementById('imgInput').addEventListener('change', e => {
  log('CHANGE');
  const file = e.target.files?.[0];
  if (!file) { log('Nessun file'); stat('Nessuna immagine'); return; }
  if (!file.type.startsWith('image/')) { log('Non immagine'); stat('File non valido'); return; }
  stat('Caricamento cropper...');
  openCrop(file);
});

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
    ready()     { log('Cropper PRONTO');   stat('Ritaglia l’immagine');   enableOK(true); },
    cropstart() { log('Crop start'); },
    cropend()   { log('Crop end');         enableOK(); }
  });
}

// 2) ABILITA / DISABILITA OK
function enableOK(force = false) {
  const canCrop = force || (cropper && cropper.getCroppedCanvas());
  document.getElementById('btnCropOK').disabled = !canCrop;
  stat(canCrop ? '' : 'Sposta o ridimensiona il riquadro');
}

// 3) CONFERMA – solo se abilitato
document.getElementById('btnCropOK').addEventListener('click', () => {
  log('CLICK OK');
  if (!cropper) { log('ERRORE: cropper null'); return; }
  const canvas = cropper.getCroppedCanvas({ maxWidth: 4096, maxHeight: 4096 });
  if (!canvas) { log('ERRORE: canvas null'); return; }
  log('Canvas OK', canvas.width, canvas.height);
  canvas.toBlob(blob => {
    if (!blob) { log('ERRORE: blob null'); return; }
    const url = URL.createObjectURL(blob);
    document.querySelector('.immagine').src = url;
    document.getElementById('cropArea').style.display = 'none';
    cropper.destroy(); cropper = null;
    URL.revokeObjectURL(document.getElementById('cropImg').src);
    stat('Immagine aggiornata!');
    enableOK(false);
  }, 'image/jpeg', 0.92);
});

// 4) ANNULLA / RIMUOVI
document.getElementById('btnCropCancel').addEventListener('click', () => {
  document.getElementById('cropArea').style.display = 'none';
  if (cropper) { cropper.destroy(); cropper = null; }
  URL.revokeObjectURL(document.getElementById('cropImg').src);
  stat('');
  enableOK(false);
});

document.getElementById('btnDelImg').addEventListener('click', () => {
  document.querySelector('.immagine').src = 'img/default.jpg';
  document.getElementById('imgInput').value = '';
  stat('Immagine rimossa');
});