import { getArtifactById } from "../api/artifactApi.js";
import { artifactViewAccordion } from "../components/artifactViewAccordion.js";
import { initListener } from "../utils/artifactViewListener.js";

export async function initViewPage() {
  const artifactId = new URLSearchParams(window.location.search).get('item');
  if (!artifactId) {
    console.error('Artifact ID is missing in the URL');
    return;
  }

  try {
    const artifactData = await getArtifactById(artifactId);
    console.log('Artifact Data:', artifactData);
    setAlertStatus(artifactData.data.artifact.status, artifactData.data.artifact.status_id);
    artifactViewAccordion(artifactData.data);
  } catch (error) {
    console.error('Error fetching artifact data:', error);
  }
  initListener();
}

function setAlertStatus(statusText, statusId) {
  const alert = document.getElementById('status')
  alert.textContent = statusText;
  alert.classList.add(statusId === 1 ? 'alert-danger' : 'alert-success');
}