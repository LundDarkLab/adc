import { bsAlert } from "../../../components/bsComponents.js";

let materialTechniqueArray = [];

export function handleMaterialTechnique(ev) {
  if (ev) {
    ev.preventDefault();
  }
  
  const materialEl = document.getElementById('material');
  const techniqueEl = document.getElementById('technique');
  const matTechArrayEl = document.getElementById('matTechArray');

  if (!materialEl || !techniqueEl || !matTechArrayEl) {
    console.error('Required elements not found');
    return false;
  }

  const m = parseInt(materialEl.value);
  const matTxt = materialEl.options[materialEl.selectedIndex]?.textContent;
  const t = techniqueEl.value || null;

  if (!m || isNaN(m)) {
    bsAlert("You must select a material from list at least", 'warning', 3000);
    return false;
  }

  const checkM = materialTechniqueArray.some(item => item.m === m);
  if (checkM) {
    bsAlert("The value " + matTxt + " is already in the list", 'warning', 3000);
    return false;
  }

  materialTechniqueArray.push({m, t});
  materialEl.value = '';
  techniqueEl.value = '';

  const row = document.createElement('div');
  row.className = 'row wrapfield mb-3';

  const matDiv = document.createElement('div');
  matDiv.className = 'material';

  const techDiv = document.createElement('div');
  techDiv.className = 'technique';

  const matInput = document.createElement('input');
  matInput.className = 'form-control';
  matInput.type = 'text';
  matInput.readOnly = true;
  matInput.value = matTxt;

  const iptGrp = document.createElement('div');
  iptGrp.className = 'input-group';

  const techInput = document.createElement('input');
  techInput.className = 'form-control';
  techInput.type = 'text';
  techInput.readOnly = true;
  techInput.value = t || '';

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-danger';
  delBtn.type = 'button';
  delBtn.name = 'delRow';
  delBtn.title = 'delete row';
  delBtn.setAttribute('data-bs-toggle', 'tooltip');
  delBtn.innerHTML = '<span class="mdi mdi-trash-can"></span>';

  let tooltipInstance = null;
  // Inizializza tooltip
  try {
    if (typeof bootstrap !== 'undefined') {
      tooltipInstance = new bootstrap.Tooltip(delBtn);
    }
  } catch (error) {
    console.error('Error initializing tooltip for delBtn:', error);
  }

  delBtn.addEventListener('click', function() {
    if (tooltipInstance) { tooltipInstance.dispose(); }
    const rows = Array.from(matTechArrayEl.querySelectorAll('.row.wrapfield'));
    const idx = rows.indexOf(row);
    if (idx > -1) {
      materialTechniqueArray.splice(idx, 1);
    }
    row.remove();
  });

  // Assembla gli elementi
  matDiv.appendChild(matInput);
  iptGrp.appendChild(techInput);
  iptGrp.appendChild(delBtn);
  techDiv.appendChild(iptGrp);
  row.appendChild(matDiv);
  row.appendChild(techDiv);
  matTechArrayEl.appendChild(row);


  return true;
}


export function getMaterialTechniqueArray() {
  return materialTechniqueArray;
}

export function clearMaterialTechniqueArray() {
  materialTechniqueArray = [];
  const matTechArrayEl = document.getElementById('matTechArray');
  if (matTechArrayEl) {
    matTechArrayEl.innerHTML = '';
  }
}
