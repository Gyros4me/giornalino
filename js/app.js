// ============= DEBUG LOG =============
const log = (...args) => {
  console.log(...args);
  const logEl = document.getElementById('log');
  if (logEl) {
    logEl.textContent += args.join(' ') + '\n';
    logEl.scrollTop = logEl.scrollHeight;
  }
};

log('App caricata correttamente!');

// ============= SERVICE WORKER =============
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => {
    log('SW registration failed:', err);
  });
}

// ============= CROP SYSTEM =============
class ImageCropper {
  constructor() {
    this.canvas = document.getElementById('cropCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.wrapper = document.getElementById('cropCanvasWrapper');
    
    this.img = null;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.aspectRatio = 1;
    
    this.isDragging = false;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.initialDistance = 0;
    this.initialScale = 1;
    
    this.setupEvents();
  }
  
  setupEvents() {
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    
    document.getElementById('zoomSlider').addEventListener('input', (e) => {
      this.scale = parseInt(e.target.value) / 100;
      document.getElementById('zoomValue').textContent = e.target.value + '%';
      this.render();
    });
    
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.aspectRatio = parseFloat(btn.dataset.ratio);
        this.resetPosition();
        this.render();
      });
    });
    
    document.querySelectorAll('.pan-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dir = btn.dataset.dir;
        const step = 20;
        switch(dir) {
          case 'up': this.offsetY += step; break;
          case 'down': this.offsetY -= step; break;
          case 'left': this.offsetX += step; break;
          case 'right': this.offsetX -= step; break;
        }
        this.render();
      });
    });
  }
  
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.img = new Image();
        this.img.onload = () => {
          log(`Immagine caricata: ${this.img.width}x${this.img.height}`);
          this.resetPosition();
          this.render();
          resolve();
        };
        this.img.onerror = reject;
        this.img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  resetPosition() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    document.getElementById('zoomSlider').value = 100;
    document.getElementById('zoomValue').textContent = '100%';
    
    const isMobile = window.innerWidth < 768;
    const maxWidth = Math.min(this.wrapper.clientWidth - 40, isMobile ? 350 : 500);
    const maxHeight = isMobile ? 250 : 400;
    
    let canvasWidth, canvasHeight;
    if (this.aspectRatio >= 1) {
      canvasWidth = maxWidth;
      canvasHeight = maxWidth / this.aspectRatio;
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * this.aspectRatio;
      }
    } else {
      canvasHeight = maxHeight;
      canvasWidth = maxHeight * this.aspectRatio;
      if (canvasWidth > maxWidth) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / this.aspectRatio;
      }
    }
    
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
  }
  
  render() {
    if (!this.img) return;
    
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);
    
    const imgAspect = this.img.width / this.img.height;
    let drawWidth, drawHeight;
    
    if (imgAspect > this.aspectRatio) {
      drawHeight = ch * this.scale;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = cw * this.scale;
      drawHeight = drawWidth / imgAspect;
    }
    
    const x = (cw - drawWidth) / 2 + this.offsetX;
    const y = (ch - drawHeight) / 2 + this.offsetY;
    
    ctx.drawImage(this.img, x, y, drawWidth, drawHeight);
  }
  
  handleTouchStart(e) {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      this.isDragging = false;
      this.initialDistance = this.getTouchDistance(e.touches);
      this.initialScale = this.scale;
    }
  }
  
  handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && this.isDragging) {
      const deltaX = e.touches[0].clientX - this.lastTouchX;
      const deltaY = e.touches[0].clientY - this.lastTouchY;
      
      this.offsetX += deltaX;
      this.offsetY += deltaY;
      
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
      
      this.render();
    } else if (e.touches.length === 2) {
      const currentDistance = this.getTouchDistance(e.touches);
      const scaleChange = currentDistance / this.initialDistance;
      
      this.scale = Math.max(0.5, Math.min(3, this.initialScale * scaleChange));
      
      const sliderValue = Math.round(this.scale * 100);
      document.getElementById('zoomSlider').value = sliderValue;
      document.getElementById('zoomValue').textContent = sliderValue + '%';
      
      this.render();
    }
  }
  
  handleTouchEnd(e) {
    if (e.touches.length === 0) {
      this.isDragging = false;
    }
  }
  
  getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  handleMouseDown(e) {
    this.isDragging = true;
    this.lastTouchX = e.clientX;
    this.lastTouchY = e.clientY;
  }
  
  handleMouseMove(e) {
    if (!this.isDragging) return;
    
    const deltaX = e.clientX - this.lastTouchX;
    const deltaY = e.clientY - this.lastTouchY;
    
    this.offsetX += deltaX;
    this.offsetY += deltaY;
    
    this.lastTouchX = e.clientX;
    this.lastTouchY = e.clientY;
    
    this.render();
  }
  
  handleMouseUp(e) {
    this.isDragging = false;
  }
  
  getCroppedCanvas() {
    if (!this.img) {
      log('✗ getCroppedCanvas: immagine null');
      return null;
    }
    
    log('Creazione canvas crop...');
    
    const targetWidth = Math.min(this.canvas.width * 2, 2000);
    const targetHeight = Math.min(this.canvas.height * 2, 2000);
    
    log('Target size:', targetWidth, 'x', targetHeight);
    
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const ctx = finalCanvas.getContext('2d');
    
    if (!ctx) {
      log('✗ Impossibile ottenere context 2d');
      return null;
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    const scaleRatio = targetWidth / this.canvas.width;
    
    const imgAspect = this.img.width / this.img.height;
    let drawWidth, drawHeight;
    
    if (imgAspect > this.aspectRatio) {
      drawHeight = targetHeight * this.scale;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = targetWidth * this.scale;
      drawHeight = drawWidth / imgAspect;
    }
    
    const x = (targetWidth - drawWidth) / 2 + (this.offsetX * scaleRatio);
    const y = (targetHeight - drawHeight) / 2 + (this.offsetY * scaleRatio);
    
    log('Drawing img:', drawWidth.toFixed(0), 'x', drawHeight.toFixed(0), 'at', x.toFixed(0), y.toFixed(0));
    
    try {
      ctx.drawImage(this.img, x, y, drawWidth, drawHeight);
      log('✓ Immagine disegnata su canvas');
    } catch (err) {
      log('✗ Errore drawImage:', err.message);
      return null;
    }
    
    return finalCanvas;
  }
  
  destroy() {
    this.img = null;
    this.ctx = null;
  }
}

