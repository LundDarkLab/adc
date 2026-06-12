import { cutStringByWords } from "../../../helpers/utils.js";
import { fetchApi } from "../../../shared/utils/fetch.js";

const container = document.getElementById('artifactsCard');
export async function renderArtifactCard(author) {
  const payload = {
    class: 'Artifact',
    action: 'artifactsByAuthor',
    author: author
  };
  try {
    const response = await fetchApi({body:payload});
    if(response?.error === 1 || response?.data.error === 1){
      throw new Error("Error fetching artifacts: " + response.message);
    }
    console.log(response.data.artifacts.length);
    
    if(response?.data?.artifacts?.length === 0){
      renderNoArtifactCard();
      return;
    }
    const artifacts = response.data.artifacts;
    const title = document.createElement('h5');
    title.classList.add('p-3','m-0', 'bg-light', 'border','border-bottom-0', 'rounded-top');
    title.innerHTML = `Artifacts created <span class="badge text-bg-dark float-end">${artifacts.length}</span>`;
    container.appendChild(title); 

    const artifactsWrap = document.createElement('div');
    artifactsWrap.id = 'artifactsWrap';
    artifactsWrap.classList.add('p-3', 'border', 'objWrap');
    container.appendChild(artifactsWrap);
    
    artifacts.forEach(artifact => {
      const artifactCard = document.createElement('div');
      artifactCard.classList.add('card');
      const statusColor = artifact.status === 1 ? 'warning' : 'success';
      const statusText = artifact.status === 1 ? 'Draft' : 'Published';
      const description = cutStringByWords(artifact.description, 30);
      artifactCard.innerHTML = `
        <div class="card-header text-bg-${statusColor}">
          <h6 class="m-0 card-title">${artifact.name}</h6>
          <small class="card-subtitle">${statusText}</small>
        </div>
        <div class="card-body p-0">
          <ul class="list-group list-group-flush">
            <li class="list-group-item">
              <small class="d-block fw-bold">Description</small>
              <small class="card-text">${description}</small>
            </li>
          </ul>
        </div>
        <div class="card-footer">
          <a href="artifact_view.php?item=${artifact.id}" class="btn btn-sm btn-adc-blue">View Artifact</a>
        </div>
      `;
      artifactsWrap.appendChild(artifactCard);
    });
  } catch (error) {
    bsAlert("Error fetching artifacts: " + error.message, "danger");
    logger.error("Error fetching artifacts for author " + author + ": " + error);
  }
}

function renderNoArtifactCard() {
  if (!container) {
    console.error('Artifacts container element not found');
    return;
  }
  container.innerHTML = `<div id="noArtifacts" class="alert alert-info">No artifacts created by user</div>`;
}