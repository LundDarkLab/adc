import { showLoading } from "./helpers/helper.js";
import { initSetUp } from './helpers/artifactHelper.js';
import { artifactMap } from "./components/artifactComponents.js";
import { collectionState } from "./modules/collectionStorage.js";
import { initModel, resizeCanvas } from "./3dhop_function.js";
import { confirmAction } from "./helpers/helper.js";
import { bsAlert } from "./components/bsComponents.js";
import { deleteArtifact } from "./features/artifact/api/deleteArtifact.js";

const stateManager = await collectionState();

const domEl = {
  mainContent: document.getElementById('mainContent'),
  divStatus: document.getElementById('status'),
  artifactId: document.getElementById('artifactId'),
  activeUsr: document.getElementById('activeUsr'),
  role: document.getElementById('role'),
  btInstitutionFilter: document.getElementById('btInstitutionFilter'),
  btWidescreen: document.getElementById('btWidescreen'),
  lineChartContainer: document.getElementById('lineChart'),
  columnChartContainer: document.getElementById('columnChart'),
}

document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true);
  const artifactData = await initSetUp(domEl);
  if(artifactData.model) { initModel(artifactData.model); }
  initListener(artifactData);
  showLoading(false);
});

function initListener(artifactData){
  if(domEl.btWidescreen){
    domEl.btWidescreen.addEventListener('click', () => {
      domEl.mainContent.classList.toggle('expanded');
      domEl.mainContent.offsetWidth; 
      artifactMap(artifactData);
      resizeCanvas();
    });
  }

  if(domEl.btInstitutionFilter){
    domEl.btInstitutionFilter.addEventListener('click', (ev) => {
      const institutionId = ev.currentTarget.dataset.institutionId;
      stateManager.resetAll();
      const currentState = stateManager.getState();
      stateManager.updateState({
        searchFilters: {
          ...currentState.searchFilters,
          currentFilter: {
            ...currentState.searchFilters.currentFilter,
            byInstitution: institutionId
          }
        }
      });
      window.location.href = 'index.php';
    });
  }

  document.getElementById('delete').addEventListener('click', async () => {
    await confirmAction(
      'Are you sure you want to delete this artifact? This action cannot be undone.',
      async () => { 
        const response = await deleteArtifact(domEl.artifactId.value);
        if (response.error === 1) {
          bsAlert(response.message, 'danger');
        } else {
          bsAlert(response.data.message, 'success', 3000, () => {
            window.location.href = 'dashboard.php';
          });
        }
      }
    )
  });
}