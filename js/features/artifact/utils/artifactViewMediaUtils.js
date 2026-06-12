import { confirmAction } from "../../../helpers/helper.js";
import { basePath } from "../../../helpers/utils.js";
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
import { deleteArtifactMediaApi } from "../api/artifactMediaApi.js";
import { bsAlert } from "../../../components/bsComponents.js";
import { checkLogged } from "../../../shared/utils/checkLoggedUtils.js";

const { isLogged: _isLogged, userId: _uid, userRole: _role, userInstitution: _inst } = checkLogged;
const isLogged = _isLogged === 'true';
const userId = parseInt(_uid);
const userRole = parseInt(_role);
const userInstitution = parseInt(_inst);

export const path = basePath() + 'archive';
export const dir = {
  image: `${path}/image/`,
  document: `${path}/document/`,
  video: `${path}/video/`,
  reference: `${path}/reference/`,
}

export function openModal(img, meta){
  const modal = document.getElementById("fullScreenImg");
  const closeBtn = document.getElementById("closeFullScreenImage");
  closeBtn.addEventListener('click', closeModal);

  populateModal(img, meta);
  document.body.classList.add('no-scroll');

  modal.classList.add('is-active');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) { closeModal(); }
  });  
}

export function populateModal(img, meta){
  const imgFull = document.getElementById("modalImg");
  const downloadBtn = document.getElementById("downloadImg");
  const editImgBtn = document.getElementById("editImg");
  const deleteImgBtn = document.getElementById("deleteImg");

  imgFull.src = dir.image + img.path;
  document.getElementById("imageFileName").textContent = img.path;
  document.getElementById("imageDescriptionText").textContent = img.text || 'No description available';
  const licenseLink = document.getElementById("licenseLink");
  const imageUrlText = document.getElementById("imageUrlText");
  if(img.url === null) {
    imageUrlText.textContent = '';
    imageUrlText.removeAttribute('href');
  } else {
    imageUrlText.textContent = img.url;
    imageUrlText.href = img.url;
  }
  licenseLink.textContent = img.license + " (" + img.acronym + ")";
  licenseLink.href = img.link;
  
  if(img.downloadable === 1) {
    downloadBtn.classList.remove('d-none');
  } else {
    downloadBtn.classList.add('d-none');
  }

  if(downloadBtn){
    const freshDownloadBtn = downloadBtn.cloneNode(true);
    downloadBtn.replaceWith(freshDownloadBtn);
    freshDownloadBtn.addEventListener('click', () => {
      const imgPath = dir.image + img.path;
      const licensePath = basePath() + 'assets/license/' + img.deed;
      downloadZip(img.artifact, imgPath, licensePath);
    });
  }

  
  const canEdit = isLogged && (
    userId === parseInt(meta.author) ||
    userRole === 1 ||
    (userInstitution === parseInt(meta.owner) && userRole < 3)
  );
  
  if(editImgBtn){
    editImgBtn.classList.toggle('d-none', !canEdit);
    if (canEdit){ 
      editImgBtn.href = `media_edit.php?media=${img.file}`;
    }
  }

  if(deleteImgBtn){
    deleteImgBtn.classList.toggle('d-none', !canEdit);
    if (canEdit){
      const freshDeleteBtn = deleteImgBtn.cloneNode(true);
      deleteImgBtn.replaceWith(freshDeleteBtn);
      freshDeleteBtn.addEventListener('click', async () => {
        await deleteMedia(img);
      });
    }
  }
}

export async function deleteMedia(media){
  await confirmAction(
    `Are you sure you want to delete this ${media.type}? This action cannot be undone.`,
    async () => { 
      try {
        const response = await deleteArtifactMediaApi(media);
        if (response.error === 1 || response.data?.error === 1) { 
          throw new Error(response.message || response.data?.message || 'Unknown error');
        }
        console.log("response", response.data.output);
        bsAlert(response.data?.message ?? 'Media deleted successfully', 'success', 3000, () => { window.location.reload(); });
      } catch (error) {
        console.error('Error deleting media:', error);
        bsAlert(`An error occurred while deleting the media: ${error.message}`, 'danger');
      }
    }
  )
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
    a.remove();
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