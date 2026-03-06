import { checkName, allowUploadNxz } from '../utils/helpers.js';
import { uploadNxz } from '../utils/uploadNxz.js';
import { buildModelLists } from '../components/modelSelect.js';
import { thumbnailBlob } from '../../../3dhop_function.js';
import { handleFormSubmit } from '../../../shared/utils/handleFormSubmit.js';
import { bsAlert } from '../../../components/bsComponents.js';


export async function initAddPage(){
  const form = document.getElementById('newModelForm');
  const nxz = document.getElementById('nxz');
  const doiInput = document.getElementById('doi');
  
  try {
    checkName();
  } catch(e) { console.error('checkName failed:', e); }

  try {
    await buildModelLists();
  } catch(e) { console.error('buildModelLists failed:', e); }

  try {
    allowUploadNxz();
  } catch(e) { console.error('allowUploadNxz failed:', e); }

  try {
    doiInput.addEventListener('input', doiValidation);
    nxz.addEventListener('change', uploadNxz);
  } catch(e) { console.error('event listeners failed:', e); }

  try {
    handleFormSubmit(form, {
      class: 'Model',
      action: 'saveModel',
      useFormData: true,
      resetOnSuccess: false,
      customValidation: () => {
        return checkFiles();
      },
      beforeSubmit: async (data) => {
        if (nxz && nxz.files.length > 0 && !data.has('nxz')) {
          data.append('object', nxz.files[0]);
        }
        if (thumbnailBlob) { 
          const baseName = nxz.files[0].name.replace(/\.[^/.]+$/, "");
          data.append('thumbnail', thumbnailBlob, `${baseName}.png`); 
        }
        return data;
      },
      onSuccess: (result) => {
        if (result.data.error === 0) {
          bsAlert(result.data.output, 'success', 3000, () => {window.location.href = 'dashboard.php';});
        }else{
          bsAlert(result.data.output,'danger', 5000);
        }
      },
      onError: (error) => {
        console.error('Error creating model:', error);
      }
    });
  } catch(e) { console.error('handleFormSubmit failed:', e); }
}

function checkFiles(){
  if(!nxz.files || nxz.files.length === 0){
    bsAlert('Please select a valid model file from your computer', 'danger');
    return false;
  }
  if(thumbnailBlob === null){
    bsAlert('Please take a screenshot and upload it before saving', 'danger');
    return false;
  }
  return true;
}

function doiValidation(){
  // // DOI validation
  const doiPattern = /^https:\/\/doi\.org\/10\.5281\/zenodo\.\d+$/;
  const doiError = document.getElementById('doiError');

  if (doiInput) {
      const doi = doiInput.value.trim();
      if (doi && !doiPattern.test(doi)) {
        doiError.textContent = 'Invalid Zenodo DOI format. Expected: 10.5281/zenodo.XXXXXXX';
        doiError.classList.remove('d-none');
        doiInput.classList.add('is-invalid');
        return false
      }

      doiError.textContent = '';
      doiError.classList.add('d-none');
      doiInput.classList.remove('is-invalid');
      return true;
  }
}