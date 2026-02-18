import { bsAlert } from "../../../components/bsComponents.js";
import { institutionsList } from "../../../modules/institution.js";
import { listPositions } from "../../../helpers/personHelper.js";
import { roleList } from "../../../helpers/userHelper.js";
import { handleFormSubmit } from '../../../shared/utils/handleFormSubmit.js';



export async function initAddPage(){
  const list = {
    "institution":await institutionsList(),
    "position":await listPositions(),
    "role":await roleList()
  }
  buildList(list);
  initListener();
  saveForm();
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
    const label = !createAccount ? 'create Account' : 'do not create account';
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
    action: 'savePerson',
    resetOnSuccess: false,
    beforeSubmit: async (data) => {
      console.log(data);
      return false;
    },
    onSuccess: (result) => {
      console.log('Person created:', result);
      const bsClass = result.data.error === 0 ? 'success' : 'danger';
      bsAlert(result.data.output, bsClass, 3000, () => {window.location.href = 'dashboard.php'});
    },
    onError: (error) => {
      console.error('Error creating person:', error);
      bsAlert(error,'danger', 5000);  
    }
  });
}