// ============= APP LOGIC =============
let cropper = null;
let currentFile = null;

document.getElementById('imgInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    log('Nessun file selezionato');
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    log('File non valido');
    alert('Per favore seleziona un\'immagine');
    return;
  }
  
  log('File selezionato:', file.name);
  currentFile = file;
  
  document.getElementById('cropArea').style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  if (!cropper) {
    cropper = new ImageCropper();
  }
  
  try {
    await cropper.loadImage(file);
    log('Crop pronto!');
  } catch (err) {
    log('Errore caricamento:', err);
    alert('Errore nel caricamento dell\'immagine');
    document.getElementById('cropArea').style.display = 'none';
  }
});

document.getElementById('btnCropOK').addEventListener('click', () => {
  if (!cropper) {
    log('Errore: cropper non inizializzato');
    return;
  }
  
  log('Conferma crop...');
  const canvas = cropper.getCroppedCanvas();
  
  if (!canvas) {
    log('Errore: canvas null');
    alert('Errore nella creazione dell\'immagine');
    return;
  }
  
  log('Canvas creato:', canvas.width, 'x', canvas.height);
  
  try {
    const dataURL = canvas.toDataURL('image/jpeg', 0.95);
    log('Data URL creato, lunghezza:', dataURL.length);
    
    const imgElement = document.querySelector('.immagine');
    
    if (imgElement) {
      imgElement.onload = () => {
        log('✓ Crop completato!');
        log('✓ Immagine caricata nell\'editor!');
        log('✓ Dimensioni img:', imgElement.naturalWidth, 'x', imgElement.naturalHeight);
      };
      imgElement.onerror = (e) => {
        log('✗ ERRORE caricamento immagine:', e);
      };
      
      imgElement.src = dataURL;
      log('Data URL applicato all\'immagine');
    } else {
      log('✗ Elemento .immagine non trovato!');
    }
    
    document.getElementById('cropArea').style.display = 'none';
    document.body.style.overflow = '';
    
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    
  } catch (err) {
    log('✗ ERRORE conversione canvas:', err.message);
    alert('Errore nella conversione dell\'immagine');
  }
});

document.getElementById('btnSkipCrop').addEventListener('click', () => {
  if (!currentFile) return;
  
  log('Usa immagine originale');
  const reader = new FileReader();
  reader.onload = (e) => {
    const imgElement = document.querySelector('.immagine');
    imgElement.onload = () => {
      log('✓ Immagine originale caricata!');
    };
    imgElement.src = e.target.result;
    
    document.getElementById('cropArea').style.display = 'none';
    document.body.style.overflow = '';
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  };
  reader.readAsDataURL(currentFile);
});

document.getElementById('btnCropCancel').addEventListener('click', () => {
  log('Annulla crop');
  document.getElementById('cropArea').style.display = 'none';
  document.body.style.overflow = '';
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  document.getElementById('imgInput').value = '';
});

document.getElementById('btnDelImg').addEventListener('click', () => {
  log('Rimuovi immagine');
  document.querySelector('.immagine').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23999' font-size='20'%3EImmagine predefinita%3C/text%3E%3C/svg%3E";
  document.getElementById('imgInput').value = '';
});

document.getElementById('btnExport').addEventListener('click', async () => {
  log('Esportazione in corso...');
  
  const isIframe = window.self !== window.top;
  if (isIframe) {
    alert('⚠️ L\'export WhatsApp funziona solo su GitHub Pages.');
    log('⚠️ Export bloccato: iframe');
    return;
  }
  
  try {
    const editor = document.getElementById('editor');
    const canvas = await html2canvas(editor, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true
    });
    
    log('✓ Screenshot creato:', canvas.width, 'x', canvas.height);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        log('✗ Errore creazione blob export');
        return;
      }
      
      log('✓ Blob export creato:', Math.round(blob.size / 1024), 'KB');
      
      const file = new File([blob], 'giornalino.png', { type: 'image/png' });
      
      if (navigator.share) {
        navigator.share({
          files: [file],
          title: 'Il mio giornalino',
          text: 'Guarda il mio giornalino!'
        }).then(() => {
          log('✓ Condiviso con successo!');
        }).catch((err) => {
          log('Condivisione annullata:', err.message);
          downloadImage(blob);
        });
      } else {
        log('Web Share API non disponibile, download...');
        downloadImage(blob);
      }
    }, 'image/png');
    
  } catch (err) {
    log('✗ Errore esportazione:', err.message);
    alert('Errore durante l\'esportazione');
  }
});

function downloadImage(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'giornalino-' + Date.now() + '.png';
  a.click();
  URL.revokeObjectURL(url);
  log('✓ Immagine scaricata!');
}