import { checkName, allowUploadNxz } from '../utils/helpers.js';
import { uploadNxz } from '../utils/uploadNxz.js';
import { buildModelLists } from '../components/modelSelect.js';

export async function initAddPage(){
  checkName();
  await buildModelLists();
  allowUploadNxz();

  const nxz = document.getElementById('nxz'); 
  nxz .addEventListener('change', uploadNxz);
  
  // // DOI validation
  // const doiInput = document.getElementById('doi');
  // const doiPattern = /^10\.5281\/zenodo\.\d+$/;
  
  // if (doiInput) {
  //   doiInput.addEventListener('input', function() {
  //     const doi = this.value.trim();
  //     if (doi && !doiPattern.test(doi)) {
  //       this.setCustomValidity('Invalid Zenodo DOI format. Expected: 10.5281/zenodo.XXXXXXX');
  //     } else {
  //       this.setCustomValidity('');
  //     }
  //   });
  // }

  // const form = document.querySelector('form[name="newModelForm"]');
  // if (form) {
  //   form.addEventListener('submit', function(e) {
  //     if (!form.checkValidity()) {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       form.reportValidity();
  //     }
  //   }, true);
  // }
}