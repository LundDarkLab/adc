import { bsAlert } from "../../../components/bsComponents.js";
import { institutionsList } from "../../../modules/institution.js";
import { listPositions } from "../../../helpers/personHelper.js";
import { roleList } from "../../../helpers/userHelper.js";
import { handleFormSubmit } from '../../../shared/utils/handleFormSubmit.js';
import { getPersonData } from "../api/personApi.js";

const personId = new URLSearchParams(window.location.search).get('item');

export async function initPersonEditPage(){
  const list = {
    "institution":await institutionsList(),
    "position":await listPositions(),
    "role":await roleList()
  }
  buildList(list);
  initListener();
  saveForm();

  if(!personId){
    const msg = 'No person ID provided, initializing form for new person';
    console.error(msg);
    bsAlert(msg, 'danger', 5000);
    return;
  }
  const personData = await getPersonData(personId);
  if (!personData?.data || personData.data.length === 0) {
    console.error('No person data found for ID:', personId);
    return;
  }
  const person = personData.data[0];
  // console.log(person);

  fillForm(person);
}

function fillForm(person){
  document.getElementById('personName').textContent=person.name;
  document.getElementById('first_name').value = person.first_name;
  document.getElementById('last_name').value = person.last_name;
  document.getElementById('email').value = person.email;
  document.getElementById('institution').value = person.institution_id;
  document.getElementById('position').value = person.position_id;
  toggleUserFields(person);
}

function toggleUserFields(person){
  console.log(person.role_id);
  
  const hasAccount = person.role_id !== null;
  const roleSelect = document.getElementById('role');
  const isActive = document.getElementById('is_active');

  document.getElementById('createAccountWrap').classList.toggle('d-none', hasAccount);

  roleSelect.disabled = !hasAccount;
  roleSelect.required = hasAccount;
  isActive.disabled = !hasAccount;
  isActive.required = hasAccount;

  if(hasAccount){
    roleSelect.value = person.role_id;
    isActive.value = person.active;
  }
}

function buildList(list){
  for(const key in list){
    const select = document.getElementById(key);
    list[key].forEach(i => {
      const option = document.createElement('option');
      option.value = i.id;
      option.textContent = i.name || i.value;
      select.appendChild(option);
    });
  }
}

function initListener(){
  const createAccountLabel = document.getElementById('createAccountLabel');
  const createAccountBtn = document.getElementById('createAccount');
  const roleSelect = document.getElementById('role');
  const isActive = document.getElementById('is_active');

  createAccountBtn.addEventListener('click', () => {
    const createAccount = createAccountBtn.checked;
    const label = createAccount ? 'do not create account' : 'create Account';
    createAccountLabel.textContent = label;
    roleSelect.disabled = !createAccount;
    roleSelect.required = createAccount;
    isActive.disabled = !createAccount;
    isActive.required = createAccount;
  });
}

function saveForm(){
  const form = document.getElementById('personForm');
  handleFormSubmit(form, {
    class: 'Person',
    action: 'updatePerson',
    resetOnSuccess: false,
    beforeSubmit: async (data) => {
      data.person.id = personId;
      return data;
    },
    onSuccess: (result) => {
      console.log('Person updated:', result);
      const bsClass = result.data.res === 0 ? 'success' : 'danger';
      bsAlert(result.data.output, bsClass, 3000, () => {window.location.href = 'dashboard.php'});
    },
    onError: (error) => {
      console.error('Error creating person:', error);
      bsAlert(error,'danger', 5000);  
    }
  });
}

