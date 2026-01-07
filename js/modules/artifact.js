import { artifactSelect, handleCategorySpecOptions } from "../components/artifact/artifact_select.js";
import { bsAlert } from "../components/bsComponents.js";

const usr = document.getElementById('usr').value;
let materialTechniqueArray = []

export async function getArtifactSelectOptions(){
  const lists = await artifactSelect();
  lists.forEach(item=>{
    const key = Object.keys(item)[0];
    const selectEl = document.getElementById(key);
    if(selectEl){
      item[key].forEach(optionData=>{
        const option = document.createElement("option");
        option.value = optionData.id;
        option.textContent = optionData.value || optionData.name || optionData.definition || optionData.license;
        if(key==='author' && optionData.id == Number(usr)){ option.selected = true; }
        selectEl.appendChild(option);
      });
    }
  });
  return true;
}

export async function getCategorySpecs(cat){
  const selectEl = document.getElementById('category_specs');
  
  if (!Number.isInteger(Number(cat))) {
    selectEl.innerHTML = '';
    selectEl.disabled = true;
    return;
  }
  
  const list = await handleCategorySpecOptions(cat);
  
  if (list.length === 0) {
    selectEl.innerHTML = '';
    selectEl.disabled = true;
    bsAlert('No specifications available', 'danger', 3000);
    return;
  }
  
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

export function handleMaterialTechnique(){
  const materialEl = document.getElementById('material');
  const techniqueEl = document.getElementById('technique');
  const matTechArrayEl = document.getElementById('matTechArray');

  const m = parseInt(materialEl.value);
  const matTxt = materialEl.options[materialEl.selectedIndex].textContent;
  const t = techniqueEl.value || null;

  if (!m) {
    bsAlert("You must select a material from list at least", 'warning', 3000);
    return false;
  }

  const checkM = materialTechniqueArray.some(item => item.m == m);
  if (checkM) {
    bsAlert("The value " + matTxt + " is already in the list", 'warning', 3000);
    return false;
  }

  materialTechniqueArray.push({m, t});
  materialEl.value = '';
  techniqueEl.value = '';

  let row = document.createElement('div');
  row.className = 'row wrapfield mb-3';
  matTechArrayEl.appendChild(row);

  let matDiv = document.createElement('div');
  matDiv.className = 'material';
  row.appendChild(matDiv);

  let techDiv = document.createElement('div');
  techDiv.className = 'technique';
  row.appendChild(techDiv);

  let matInput = document.createElement('input');
  matInput.className = 'form-control';
  matInput.type = 'text';
  matInput.readOnly = true;
  matInput.value = matTxt;
  matDiv.appendChild(matInput);

  let iptGrp = document.createElement('div');
  iptGrp.className = 'input-group';
  techDiv.appendChild(iptGrp);

  let techInput = document.createElement('input');
  techInput.className = 'form-control';
  techInput.type = 'text';
  techInput.readOnly = true;
  techInput.value = t;
  iptGrp.appendChild(techInput);

  let delBtn = document.createElement('button');
  delBtn.className = 'btn btn-danger';
  delBtn.type = 'button';
  delBtn.name = 'delRow';
  delBtn.title = 'delete row';
  delBtn.setAttribute('data-bs-toggle', 'tooltip');
  delBtn.innerHTML = '<span class="mdi mdi-trash-can"></span>';
  iptGrp.appendChild(delBtn);

  try {
    new bootstrap.Tooltip(delBtn);
    console.log('Tooltip initialized for delBtn');
  } catch (error) {
    console.error('Error initializing tooltip for delBtn:', error);
  }

  delBtn.addEventListener('click', function(){
    let rows = Array.from(matTechArrayEl.querySelectorAll('.row'));
    let idx = rows.indexOf(row);
    materialTechniqueArray.splice(idx, 1);
    row.remove();
  });
  return true;
}