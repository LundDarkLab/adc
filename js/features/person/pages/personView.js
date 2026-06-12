import { getPersonData } from "../api/personApi.js";
import { canShow } from "../../../shared/utils/checkLoggedUtils.js";
import { renderNoUserDiv, renderUserCard } from "../components/userCard.js";
import { renderModelCard } from "../components/userModelCard.js";
import { renderArtifactCard } from "../components/userArtifactCard.js";

const personId = new URLSearchParams(window.location.search).get('item');

export async function initPersonViewPage() {
  if (!personId) {
    console.error('Person ID is missing in the URL');
    return;
  }

  const personData = await getPersonData(personId);
  if (!personData?.data || personData.data.length === 0) {
    console.error('No person data found for ID:', personId);
    return;
  }

  const person = personData.data[0];

  const canView = canShow(person.user_id, person.institution_id);
  if(canView){ createEditButton(); }

  setNameField(person.name);
  buildPersonSection(person);

  const hasUser = !!person.user_id;

  
  if(hasUser){
    renderUserCard(person);
    renderArtifactCard(person.user_id);
    renderModelCard(person.user_id);
  }else{
    renderNoUserDiv(person.name);
  }
}



function createEditButton() {
  const itemtTool = document.getElementById('itemTool')
  if (!itemtTool) {
    console.error('Item tool element not found');
    return;
  }
  const editButton = document.createElement('a');
  editButton.classList.add('btn', 'btn-sm', 'btn-light');
  editButton.innerHTML = '<i class="mdi mdi-pencil"></i> edit profile';
  editButton.href = `person_edit.php?item=${personId}`;
  itemtTool.appendChild(editButton);
}

function buildPersonSection(person) {
  const personCard = document.getElementById('personCard');
  if (!personCard) {
    console.error('Person card element not found');
    return;
  }
  personCard.querySelector('#institution').textContent = person.institution || 'Not available';
  personCard.querySelector('#position').textContent = person.position || 'Not available';
}

function setNameField(name) {
  const nameField = document.getElementById('titleSection');
  if (nameField) { nameField.textContent = name; }
}