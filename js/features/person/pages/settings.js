import { bsAlert } from "../../../components/bsComponents.js";
import { getPersonFromUser, getInstitutions } from "../api/personApi.js";
import { listPositions } from "../../../helpers/personHelper.js";

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

  const pwdToggleBtn = document.getElementById('toggle-pwd');
  if(!pwdToggleBtn){
    console.error('toggle-pwd element not found');
    return;
  }
  pwdToggleBtn.addEventListener('click', (event) => {
    const isChecked = event.currentTarget.checked;
    pwdVisibility(isChecked);
  });

  compileForm(userData.data[0], institutions, positions);
  initPasswordStrength();
}

let zxcvbnPromise = null;

function loadZxcvbn() {
  if (window.zxcvbn) return Promise.resolve();
  if (zxcvbnPromise) return zxcvbnPromise;
  zxcvbnPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/zxcvbn@4.4.2/dist/zxcvbn.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return zxcvbnPromise;
}

function initPasswordStrength() {
  const input = document.getElementById('new_password');
  const bar = document.getElementById('password-strength');
  if (!input || !bar) return;

  const rules = [
    { id: 'rule-length',  test: v => v.length >= 10 },
    { id: 'rule-upper',   test: v => /[A-Z]/.test(v) },
    { id: 'rule-number',  test: v => /\d/.test(v) },
    { id: 'rule-special', test: v => /[^a-zA-Z0-9]/.test(v) },
  ];

  input.addEventListener('input', async () => {
    for (let i = 0; i <= 4; i++) bar.classList.remove(`strength-${i}`);

    const allMet = rules.every(({ id, test }) => {
      const ok = test(input.value);
      document.getElementById(id)?.classList.toggle('rule-ok', ok);
      return ok;
    });

    if (!input.value || !allMet) { bar.value = 0; return; }

    await loadZxcvbn();
    const score = window.zxcvbn(input.value).score;
    bar.value = score * 25;
    bar.classList.add(`strength-${score}`);
  });
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


function pwdVisibility(value){
  const pwdInputGroup = document.querySelectorAll(".pwd");
  pwdInputGroup.forEach( (input) => {
    input.type = value ? "text" : "password";
  })
}