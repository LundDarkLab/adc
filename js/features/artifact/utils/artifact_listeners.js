import { bsAlert, bsModal} from "../../../components/bsComponents.js";
import { handleCategorySpecOptions } from '../api/getArtifactSelect.js';
import { handleBoundariesChange, levelOptions } from '../components/adminLevelSelect.js';
import { resetMapValue } from '../components/artifactMapComponent.js';
import { toggleTimeAccordion, closeAllAccordions } from '../../../shared/components/timeline/utils/toggleAccordion.js';
import { handleMaterialTechnique, getMaterialTechniqueArray, clearMaterialTechniqueArray } from "../components/materialTechniqueComponent.js";
import { handleFormSubmit } from '../../../shared/utils/handleFormSubmit.js';

const opt ={
  'artifact_add': {
    form: '#newArtifactForm',
    action: 'addArtifact',
    onSuccessTitle: 'Artifact Created with ID ',
    buttons: [
      { text: 'go to artifact', class: 'btn-primary', action: 'go' },
      { text: 'create another', class: 'btn-secondary', action: 'reload' },
      { text: 'close', class: 'btn-secondary', action: 'back' }
    ]
  },
  'artifact_edit': {
    form: '#editArtifactForm',
    action: 'editArtifact',
    onSuccessTitle: 'Artifact updated ',
    buttons: [
      { text: 'continue to edit', class: 'btn-secondary', action: 'close' },
      { text: 'back to dashboard', class: 'btn-secondary', action: 'back' }
    ]
  }
}

export async function initEventListeners(page, mapElement) {
  console.log(opt[page].action);
  
  document.getElementById('category_class').addEventListener('change', setCategorySpecs);
  document.getElementById('confirmMaterial').addEventListener('click', handleMaterialTechnique);
  document.querySelectorAll(".boundsBtn").forEach(btn => { btn.addEventListener('click', handleBoundsClick); })
  document.addEventListener('click', closeAllAccordions);
  document.querySelectorAll('.gadm').forEach(item => { item.addEventListener('change', (e) => handleGadmChange(e, mapElement)); });
  document.getElementById('resetMapValueBtn').addEventListener('click', (e) => { resetMapValue(mapElement); });

  handleFormSubmit(opt[page].form, {
    class: 'Artifact',
    action: opt[page].action,
    resetOnSuccess: false,
    formOptions: { includeEmpty: page === 'artifact_edit' },
    customValidation: (_form) => {
      const materials = getMaterialTechniqueArray();
      if (materials.length === 0) {
        bsAlert('You must add at least one material', 'warning', 3000);
        return false;
      }
      return true;
    },
    beforeSubmit: (data) => {
      data.artifact_material_technique = getMaterialTechniqueArray();
      if (window.pageType === 'artifact_edit') {
        const urlParams = new URLSearchParams(window.location.search);
        data.artifact.artifact = urlParams.get('item');
      }
      console.log(data);
      
      return data;
    },
    onSuccess: (result) => {
      console.log('Artifact created:', result);
      if (result.error === 0) {
        bsModal({
          title: opt[page].onSuccessTitle + result.data.id ,
          body: result.data.message,
          buttons: opt[page].buttons,
          size: 'modal-md'
        }).then(action => {
          if (action === 'go') {
            window.location.href = `artifact_view.php?item=${result.data.id}`;
          } else if (action === 'reload') {
            location.reload();
          } else if (action === 'back') {
            window.location.href = 'dashboard.php';
          } else if (action === 'close') {
            // do nothing
          }
        });
        clearMaterialTechniqueArray();
      }
    },
    onError: (error) => {
      console.error('Error creating artifact:', error);
      bsAlert('An error occurred while creating the artifact. Please try again.', 'danger', 5000);
    } 
  });
}

export function handleGadmChange(ev, mapElement, reset = true){
  const gid = parseInt(ev.currentTarget.id.split('_')[1]);
  const value = ev.currentTarget.value;
  
  if (value === '') {
    handleBoundariesChange(mapElement.map, gid);
  } else {
    handleBoundariesChange(mapElement.map, gid + 1);
    levelOptions(gid, value);
  }
  if (reset) {
    resetMapValue(mapElement);
  }
}

function handleBoundsClick(ev){
  const btn = ev.currentTarget;
  const i = btn.querySelector('i');
  const icon = i?.id || btn.id || 'defaultIcon';
  const wrap = btn.dataset.accordionWrap;
  if (wrap) {
    toggleTimeAccordion(icon, wrap);
  }
}

async function setCategorySpecs(ev){
  const cat = ev.currentTarget.value;
  const selectEl = document.getElementById('category_specs');
  const noSpecsMessage = document.getElementById('noSpecsMessage');
  if (!Number.isInteger(Number(cat))) {
    selectEl.innerHTML = '';
    selectEl.disabled = true;
    bsAlert('Please select a valid category class', 'danger', 3000);
    return;
  }
  const list = await handleCategorySpecOptions(cat);
  if (list.length === 0) {
    selectEl.innerHTML = '';
    selectEl.disabled = true;
    noSpecsMessage.classList.remove('d-none');
    return;
  }
  noSpecsMessage.classList.add('d-none');
  selectEl.disabled = false;
  selectEl.innerHTML = '';
  const option = document.createElement("option");
  option.value = '';
  option.textContent = '-- select value --';
  selectEl.appendChild(option);
  list.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.value;
    selectEl.appendChild(option);
  });
  return true;
}