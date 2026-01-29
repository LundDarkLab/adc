import { basePath } from "../../../helpers/utils.js";
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

export const pathToImage = basePath() + 'archive/image/';
export function openModal(img){
  const modal = document.getElementById("fullScreenImg");
  const closeBtn = document.getElementById("closeFullScreenImage");

  populateModal(img);

  modal.classList.add('is-active');
  document.body.classList.add('no-scroll');
  
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) { closeModal(); }
  });  
}

export function populateModal(img){
  const imgFull = document.getElementById("modalImg");
  const downloadBtn = document.getElementById("downloadImg");

  imgFull.src = pathToImage + img.path;
  document.getElementById("imageFileName").textContent = img.path;
  document.getElementById("imageDescriptionText").textContent = img.text || 'No description available';
  const licenseLink = document.getElementById("licenseLink");
  licenseLink.textContent = img.license + " (" + img.acronym + ")";
  licenseLink.href = img.link;
  
  if(img.downloadable === 1) {
    downloadBtn.classList.remove('d-none');
  } else {
    downloadBtn.classList.add('d-none');
  }

  if(downloadBtn){
    downloadBtn.addEventListener('click', () => {  
      const imgPath = pathToImage + img.path;
      const licensePath = basePath() + 'assets/license/' + img.deed;
      downloadZip(img.artifact, imgPath, licensePath); 
    });
  }
}

async function downloadZip(artifactId, imgPath, licensePath){
  const zip = new JSZip();
  const fileName = `DC${artifactId}_image`;
  
  try {
    // Scarica l'immagine
    const imageResponse = await fetch(imgPath);
    const imageBlob = await imageResponse.blob();
    zip.file(`${fileName}.jpg`, imageBlob);
    
    // Scarica la licenza
    const licenseResponse = await fetch(licensePath);
    const licenseText = await licenseResponse.text();
    zip.file("license.txt", licenseText);
    
    // Genera lo zip
    const blob = await zip.generateAsync({ type: "blob" });
    
    // Download usando l'API nativa del browser
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Errore nella creazione dello zip:", error);
  }
}

function closeModal(){
  const modal = document.getElementById("fullScreenImg");
  modal.classList.remove('is-active');
  document.body.classList.remove('no-scroll');
}