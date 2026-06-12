import { institutionsList, institutionCategories, institutionLocations } from "../../modules/institution.js";
import { usersList } from "../../modules/user.js";
import { listPositions } from "../../helpers/personHelper.js";
import { roleList } from "../../helpers/userHelper.js";

export async function initFilters() {
  await Promise.all([
    populatePersonSelect('artifact'),
    populatePersonSelect('model'),
    populateInstitutionSelect('artifact'),
    populateInstitutionSelect('model'),
    populateInstitutionSelect('person'),
    populateInstitutionCategorySelect(),
    populateInstitutionLocationSelect(),
    populatePersonClassesSelect(),
  ]);
}

export async function populatePersonSelect(element, filters={}) {
  const users = await usersList(filters);
  const personSelect = document.getElementById(`${element}ByPerson`);
  personSelect.innerHTML = '<option value="">All authors</option>';
  users.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.dataset.institution = user.institution;
    option.textContent = `${user.name}`;
    personSelect.appendChild(option);
  });
}

async function populateInstitutionSelect(element){
  const institutions = await institutionsList();
  const institutionSelect = document.getElementById(`${element}ByInstitution`);
  institutionSelect.innerHTML = '<option value="">All institutions</option>';
  institutions.forEach(inst => {
    const option = document.createElement('option');
    option.value = inst.id;
    option.textContent = inst.name;
    institutionSelect.appendChild(option);
  });
}

async function populateInstitutionCategorySelect(){
  const categories = await institutionCategories();
  const categorySelect = document.getElementById('institutionByCategory');
  categorySelect.innerHTML = '<option value="">All categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.value;
    categorySelect.appendChild(option);
  });
}
async function populateInstitutionLocationSelect(){
  const locations = await institutionLocations();
  const locationSelect = document.getElementById('institutionByLocation');
  locationSelect.innerHTML = '<option value="">All locations</option>';
  locations.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc.OGR_FID;
    option.textContent = `${loc.district} (${loc.gid_0})`;
    locationSelect.appendChild(option);
  });
}

async function populatePersonClassesSelect(){
  const roles = await roleList();
  const roleSelect = document.getElementById('personByUserClass');
  roleSelect.innerHTML = '<option value="">All classes</option>';
  roles.forEach(r => {
    const option = document.createElement('option');
    option.value = r.id;
    option.textContent = r.value;
    roleSelect.appendChild(option);
  });
}
  
  