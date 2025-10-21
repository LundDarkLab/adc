import { bsAlert } from "../components/bsComponents.js";
import { setStatusAlert, createAccordionItem, artifactMap, createMediaTab } from "../components/artifactComponents.js";

export async function initSetUp(domEl) {
  if(!domEl || !Object.keys(domEl).length) {
    console.error('DOM elements not provided for initialization.');
    return false;
  }

  if(!domEl.artifactId || isNaN(domEl.artifactId.value)){
    console.error('Invalid or not provided artifact ID');
    return false;
  }
  
  if(isNaN(domEl.activeUsr?.value) || domEl.activeUsr?.value === 'unregistered') {
    domEl.btSaveModelParam.remove();
  }

  try {
    const artifactMetadata = await getArtifact(domEl.artifactId.value)
    if (artifactMetadata.error === 1 || !artifactMetadata || typeof artifactMetadata !== 'object' || Object.keys(artifactMetadata).length === 0) { throw new Error("Error fetching metadata");}
    setStatusAlert(domEl.divStatus, artifactMetadata.data.artifact.status, artifactMetadata.data.artifact.status_id);
    createAccordionItem(artifactMetadata.data);
    artifactMap(artifactMetadata.data);
    if(artifactMetadata.data.media && artifactMetadata.data.media.length > 0) {
      createMediaTab(artifactMetadata.data.media);
    }

    return artifactMetadata.data;
  } catch (error) {
    bsAlert(`Error fetching artifact metadata: ${error}`, 'danger');
  }
}

export async function getArtifact(id){
  const body = { class: 'Artifact', action: 'getArtifact', id: id }
  try {
    const result = await fetchApi({ url: ENDPOINT, body });
    return result;
  } catch (error) {
    bsAlert(`Error fetching Artifact informations: ${error}`, 'danger');
  }
}

export function fullImage(img){
  let imgPath = `../../archive/image/${img.path}`;
  let licensePath = `../../assets/license/${img.deed}`;
  const downloadImg = document.getElementById("downloadImg");
  const fullScreenImg = document.getElementById("fullScreenImg");
  const modalImg = document.getElementById("modalImg");
  const licenseLink = document.getElementById("licenseLink");
  const closeFullScreenImage = document.getElementById("closeFullScreenImage");

  downloadImg.style.display = img.downloadable ? 'block' : 'none';

  // Simulate fadeIn with transition
  fullScreenImg.style.display = 'flex';
  fullScreenImg.style.opacity = '0';
  fullScreenImg.style.transition = 'opacity 0.2s';

  setTimeout(() => {
    fullScreenImg.style.opacity = '1';
    // Execute callback after fadeIn
    setTimeout(() => {
      modalImg.src = imgPath;
      licenseLink.textContent = img.license + " (" + img.acronym + ")";
      licenseLink.href = img.link;
      downloadImg.addEventListener('click', function(){ downloadZip(imgPath, licensePath); });
      closeFullScreenImage.addEventListener('click', function(){
        // Simulate fadeOut
        fullScreenImg.style.opacity = '0';
        setTimeout(() => {
          fullScreenImg.style.display = 'none';
          modalImg.src = "";
          licenseLink.textContent = '';
          licenseLink.href = '';
        }, 200);
      });
    }, 200);
  }, 0);
}

export async function deleteMedia(id,file){
  const body = { class: 'File', action: 'deleteMedia', id: id }
  if(file){body.file = file}
  try {
    const result = await fetchApi({ url: ENDPOINT, body });
    console.log(result);
    
    if(result.error === 1){
      throw new Error(result.message || "Error deleting media");
    }
    bsAlert(result.output || "Media deleted successfully", 'success');
    return true;
  } catch (error) {
    bsAlert(`Error fetching Artifact informations: ${error}`, 'danger');
  }
}