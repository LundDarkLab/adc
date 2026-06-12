import { bsAlert } from "../components/bsComponents.js";
import { setStatusAlert, createAccordionItem, artifactMap, createMediaTab, lineChart, columnChart } from "../components/artifactComponents.js";
import { getDateString } from "../helpers/utils.js";

export async function initSetUp(domEl) {
  if(!domEl || !Object.keys(domEl).length) {
    console.error('DOM elements not provided for initialization.');
    return false;
  }

  if(!domEl.artifactId || isNaN(domEl.artifactId.value)){
    console.error('Invalid or not provided artifact ID');
    return false;
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
    lineChart(artifactMetadata.data.artifact.category_class_id, artifactMetadata.data.artifact.category_class, domEl.lineChartContainer);
    columnChart(artifactMetadata.data.artifact.category_class_id, artifactMetadata.data.artifact.category_class, domEl.columnChartContainer);

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
  const fullScreenTitle = document.getElementById("fullScreenTitle");
  const fullScreenImg = document.getElementById("fullScreenImg");
  const fullImageDescription = document.getElementById("imageDescriptionText");
  const modalImg = document.getElementById("modalImg");
  const licenseLink = document.getElementById("licenseLink");
  const closeFullScreenImage = document.getElementById("closeFullScreenImage");

  
  fullScreenImg.style.display = 'flex';
  fullScreenTitle.textContent = img.path || 'Artifact Image';
  modalImg.src = imgPath;
  fullImageDescription.textContent = img.text || 'No description available';
  licenseLink.textContent = img.license + " (" + img.acronym + ")";
  licenseLink.href = img.link;
  downloadImg.style.display = img.downloadable ? 'block' : 'none';
  downloadImg.addEventListener('click', function(){ downloadZip(img.artifact, imgPath, licensePath); });
  closeFullScreenImage.addEventListener('click', function(){
    fullScreenImg.style.display = 'none';
    modalImg.src = "";
    licenseLink.textContent = '';
    licenseLink.href = '';
  });
}

export async function deleteMedia(id,file){
  const body = { class: 'File', action: 'deleteMedia', id: id }
  if(file){body.file = file}
  try {
    const result = await fetchApi({ url: ENDPOINT, body });
    if(result.error === 1){
      throw new Error(result.message || "Error deleting media");
    }
    bsAlert(result.output || "Media deleted successfully", 'success');
    return true;
  } catch (error) {
    bsAlert(`Error fetching Artifact informations: ${error}`, 'danger');
    return false;
  }
}

export async function downloadZip(artifact, imagePath, licensePath) {
  const zip = new window.JSZip();
  const dateString = getDateString().slice(0,3).join('');
  let license = '';
  let image = '';
  const imageExtension = imagePath.split('.').pop() || 'jpg';
  const imageFileName = `artifact_image.${imageExtension}`;
  try {
    const response = await fetch(licensePath);
    license = await response.text();
    zip.file("LICENSE.txt", license);
  } catch (error) {
    console.error(`Failed to load ${basePath}assets/license/CC_BY_4.0.txt template:`, error);
  }
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    image = arrayBuffer;
    zip.file("image.jpg", image);
  } catch (error) {
    console.error(`Failed to load image from ${imagePath}:`, error);
  }
  const content = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  const url = URL.createObjectURL(content);
  a.href = url;
  a.download = `${dateString}_dynColl_${artifact}.zip`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
  return true;
}