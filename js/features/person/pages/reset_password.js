import { initPasswordUI } from "../../../components/password.js";
import { checkToken, resetPassword } from "../api/personApi.js";
import { bsAlert } from "../../../components/bsComponents.js";

let _token = null;
let _email = null;

const tokenMessageDiv = document.getElementById('tokenMessage');

export async function initPage(){
  const token = new URLSearchParams(location.search).get('key');
  if (!token) {
    showMessage('Invalid link.', 'alert-danger');
    return;
  }
  tokenCheck(token);
}

function showMessage(msg, type){
  if(tokenMessageDiv){
    tokenMessageDiv.className = '';
    tokenMessageDiv.classList.add('alert', type);
    tokenMessageDiv.innerHTML = `<h5>${msg}</h5>`;
  }
}

async function tokenCheck(token){
  try {
    const check = await checkToken(token);
    console.log(check.data.output);
    
    if(check.error === 1){
      showMessage('Sorry, but your token is expired or invalid! Please try requesting a new password again', 'alert-danger');
      return;
    }
    _token = token;
    _email = check.data.output.email;
    showMessage('Token valid, you may now reset your password.', 'alert-success');
    setTimeout(renderForm, 3000);
  } catch (error) {
    showMessage(error.message, 'alert-danger');
    console.error(error.message);
  }
}

function renderForm(){
  tokenMessageDiv?.remove();
  const formContainer = document.getElementById('cardForm');
  const guideContainer = document.getElementById('cardGuide');
  if(!formContainer || !guideContainer){
    console.error('cardForm or cardGuide not found');
    return;
  }

  const cardForm = document.createElement('div');
  cardForm.className = 'card mb-4';
  formContainer.appendChild(cardForm);
  
  const cardFormHeader = document.createElement('h4');
  cardFormHeader.className='card-header text-center';
  cardFormHeader.innerText = 'Create a new password for your account.';
  cardForm.appendChild(cardFormHeader);

  const cardFormBody = document.createElement('div');
  cardFormBody.className = 'card-body';
  cardForm.appendChild(cardFormBody);

  const form = document.createElement('form');
  form.id = 'resetPwd';
  form.innerHTML = `
    <div class="mb-3">
      <label for="confirm_email" class="form-label">Confirm your email address</label>
      <input type="email" class="form-control" id="confirm_email" autocomplete="email" required>
    </div>
    <div class="mb-3">
      <label for="new_password" class="form-label">New password</label>
      <input type="password" class="form-control pwd" id="new_password" autocomplete="new-password" required>
      <progress id="password-strength" class="w-100 mt-1" value="0" max="100"></progress>
      <div id="score-text" class="form-text"></div>
    </div>
    <div class="mb-3">
      <label for="confirm_password" class="form-label">Confirm password</label>
      <input type="password" class="form-control pwd" id="confirm_password" autocomplete="new-password" required>
      <div id="pwd-match" class="form-text mt-1"></div>
    </div>
    <div id="reset-output" class="mb-3"></div>
    <div id="btn-container">
      <div class="btn-group" role="group" aria-label="Password actions">
        <input type="checkbox" class="btn-check" id="toggle-pwd" autocomplete="off">
        <label class="btn btn-outline-secondary" for="toggle-pwd">toggle password</label>
      
        <button type="button" class="btn btn-outline-secondary" id="gen-pwd">generate password</button>
      </div>
      <div>
        <button type="submit" class="btn btn-primary">Save password</button>
      </div>
    </div>
  `;
  cardFormBody.appendChild(form);
  initPasswordUI();
  form.addEventListener('submit', handleSubmit);

  const cardGuide = document.createElement('div');
  cardGuide.className = 'card mb-4';
  guideContainer.appendChild(cardGuide);
  
  const cardGuideHeader = document.createElement('h4');
  cardGuideHeader.className='card-header text-center';
  cardGuideHeader.innerText = 'Password Creation Rules';
  cardGuide.appendChild(cardGuideHeader);

  const cardGuideBody = document.createElement('div');
  cardGuideBody.className = 'card-body';
  cardGuide.appendChild(cardGuideBody);

  const passwordRules = document.createElement('ul');
  passwordRules.className='list-unstyled mb-3';
  passwordRules.innerHTML = `<li id="rule-length"><i class="mdi mdi-circle-small"></i> At least 10 characters</li>
  <li id="rule-upper"><i class="mdi mdi-circle-small"></i> One uppercase letter</li>
  <li id="rule-number"><i class="mdi mdi-circle-small"></i> One number</li>
  <li id="rule-special"><i class="mdi mdi-circle-small"></i> One special character</li>`;
  cardGuideBody.appendChild(passwordRules);
}

async function handleSubmit(e){
  e.preventDefault();
  const emailInput = document.getElementById('confirm_email').value.trim().toLowerCase();
  if(emailInput !== _email.toLowerCase()){
    bsAlert('Email address does not match. Please check and try again.', 'danger', 5000);
    return;
  }
  const pwd    = document.getElementById('new_password').value;
  const confirm = document.getElementById('confirm_password').value;
  if(pwd !== confirm){
    bsAlert('Passwords do not match.', 'danger', 5000);
    return;
  }
  try {
    const result = await resetPassword(_token, _email, pwd);
    if(result.data.error === 0){
      bsAlert(result.data.output, 'success', 3000, () => { window.location.href = 'index.php'; });
    } else {
      bsAlert(result.data.output, 'danger', 5000);
    }
  } catch(error) {
    bsAlert(error.message, 'danger', 5000);
  }
}
