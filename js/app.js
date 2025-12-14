const log = (...args) => {
const d = document.getElementById('log');
d.appendChild(document.createTextNode(args.join(' ') + '\n'));
d.scrollTop = d.scrollHeight;
};
log('APP START');
// 0) Service Worker
if ('serviceWorker' in navigator) {
navigator.serviceWorker.register('sw.js').then(() => log('SW ok')).catch(e => log('SW err', e));
}
let cropper = null;
// 1) INPUT FILE  —  con LOG e fallback “click”
const fileIn = document.getElementById('imgInput');
fileIn.addEventListener('change', e => {
log('CHANGE fired');
const file = e.target.files?.[0];
if (!file) { log('Nessun file'); return; }
if (!file.type.startsWith('image/')) { log('Non immagine'); return; }
log('File ricevuto', file.name, file.size);
openCrop(file);
}, false);
// se l’evento non parte, forziamo click (utile in PWA)
document.getElementById('btnChoose').addEventListener('click', () => {
log('Forzo click input');
fileIn.value = ''; // svuota per poter ri-scegliere la stessa foto
fileIn.click();
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
autoCropArea: 0.8
});
log('Cropper aperto');
}
// 2) OK crop
document.getElementById('btnCropOK').addEventListener('click', () => {
if (!cropper) return;
const btn = document.getElementById('btnCropOK');
btn.disabled = true;
const canvas = cropper.getCroppedCanvas({ maxWidth: 4096, maxHeight: 4096 });
if (!canvas) { btn.disabled = false; return; }
canvas.toBlob(blob => {
if (!blob) { btn.disabled = false; return; }
const url = URL.createObjectURL(blob);
document.querySelector('.immagine').src = url;
document.getElementById('cropArea').style.display = 'none';
cropper.destroy(); cropper = null;
URL.revokeObjectURL(document.getElementById('cropImg').src);
btn.disabled = false;
log('Crop confermato');
}, 'image/jpeg', 0.92);
});
// 3) Annulla crop
document.getElementById('btnCropCancel').addEventListener('click', () => {
document.getElementById('cropArea').style.display = 'none';
if (cropper) { cropper.destroy(); cropper = null; }
URL.revokeObjectURL(document.getElementById('cropImg').src);
log('Crop annullato');
});
// 4) Rimuovi immagine
document.getElementById('btnDelImg').addEventListener('click', () => {
document.querySelector('.immagine').src = 'img/default.jpg';
fileIn.value = '';
log('Immagine rimossa');
});
// 5) Esporta
document.getElementById('btnExport').addEventListener('click', async () => {
const btn = document.getElementById('btnExport');
btn.disabled = true;
const canvas = await html2canvas(document.getElementById('editor'), { scale: 2 });
canvas.toBlob(blob => {
const file = new File([blob], 'giornalino.png', { type: 'image/png' });
if (navigator.canShare && navigator.canShare({ files: [file] })) {
navigator.share({ title: 'Giornalino', text: 'Ecco il nuovo numero!', files: [file] });
} else {
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = 'giornalino.png'; a.click();
const msg = encodeURIComponent('Ecco il nuovo numero del giornalino! 🗞');
window.open(https://wa.me/?text=${msg}, '_blank');
}
btn.disabled = false;
}, 'image/png', 0.9);
});
