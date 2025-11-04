import { showLoading, loadScript } from "./helpers/helper.js";
import { initSetUp } from './helpers/artifactHelper.js';
import { artifactMap } from "./components/artifactComponents.js";
import { collectionState } from "./modules/collectionStorage.js";
import { initModel, resizeCanvas } from "./3dhop_function.js";

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
  showLoading(false);

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
});

