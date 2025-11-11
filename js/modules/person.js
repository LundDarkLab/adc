import { bsAlert } from "../components/bsComponents.js";
import { showLoading } from "../helpers/helper.js";
import { institutionsList } from "./institution.js";
import { listPositions } from "../helpers/personHelper.js";
import { roleList } from "../helpers/userHelper.js";

document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true);
  const personId = document.getElementById('personId').value;
  const roleSelect = document.getElementById('role');
  const isActiveCheckbox = document.getElementById('is_active');
  if(personId){
    document.getElementById('title').textContent = 'Edit Person';
  } else {
    document.getElementById('title').textContent = 'Create New Person';
  }
  const inst = await institutionsList();
  const position = await listPositions();
  const roles = await roleList();

  inst.forEach(i => {
    const option = document.createElement('option');
    option.value = i.id;
    option.textContent = i.name;
    document.getElementById('institution').appendChild(option);
  });

  position.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.value;
    document.getElementById('position').appendChild(option);
  });

  roles.forEach(r => {
    const option = document.createElement('option');
    option.value = r.id;
    option.textContent = r.value;
    roleSelect.appendChild(option);
  });
  
  const createAccountBtn = document.getElementById('createAccount');
  createAccountBtn.addEventListener('click', () => {
    const createAccount = createAccountBtn.checked;
    roleSelect.disabled = !createAccount;
    isActiveCheckbox.disabled = !createAccount;
  });


  showLoading(false)
});