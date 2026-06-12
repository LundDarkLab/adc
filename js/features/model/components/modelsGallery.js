import { getUnusedModelsApi } from "../api/modelApi.js";
import { renderModelCards } from "../../../components/gallery/modelCard/modelCard.js";
import { sanitizeInput, debounce } from "../../../helpers/utils.js";



const modelFiltered = document.getElementById('modelFiltered');
const modelTotal = document.getElementById('modelTotal');
const authorSelect = document.getElementById('authorFilter');
const institutionSelect = document.getElementById('institutionFilter');
const nameInput = document.getElementById('nameFilter');
const descriptionInput = document.getElementById('descriptionFilter');

let models;

export async function modelsGallery(config) {
  const response = await getUnusedModelsApi();
  models = response.data;
  modelTotal.textContent = models.length;

  const container = document.querySelector('#modelsGallery .card-wrap');
  renderModelCards(container, models, config);
  galleryFilters(models, config);
}

function galleryFilters(models, config) {
  const authors = [
    ...new Set(models.map(model => model.author).filter(Boolean))
  ].sort((a, b) => a.localeCompare(b));
  const institutions = [
    ...new Set(models.map(model => model.institution).filter(Boolean))
  ].sort((a, b) => a.localeCompare(b));

  authors.forEach(author => {
    const option = document.createElement('option');
    option.value = author;
    option.textContent = author;
    authorSelect.appendChild(option);
  });

  institutions.forEach(inst => {
    const option = document.createElement('option');
    option.value = inst;
    option.textContent = inst;
    institutionSelect.appendChild(option);
  });

  initFiltersListeners(config);
}

function initFiltersListeners(config) {
  [authorSelect, institutionSelect].forEach(el => { el.addEventListener('change', () => applyFilters(config)); });
  [nameInput, descriptionInput].forEach(el => { 
    el.addEventListener('input', debounce(() => applyFilters(config), 300)); 
  });
}

function applyFilters(config) {
  const nameVal        = sanitizeInput(nameInput.value);
  const descriptionVal = sanitizeInput(descriptionInput.value);
  const authorVal      = authorSelect.value;
  const institutionVal = institutionSelect.value;

  // Per i testi: filtra solo se >= 3 caratteri, altrimenti ignora il filtro
  const nameActive = nameVal.length >= 3;
  const descriptionActive = descriptionVal.length >= 3;
  const filtered = models.filter(model => {
    const matchAuthor = authorVal === '' || model.author === authorVal;
    const matchInstitution = institutionVal === '' || model.institution === institutionVal;
    const matchName = !nameActive || model.name?.toLowerCase().includes(nameVal);
    const matchDescription = !descriptionActive || model.description?.toLowerCase().includes(descriptionVal);
    return matchAuthor && matchInstitution && matchName && matchDescription;
  });

  modelFiltered.textContent = filtered.length < models.length ? filtered.length : 0;

  const container = document.querySelector('#modelsGallery .card-wrap');
  renderModelCards(container, filtered, config);
}