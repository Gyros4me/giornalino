// Log visivo
const log  = (...a) => console.log(...a) || document.getElementById('log').appendChild(document.createTextNode(a.join(' ')+'\n'));

log('JS caricato');

// Service Worker
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

let cropper = null;
let cropURL  = null; // per pulire

// 1) CHANGE → apriamo crop
document.getElementById('imgInput').addEventListener('change', e => {
  log('CHANGE');
  const file = e.target.files?.[0];
  if (!file) { log('Nessun file'); return; }
  if (!file.type.startsWith('image/')) { log('Non immagine'); return; }
  openCropFile(file);
});

function openCropFile(file) {
  cropURL = URL.createObjectURL(file);
  const cropImg = document.getElementById('cropImg');
  cropImg.src = cropURL;

  // aspettiamo onload prima di costruire cropper
  cropImg.onload = () => {
    log('CropImg onload – attendo render');
    document.getElementById('cropArea').style.display = 'block';

    // piccolo timeout per sicurezza render
    setTimeout(() => {
      log('Costruisco cropper');
      if (cropper) cropper.destroy();
      cropper = new Cropper(cropImg, {
        aspectRatio: NaN,
        viewMode: 1,
        autoCropArea: 0.5,
        movable: true,
        zoomable: true,
        scalable: true,
        ready()     { log('Cropper ready');   enableOK(true); },
        cropmove()  { enableOK(); },
        cropend()   { enableOK(); }
      });
      // forziamo rettangolo visibile
      cropper.setCropBoxData({ left: 50, top: 50, width: 300, height: 200 });

    }, 100); // 100 ms bastano

    // se dopo 4 secondi non è pronto, offriamo via d’uscita
    setTimeout(() => {
      if (!cropper || !cropper.getCroppedCanvas()) {
        log('Cropper non partito – offro via d’uscita');
        document.getElementById('cropHint').textContent='👉 Tocca "Salva senza ritaglio"';
        document.getElementById('btnSkipCrop').style.display='inline-block';
      }
    }, 4000);
  };

  cropImg.onerror = () => {
    log('ERRORE cropImg onload');
    URL.revokeObjectURL(cropURL);
  };
}

// 2) ABILITA / DISABILITA OK
function enableOK(force = false) {
  const canCrop = force || (cropper && cropper.getCroppedCanvas());
  document.getElementById('btnCropOK').disabled = !canCrop;
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
    URL.revokeObjectURL(cropURL);
    log('Crop finito');
  }, 'image/jpeg', 0.92);
});

// 4) SALVA SENZA RITAGLIO (via d’uscita iOS)
document.getElementById('btnSkipCrop').addEventListener('click', () => {
  log('Skip crop – uso img intera');
  document.querySelector('.immagine').src = cropURL;
  document.getElementById('cropArea').style.display = 'none';
  if (cropper) { cropper.destroy(); cropper = null; }
  document.getElementById('btnSkipCrop').style.display='none';
  log('Immagine salvata intera');
});

// 5) ANNULLA / RIMUOVI
document.getElementById('btnCropCancel').addEventListener('click', () => {
  log('CLICK Annulla');
  document.getElementById('cropArea').style.display = 'none';
  if (cropper) { cropper.destroy(); cropper = null; }
  URL.revokeObjectURL(cropURL);
  document.getElementById('btnSkipCrop').style.display='none';
});

document.getElementById('btnDelImg').addEventListener('click', () => {
  log('CLICK Rimuovi');
  document.querySelector('.immagine').src = 'img/default.jpg';
  document.getElementById('imgInput').value = '';
});