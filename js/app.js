// 1) REGISTRA SERVICE-WORKER
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");

let cropper = null; // istanza cropper

// 2) CARICA IMMAGINE → mostra crop
document.getElementById('imgInput').addEventListener('change', e=>{
  const file = e.target.files[0];
  if(file && file.type.startsWith('image/')){
    const url = URL.createObjectURL(file);
    const cropImg = document.getElementById('cropImg');
    cropImg.src = url;
    document.getElementById('cropArea').style.display = 'block';
    if(cropper) cropper.destroy();
    cropper = new Cropper(cropImg, {
      aspectRatio: NaN,   // libero
      viewMode: 1,
      autoCropArea: 0.8
    });
  }
});

// 3) CONFERMA CROP  →  Blob → objectURL
document.getElementById('btnCropOK').addEventListener('click', () => {
  if (!cropper) return;
  const btn = document.getElementById('btnCropOK');
  btn.disabled = true; // anti-doppio-click
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
  }, 'image/jpeg', 0.92);
});

// 4) ANNULLA CROP
document.getElementById('btnCropCancel').addEventListener('click', () => {
  document.getElementById('cropArea').style.display = 'none';
  if (cropper) { cropper.destroy(); cropper = null; }
  URL.revokeObjectURL(document.getElementById('cropImg').src);
});

// 5) RIMUOVI IMMAGINE (ripristina default)
document.getElementById('btnDelImg').addEventListener('click', () => {
  document.querySelector('.immagine').src = 'img/default.jpg';
  document.getElementById('imgInput').value = '';
});

// 6) ESPORTA & INVIA
document.getElementById('btnExport').addEventListener('click', async() => {
  btnExport.disabled = true;
  const canvas = await html2canvas(document.getElementById('editor'), {scale: 2});
  canvas.toBlob(blob => {
    const file = new File([blob], "giornalino.png", {type: "image/png"});
    if (navigator.canShare && navigator.canShare({files: [file]})) {
      navigator.share({title: "Giornalino", text: "Ecco il nuovo numero!", files: [file]});
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "giornalino.png"; a.click();
      const msg = encodeURIComponent("Ecco il nuovo numero del giornalino! 🗞");
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    }
    btnExport.disabled = false;
  }, "image/png", 0.9);
});