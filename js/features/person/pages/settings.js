import { bsAlert } from "../../../components/bsComponents.js";
import { getPersonFromUser, getInstitutions } from "../api/personApi.js";
import { listPositions } from "../../../helpers/personHelper.js";
import { initPasswordUI } from "../../../components/password.js";

export async function initPage(){
  const userIdInput = document.getElementById('userId');
  const userId = userIdInput.value;

  const [userData, institutions, positions] = await Promise.all([
    getPersonFromUser(userId),
    getInstitutions(),
    listPositions()
  ]);

  if(userData.error === 1 || userData.data.length === 0){
    bsAlert('error fetching user info', 'danger', 5000);
    console.error('error fetching user info');
    return;
  }
  compileForm(userData.data[0], institutions, positions);
  initPasswordUI();
}

function compileForm(data, institutions, positions){
  const firstNameInput = document.getElementById('first_name');
  if(!firstNameInput){
    console.error('first_name element not found');
    return;
  }

  const lastNameInput = document.getElementById('last_name');
  const emailInput = document.getElementById('email');

  firstNameInput.value = data.first_name ?? '';
  if(lastNameInput) lastNameInput.value = data.last_name ?? '';
  if(emailInput) emailInput.value = data.email ?? '';

  const institutionSelect = document.getElementById('institution');
  if(institutionSelect){
    institutions.forEach(inst => {
      institutionSelect.add(new Option(inst.name, inst.id, false, inst.id == data.institution_id));
    });
  }

  const positionSelect = document.getElementById('position');
  if(positionSelect){
    positions.forEach(pos => {
      positionSelect.add(new Option(pos.value, pos.id, false, pos.id == data.position_id));
    });
  }
}