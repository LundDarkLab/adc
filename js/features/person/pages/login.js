import { login, rescuePwd, checkAdmin } from "../api/personApi.js";
import { initPasswordUI } from "../../../components/password.js";

export async function initPage() {
  await setAdmin();
  initPasswordUI();

  document.querySelectorAll('.toggleRescueBtn').forEach(btn => {
    btn.addEventListener('click', toggleRescueDiv);
  });

  initLoginForm();
  initRescuePwdForm();
}

async function setAdmin() {
  let adminExists;
  try {
    adminExists = await checkAdmin();
  } catch (error) {
    console.error('Error checking admin:', error);
    return;
  }
  if (adminExists.error === 1) {
    console.error('server error checking admin');
    return;
  }
  if (adminExists.data === 0) {
    localStorage.setItem("addAdmin", 'true');
    window.location.href = "addUser.php";
  } else if (localStorage.getItem("addAdmin")) {
    localStorage.removeItem('addAdmin');
  }
}

function toggleRescueDiv() {
  const loginCard = document.getElementById("loginCard");
  const rescuePwdCard = document.getElementById("rescuePwdCard");
  if (!loginCard || !rescuePwdCard) return;
  loginCard.classList.toggle('d-none');
  rescuePwdCard.classList.toggle('d-none');
  if (rescuePwdCard.classList.contains('d-none')) {
    const form = document.querySelector('form[name="rescuePwd"]');
    form?.reset();
    setOutput(form?.querySelector('.outputMsg'), '', '');
  }
}

function initLoginForm() {
  const form = document.querySelector('form[name="login"]');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const outputMsg = form.querySelector('.outputMsg');
    const btn = form.querySelector('[type="submit"]');
    const originalText = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }
    setOutput(outputMsg, '', '');
    try {
      const result = await login(
        document.getElementById('email').value,
        document.getElementById('password').value
      );
      const ok = result?.data?.res === 0;
      const msg = result?.data?.output ?? (ok ? 'Login successful' : 'Login failed');
      setOutput(outputMsg, msg, ok ? 'text-success' : 'text-danger');
      if (ok) setTimeout(() => { location.href = 'dashboard.php'; }, 2000);
    } catch (err) {
      setOutput(outputMsg, err.message ?? 'Login failed', 'text-danger');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = originalText; }
    }
  });
}

function initRescuePwdForm() {
  const form = document.querySelector('form[name="rescuePwd"]');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const outputMsg = form.querySelector('.outputMsg');
    const btn = form.querySelector('[type="submit"]');
    const originalText = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    setOutput(outputMsg, '', '');
    try {
      const result = await rescuePwd(document.getElementById('email4Rescue').value);
      const ok = result?.data?.res === 0;
      const msg = result?.data?.output ?? (ok ? 'Email sent' : 'An error occurred');
      setOutput(outputMsg, msg, ok ? 'text-success' : 'text-danger');
    } catch (err) {
      setOutput(outputMsg, err.message ?? 'An error occurred', 'text-danger');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = originalText; }
    }
  });
}

function setOutput(el, msg, colorClass) {
  if (!el) return;
  el.className = 'outputMsg my-3';
  if (colorClass) el.classList.add(colorClass);
  el.innerHTML = msg;
}
