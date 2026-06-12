import { getArtifactById } from "../api/artifactApi.js";
import { artifactViewAccordion } from "../components/artifactViewAccordion.js";
import { applyOrientationClass, initListener } from "../utils/artifactViewListener.js";
import { initViewPageMap } from "../components/artifactViewMap.js";
import { initMedia } from "../components/artifactViewMedia.js";
import { initModel } from "../../../3dhop_function.js";
import { initArtifactStats } from "../components/artifactChart.js"; 

export async function initViewPage() {
  const artifactId = new URLSearchParams(window.location.search).get('item');
  if (!artifactId) {
    console.error('Artifact ID is missing in the URL');
    return;
  }

  let artifactData;
  try {
    artifactData = await getArtifactById(artifactId);
  } catch (error) {
    console.error('Error fetching artifact data:', error);
    return;
  }
  
  const { artifact, media, model, artifact_findplace } = artifactData.data;
  applyOrientationClass();

  await Promise.all([
    setAlertStatus(artifact.status, artifact.status_id),
    artifactViewAccordion(artifactData.data),
    initViewPageMap(artifact_findplace),
    media ? initMedia(media, { author: artifact.author, owner: artifact.owner }) : Promise.resolve(),
    model ? initModel(model) : noModel(artifactId),
    initArtifactStats(artifact.category_class_id, artifact.category_class)
  ]);
  initListener(artifactData.data);
  if (model.model.doi) { 
    setDOILink(model.model.doi);
  } else {
    document.getElementById("artifactDoiFieldset")?.remove();
  }
}

async function noModel(artifactId) {
  const _3dhop = document.getElementById('3dhop');
  if (_3dhop) {
    _3dhop.innerHTML = '';
    _3dhop.classList.add('d-flex', 'justify-content-center', 'align-items-center', 'flex-column', 'p-5');
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger ';
    alertDiv.innerHTML = `
      <h4 class="alert-heading">No 3D model available for this artifact.</h4>
      <p>Connect an available model by clicking the button below.</p>
      <a href="models.php?item=${artifactId}" id="addModelBtn" class="btn btn-danger">Add 3D Model</a>
    `;
    _3dhop.appendChild(alertDiv);
  }
}

function setDOILink(doi) {
  const artifactDOILink = document.getElementById("doiBtn");
  if (artifactDOILink) {
    artifactDOILink.setAttribute('href', doi);
    artifactDOILink.classList.remove('d-none');
  } else {
    console.error('DOI button not found in the DOM');
  }
}



function setAlertStatus(statusText, statusId) {
  const alert = document.getElementById('status')
  alert.textContent = statusText;
  alert.classList.add(statusId === 1 ? 'alert-danger' : 'alert-success');
  return Promise.resolve();
}