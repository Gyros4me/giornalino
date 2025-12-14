// 1) REGISTRA SERVICE-WORKER
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");

// 2) DRAG-&-DROP BASICO (opzionale, ma comodo)
const editor=document.getElementById("editor");
editor.addEventListener("dragover",e=>e.preventDefault());
editor.addEventListener("drop",e=>{
  e.preventDefault();
  const file=e.dataTransfer.files[0];
  if(file && file.type.startsWith("image/")){
    const url=URL.createObjectURL(file);
    const img=document.createElement("img");
    img.src=url; img.className="blocco immagine";
    editor.querySelector(".grid").appendChild(img);
  }
});

// 3) ESPORTA & INVIA SU WHATSAPP
btnExport.addEventListener("click",async()=>{
  btnExport.disabled=true;
  const canvas=await html2canvas(editor,{scale:2}); // retina
  canvas.toBlob(blob=>{
    // 3-a) crea oggetto File
    const file=new File([blob],"giornalino.png",{type:"image/png"});
    // 3-b) se il device supporta Web Share + file
    if(navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({
        title:"Giornalino",
        text:"Ecco il nuovo numero!",
        files:[file]
      });
    }else{
      // 3-c) fallback: scarica + apri WhatsApp Web con testo pre-impostato
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url; a.download="giornalino.png"; a.click();
      // apri WhatsApp con prefilled text
      const msg=encodeURIComponent("Ecco il nuovo numero del giornalino! 🗞");
      window.open(`https://wa.me/?text=${msg}`,"_blank");
    }
    btnExport.disabled=false;
  },"image/png",0.9);
});