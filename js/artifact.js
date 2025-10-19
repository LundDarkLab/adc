import { showLoading } from "./helpers/helper.js";
import { initSetUp } from './helpers/artifactHelper.js';
import { artifactMap } from "./components/artifactComponents.js";
import { collectionState } from "./modules/collectionStorage.js";

const stateManager = await collectionState();

const domEl = {
  mainContent: document.getElementById('mainContent'),
  divStatus: document.getElementById('status'),
  artifactId: document.getElementById('artifactId'),
  activeUsr: document.getElementById('activeUsr'),
  role: document.getElementById('role'),
  btWidescreen: document.getElementById('btWidescreen'),
  btSaveModelParam: document.getElementsByName('saveModelParam')[0],
  btParadata: document.getElementById('btParadata'),
  paradataModal: document.getElementById('paradata-modal'),
  btInstitutionFilter: document.getElementById('btInstitutionFilter'),
}

document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true);
  const artifactData = await initSetUp(domEl);
  showLoading(false);

  if(domEl.btWidescreen){
    domEl.btWidescreen.addEventListener('click', () => {
      domEl.mainContent.classList.toggle('expanded');
      setTimeout(function(){ artifactMap(artifactData) },100)
    });
  }
  
  if(domEl.btParadata){
    domEl.btParadata.addEventListener('click', () => {
      domEl.paradataModal.classList.toggle('hide');
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
    // Optionally, navigate to the gallery page or trigger a gallery update
    window.location.href = 'index.php'; // Assuming index.php is the gallery page
  });
}
});

