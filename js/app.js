// Service Worker
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

let cropper = null;

// CHANGE sull’input VISIBLE
document.getElementById('imgInput').addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;

  const url = URL.createObjectURL(file);
  const cropImg = document.getElementById('cropImg');
  cropImg.src = url;
  document.getElementById('cropArea').style.display = 'block';
  if (cropper) cropper.destroy();
  cropper = new Cropper(cropImg, { aspectRatio: NaN, viewMode: 1, autoCropArea: 0.8 });
});

// OK crop
document.getElementById('btnCropOK').addEventListener('click', () => {
  if (!cropper) return;
  const canvas = cropper.getCroppedCanvas({ maxWidth: 4096, maxHeight: 4096 });
  if (!canvas) return;
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    document.querySelector('.immagine').src = url;
    document.getElementById('cropArea').style.display = 'none';
    cropper.destroy(); cropper = null;
    URL.revokeObjectURL(document.getElementById('cropImg').src);
  }, 'image/jpeg', 0.92);
});

// Annulla crop
document.getElementById('btnCropCancel').addEventListener('click', () => {
  document.getElementById('cropArea').style.display = 'none';
  if (cropper) { cropper.destroy(); cropper = null; }
  URL.revokeObjectURL(document.getElementById('cropImg').src);
});

// Rimuovi immagine
document.getElementById('btnDelImg').addEventListener('click', () => {
  document.querySelector('.immagine').src = 'img/default.jpg';
  document.getElementById('imgInput').value = '';
});