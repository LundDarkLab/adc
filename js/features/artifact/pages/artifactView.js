import { getArtifactById } from "../api/artifactApi.js";
import { artifactViewAccordion } from "../components/artifactViewAccordion.js";
import { initListener } from "../utils/artifactViewListener.js";
import { initViewPageMap } from "../components/artifactViewMap.js";
import { initMedia } from "../components/artifactViewMedia.js";

export async function initViewPage() {
  const artifactId = new URLSearchParams(window.location.search).get('item');
  if (!artifactId) {
    console.error('Artifact ID is missing in the URL');
    return;
  }

  let artifactData;
  try {
    artifactData = await getArtifactById(artifactId);
    console.log('Artifact Data:', artifactData);
  } catch (error) {
    console.error('Error fetching artifact data:', error);
    return;
  }

  await Promise.all([
    setAlertStatus(artifactData.data.artifact.status, artifactData.data.artifact.status_id),
    Promise.resolve(artifactViewAccordion(artifactData.data)),
    Promise.resolve(initViewPageMap(artifactData.data.artifact_findplace)),
    Promise.resolve(initMedia(artifactData.data.media || {})),
    Promise.resolve(initListener())
  ]);
}




function setAlertStatus(statusText, statusId) {
  const alert = document.getElementById('status')
  alert.textContent = statusText;
  alert.classList.add(statusId === 1 ? 'alert-danger' : 'alert-success');
  return Promise.resolve();
}