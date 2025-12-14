// 1) REGISTRA SERVICE-WORKER
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");

// 2) DRAG-&-DROP BASICO (opzionale)
const editor=document.getElementById("editor");
editor.addEventListener("dragover",e=>e.preventDefault());
editor.addEventListener("drop",e=>{
  e.preventDefault();
  const file=e.dataTransfer.files[0];
  if(file && file.type.startsWith("image/")){
    const url=URL.createObjectURL(file);
    const img=document.querySelector('.immagine');
    img.src=url;
  }
});

// 3) CARICA IMMAGINE DA GALLERIA/CAMERA
document.getElementById('imgInput').addEventListener('change', e=>{
  const file=e.target.files[0];
  if(file && file.type.startsWith('image/')){
    const url=URL.createObjectURL(file);
    const img=document.querySelector('.immagine');
    img.src=url;
  }
});

// 4) ESPORTA & INVIA SU WHATSAPP
btnExport.addEventListener("click",async()=>{
  btnExport.disabled=true;
  const canvas=await html2canvas(editor,{scale:2});
  canvas.toBlob(blob=>{
    const file=new File([blob],"giornalino.png",{type:"image/png"});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({title:"Giornalino",text:"Ecco il nuovo numero!",files:[file]});
    }else{
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url; a.download="giornalino.png"; a.click();
      const msg=encodeURIComponent("Ecco il nuovo numero del giornalino! 🗞");
      window.open(`https://wa.me/?text=${msg}`,"_blank");
    }
    btnExport.disabled=false;
  },"image/png",0.9);
});