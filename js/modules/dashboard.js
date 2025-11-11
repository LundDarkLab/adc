import { bsAlert } from "../components/bsComponents.js";
import { cutString } from "../helpers/utils.js";
import { artifactIssues } from "../components/artifact_issues.js";
import { artifactList } from "../components/artifactComponents.js";
import { modelList } from "../components/modelComponents.js";
import { initFilters } from "../components/dashboard_filters.js";
import { initMap, addLayers, refreshClusters } from "../modules/initMaps.js";
import { openPopUp } from "../components/mapsComponent.js";

const userId = parseInt(document.getElementById('user').value);
const userRole = parseInt(document.getElementById('role').value);
const userInstitution = parseInt(document.getElementById('institution').value);
const isLoggedUser = userId && userId !== 'unregistered' && !isNaN(Number(userId));
export let map = null;
export async function initDashboard() {
  await initFilters();
  setDefaultFilters();
  applyFilters('artifact');
  applyFilters('model');
  map = await initMap('mapWrap');
  await addLayers(map, { 
    layers: { findplace: true, institutions: true},
    onClickCallback: {
      findplace: (item) => openPopUp(item, true),
      institutions: institutionPopUp,
    }
  });
}
function institutionPopUp(item) {
  let content = '<div class="institution-popup">';
  content += '<h5>Institution Details</h5>';
  content += '<ul>';
  for (const [key, value] of Object.entries(item)) {
    if (value !== null && value !== undefined && value !== '') {
      content += `<li><strong>${key}:</strong> ${value}</li>`;
    }
  }
  content += '</ul>';
  content += '</div>';
  return content;
}
function setDefaultFilters() {
  document.getElementById('artifactByPerson').value = userId;
  document.getElementById('modelByPerson').value = userId;
}

async function getArtifacts(filters={}){
  const artifactDataWrap = document.getElementById('artifactDataWrap');
  const artifactStatusCount = document.getElementById('artifactStatusCount');
  const artifacts = await artifactList(filters);
  artifactDataWrap.innerHTML = '';
  artifactStatusCount.textContent = artifacts.length;
  
  if(artifacts.length === 0){
    artifactDataWrap.innerHTML = '<p class="text-center">No artifacts found with the selected filters.</p>';
    return;
  }
  
  const columnOrder = ['name', 'description', 'institution', 'author', 'last_update', 'id'];
  const table = document.createElement('table');
  table.classList.add('table', 'table-striped', 'table-sm');
  const thead = document.createElement('thead');
  thead.classList.add('table-light');
  const headerRow = document.createElement('tr');
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  columnOrder.forEach(key => {
    const th = document.createElement('th');
    th.textContent = key === 'id' ? '#' : key;
    headerRow.appendChild(th);
  });

  artifacts.forEach(artifact => {
    const row = document.createElement('tr');
    columnOrder.forEach(key => {
      const cell = document.createElement('td');
      if(key === 'id'){
        const link = document.createElement('a');
        link.href = `artifact_view.php?item=${artifact[key]}`;
        link.textContent = 'View';
        cell.appendChild(link);
      } else {
        cell.textContent = artifact[key] || `No ${key}`;
      }
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  artifactDataWrap.appendChild(table);
}

async function getModels(filters={}){
  const modelDataWrap = document.getElementById('modelDataWrap');
  const modelStatusCount = document.getElementById('modelStatusCount');
  const models = await modelList(filters);
  modelDataWrap.innerHTML = '';
  modelStatusCount.textContent = models.length;
  if(models.length === 0){
    const emptyMessage = document.createElement('p');
    emptyMessage.classList.add('text-center', 'empty-models-message');
    emptyMessage.textContent = 'No models found with the selected filters.';
    modelDataWrap.appendChild(emptyMessage);
    return;
  }
  console.log(models[0]);
  
  models.forEach(model => {
    const card = document.createElement('div');
    card.classList.add('card');
    modelDataWrap.appendChild(card);

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    cardHeader.style.height = '150px';
    card.appendChild(cardHeader);

    const img = document.createElement('img');
    img.src = `archive/thumb/${model.thumbnail}`;
    img.classList.add('card-img-top', 'h-100', 'w-100', 'object-fit-contain');
    img.alt = `Thumbnail of ${model.name}`;
    cardHeader.appendChild(img);

    const cardBody = document.createElement('ul');
    cardBody.classList.add('card-body', 'list-group', 'list-group-flush');
    card.appendChild(cardBody);

    const description = document.createElement('li');
    description.classList.add('list-group-item');
    let descriptionTxt = '<span class="fw-bold d-block">Description:</span> ';
    if(model.description.length > 50){
      description.innerHTML = descriptionTxt + `<span>${cutString(model.description, 50)}</span>`;
      description.classList.add('pointer');
      description.dataset.bsToggle = 'tooltip';
      description.title = model.description;
    } else {
      description.innerHTML = descriptionTxt + `<span>${model.description}</span>`;
    }
    cardBody.appendChild(description);

    const owner = document.createElement('li');
    owner.classList.add('list-group-item');
    owner.innerHTML = `<span class="fw-bold d-block">Institution:</span><span>${model.owner}</span>`;
    cardBody.appendChild(owner);

    const author = document.createElement('li');
    author.classList.add('list-group-item');
    author.innerHTML = `<span class="fw-bold d-block">Author:</span><span>${model.author}</span>`;
    cardBody.appendChild(author);

    const lastUpdate = document.createElement('li');
    lastUpdate.classList.add('list-group-item');
    lastUpdate.innerHTML = `<span class="fw-bold d-block">Last update:</span><span>${model.last_update}</span>`;
    cardBody.appendChild(lastUpdate);

    const cardFooter = document.createElement('div');
    cardFooter.classList.add('card-footer');
    card.appendChild(cardFooter);

    const viewLink = document.createElement('a');
    viewLink.href = `model_view.php?item=${model.id}`;
    viewLink.classList.add('btn', 'btn-sm', 'btn-adc-blue', 'd-block');
    viewLink.textContent = 'view Model';
    cardFooter.appendChild(viewLink);
  });
}

async function getInstitutions(filters={}) {
  // Placeholder for future use
}

async function getPersons(filters={}) {
  // Placeholder for future use
}

export function applyFilters(element){
  const filters = {
    status: parseInt(document.getElementById(`${element}Status`).value),
    owner: parseInt(document.getElementById(`${element}ByInstitution`).value),
    author: parseInt(document.getElementById(`${element}ByPerson`).value),
    description: document.getElementById(`${element}ByDescription`).value.trim()
  };
  if(element === 'model'){filters.to_connect = parseInt(document.getElementById(`${element}ToConnect`).value );}
  Object.keys(filters).forEach(key => {
    if(!filters[key]) {delete filters[key];}
  });    
  if(element === 'artifact'){
    getArtifacts(filters);
  } else if(element === 'model'){
    getModels(filters);
  }
}
