import { institutionsList } from "../modules/institution.js";
import { usersList } from "../modules/user.js";
import { listPositions } from "../helpers/personHelper.js";
import { roleList } from "../helpers/userHelper.js";

export async function initFilters() {
  await Promise.all([
    populatePersonSelect('artifact'),
    populatePersonSelect('model'),
    populateInstitutionSelect('artifact'),
    populateInstitutionSelect('model'),
    populateInstitutionCategorySelect(),
    populateInstitutionProvinceSelect(),
    populatePersonRolesSelect(),
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

}
async function populateInstitutionProvinceSelect(){}
async function populatePersonRolesSelect(){
  const position = await listPositions();
  const positionSelect = document.getElementById('personByPosition');
  positionSelect.innerHTML = '<option value="">All positions</option>';
  position.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.value;
    positionSelect.appendChild(option);
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
  
  