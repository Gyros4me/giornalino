// Log visivo
const log  = (...a) => console.log(...a) || document.getElementById('log').appendChild(document.createTextNode(a.join(' ')+'\n'));

log('JS caricato');

// Service Worker
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

let cropper = null;
let cropURL  = null; // per pulire

// 1) CHANGE → limitiamo peso e apriamo crop
document.getElementById('imgInput').addEventListener('change', e => {
  log('CHANGE');
  const file = e.target.files?.[0];
  if (!file) { log('Nessun file'); return; }
  if (!file.type.startsWith('image/')) { log('Non immagine'); return; }

  // leggiamo l'immagine e la RIDUCIAMO se troppo grande
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.src = url;
  img.onload = () => {
    log('Image onload', img.width, img.height);
    const max = 1200; // lato massimo
    let w = img.width, h = img.height;
    if (w > max || h > max) {
      const ratio = Math.min(max / w, max / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      log('Ridimensiono a', w, h);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        openCropBlob(blob);
      }, 'image/jpeg', 0.92);
    } else {
      openCropBlob(file);
    }
  };
  img.onerror = () => {
    log('ERRORE caricamento img');
    URL.revokeObjectURL(url);
  };
});

function openCropBlob(blob) {
  cropURL = URL.createObjectURL(blob);
  const cropImg = document.getElementById('cropImg');
  cropImg.src = cropURL;
  document.getElementById('cropArea').style.display = 'block';
  if (cropper) cropper.destroy();
  cropper = new Cropper(cropImg, {
    aspectRatio: NaN,
    viewMode: 1,
    autoCropArea: 0.8,
    ready()     { log('Cropper PRONTO');   document.getElementById('cropHint').textContent='👉 Sposta o ingrandisci il riquadro bianco';   enableOK(true); },
    cropmove()  { enableOK(); },
    cropend()   { enableOK(); }
  });

  // se dopo 4 secondi non è pronto, forziamo comunque
  setTimeout(() => {
    if (cropper && !cropper.ready) {
      log('Forzo cropper (timeout)');
      document.getElementById('cropHint').textContent='👉 Sposta o ingrandisci il riquadro bianco';
      enableOK(true);
    }
  }, 4000);
}

// 4) ABILITA / DISABILITA OK
function enableOK(force = false) {
  const canCrop = force || (cropper && cropper.getCroppedCanvas());
  document.getElementById('btnCropOK').disabled = !canCrop;
}

// 5) CONFERMA – solo se abilitato
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
    URL.revokeObjectURL(cropURL);
    log('Crop finito');
  }, 'image/jpeg', 0.92);
});

// 6) ANNULLA / RIMUOVI
document.getElementById('btnCropCancel').addEventListener('click', () => {
  document.getElementById('cropArea').style.display = 'none';
  if (cropper) { cropper.destroy(); cropper = null; }
  URL.revokeObjectURL(cropURL);
  enableOK(false);
});

document.getElementById('btnDelImg').addEventListener('click', () => {
  document.querySelector('.immagine').src = 'img/default.jpg';
  document.getElementById('imgInput').value = '';
});