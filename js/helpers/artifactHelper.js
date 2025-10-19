import { bsAlert } from "../components/bsComponents.js";
import { setStatusAlert, createAccordionItem, artifactMap } from "../components/artifactComponents.js";

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