import { bsAlert } from "../../../components/bsComponents.js";
import { getPersonFromUser, getInstitutions, updatePersonInfo, updateAffiliation, updatePassword } from "../api/personApi.js";
import { listPositions } from "../../../helpers/personHelper.js";
import { initPasswordUI } from "../../../components/password.js";

export async function initPage() {
  const userId = document.getElementById('userId').value;

  const [userData, institutions, positions] = await Promise.all([
    getPersonFromUser(userId),
    getInstitutions(),
    listPositions()
  ]);

  if (userData.error === 1 || userData.data.length === 0) {
    bsAlert('error fetching user info', 'danger', 5000);
    console.error('error fetching user info');
    return;
  }
  const personId = userData.data[0].person_id;
  const userIdInt = userData.data[0].user_id;

  compileForm(userData.data[0], institutions, positions);
  initPasswordUI();

  initMainForm(personId);
  initAffiliationForm(personId);
  initPasswordForm(userIdInt);
}

function handleFormResponse(result) {
  const ok = result?.data?.res === 0;
  const msg = result?.data?.output ?? (ok ? 'Saved successfully' : 'An error occurred');
  if (ok) {
    bsAlert(msg, 'success', 3000, () => { window.location.href = 'dashboard.php'; });
  } else {
    bsAlert(msg, 'danger', 5000);
  }
}

function withSubmitLoading(form, fn) {
  const btn = form.querySelector('[type="submit"]');
  const originalText = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  fn().finally(() => {
    if (btn) { btn.disabled = false; btn.textContent = originalText; }
  });
}

function initMainForm(personId) {
  const form = document.getElementById('mainField');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    withSubmitLoading(form, async () => {
      try {
        const result = await updatePersonInfo(personId, {
          first_name: document.getElementById('first_name').value,
          last_name:  document.getElementById('last_name').value,
          email:      document.getElementById('email').value,
        });
        handleFormResponse(result);
      } catch (err) {
        bsAlert(err.message ?? 'Error saving personal info', 'danger', 5000);
      }
    });
  });
}

function initAffiliationForm(personId) {
  const form = document.getElementById('affiliationField');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    withSubmitLoading(form, async () => {
      try {
        const result = await updateAffiliation(personId, {
          institution: document.getElementById('institution').value,
          position:    document.getElementById('position').value,
        });
        handleFormResponse(result);
      } catch (err) {
        bsAlert(err.message ?? 'Error saving affiliation', 'danger', 5000);
      }
    });
  });
}

function initPasswordForm(userIdInt) {
  const form = document.getElementById('passwordField');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const newPwd     = document.getElementById('new_password').value;
    const confirmPwd = document.getElementById('confirm_password').value;
    if (newPwd !== confirmPwd) {
      bsAlert('Passwords do not match', 'danger', 4000);
      return;
    }
    withSubmitLoading(form, async () => {
      try {
        const result = await updatePassword(userIdInt, {
          current_password: document.getElementById('current_password').value,
          new_password:     newPwd,
        });
        handleFormResponse(result);
      } catch (err) {
        bsAlert(err.message ?? 'Error updating password', 'danger', 5000);
      }
    });
  });
}

function compileForm(data, institutions, positions) {
  const firstNameInput = document.getElementById('first_name');
  if (!firstNameInput) {
    console.error('first_name element not found');
    return;
  }

  const lastNameInput = document.getElementById('last_name');
  const emailInput    = document.getElementById('email');

  firstNameInput.value = data.first_name ?? '';
  if (lastNameInput) lastNameInput.value = data.last_name ?? '';
  if (emailInput)    emailInput.value    = data.email ?? '';

  const institutionSelect = document.getElementById('institution');
  if (institutionSelect) {
    institutions.forEach(inst => {
      institutionSelect.add(new Option(inst.name, inst.id, false, inst.id == data.institution_id));
    });
  }

  const positionSelect = document.getElementById('position');
  if (positionSelect) {
    positions.forEach(pos => {
      positionSelect.add(new Option(pos.value, pos.id, false, pos.id == data.position_id));
    });
  }
}
