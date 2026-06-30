export function initPasswordUI(ids = {}) {
  const {
    togglePwd    = 'toggle-pwd',
    togglePwdIco = 'toggle-pwd-ico',
    genPwd       = 'gen-pwd',
    newPwd       = 'new_password',
    confirmPwd   = 'confirm_password',
    barId        = 'password-strength',
    textId       = 'score-text',
    pwdMatch     = 'pwd-match',
  } = ids;

  const toggleEl = document.getElementById(togglePwd);
  if (toggleEl) {
    toggleEl.addEventListener('click', e => {
      const isChecked = e.currentTarget.checked;
      document.querySelectorAll('.pwd').forEach(el => {
        el.type = isChecked ? 'text' : 'password';
      });
      const icon = document.getElementById(togglePwdIco);
      if(icon){
        icon.classList.toggle('mdi-eye',    !isChecked);
        icon.classList.toggle('mdi-eye-off', isChecked);
      }
    });
  }

  document.querySelectorAll('input[type="password"]').forEach(el => blockSpaces(el));

  const newPwdEl = document.getElementById(newPwd);
  const confirmPwdEl = document.getElementById(confirmPwd);
  const barEl  = document.getElementById(barId);
  const textEl = document.getElementById(textId);
  const pwdMatchEl = document.getElementById(pwdMatch);

  if (newPwdEl && barEl && textEl) {
    initStrengthMeter(newPwdEl, barEl, textEl, pwdMatchEl);
  }

  if (pwdMatchEl) {
    newPwdEl?.addEventListener('input', () => checkMatch(newPwdEl, confirmPwdEl, pwdMatchEl));
    confirmPwdEl?.addEventListener('input', () => checkMatch(newPwdEl, confirmPwdEl, pwdMatchEl));
  }

  const genPwdEl = document.getElementById(genPwd);
  genPwdEl?.addEventListener('click', () => {
    const pwdGenerated = generatePwd();
    if (newPwdEl) {
      newPwdEl.value = pwdGenerated;
      newPwdEl.dispatchEvent(new Event('input'));
    }
    if (confirmPwdEl) {
      confirmPwdEl.value = pwdGenerated;
      confirmPwdEl.dispatchEvent(new Event('input'));
    }
  });
}

function checkMatch(newPwdEl, confirmPwdEl, pwdMatchEl) {
  pwdMatchEl.classList.remove('text-danger', 'text-success');
  if (!confirmPwdEl?.value) {
    pwdMatchEl.innerText = '';
    return;
  }
  const match = newPwdEl.value === confirmPwdEl.value;
  pwdMatchEl.innerText = match ? 'Passwords match' : 'Passwords do not match';
  pwdMatchEl.classList.add(match ? 'text-success' : 'text-danger');
}

function generatePwd() {
  const length = 16;
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers   = '0123456789';
  const special   = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  const all       = lowercase + uppercase + numbers + special;

  const randChar = charset => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return charset[arr[0] % charset.length];
  };

  const chars = [
    randChar(lowercase),
    randChar(uppercase),
    randChar(numbers),
    randChar(special),
    ...Array.from({ length: length - 4 }, () => randChar(all)),
  ];

  // Fisher-Yates shuffle
  const rnd = new Uint32Array(chars.length);
  crypto.getRandomValues(rnd);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

function blockSpaces(el) {
  el.addEventListener('keydown', e => {
    if (e.key === ' ') e.preventDefault();
  });
  el.addEventListener('paste', e => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\s/g, '');
    const { selectionStart: s, selectionEnd: end, value } = e.target;
    e.target.value = value.slice(0, s) + pasted + value.slice(end);
    e.target.setSelectionRange(s + pasted.length, s + pasted.length);
    e.target.dispatchEvent(new Event('input'));
  });
}

function initStrengthMeter(input, bar, text, pwdMatchEl) {
  const rules = [
    { id: 'rule-length',  test: v => v.length >= 10 },
    { id: 'rule-upper',   test: v => /[A-Z]/.test(v) },
    { id: 'rule-number',  test: v => /\d/.test(v) },
    { id: 'rule-special', test: v => /[^a-zA-Z0-9\s]/.test(v) },
  ];

  function resetUI() {
    rules.forEach(({ id }) => document.getElementById(id)?.classList.remove('text-success'));
    for (let i = 0; i <= 4; i++) bar.classList.remove(`strength-${i}`);
    bar.value = 0;
    text.innerText = '';
    if (pwdMatchEl) pwdMatchEl.innerText = '';
  }

  input.addEventListener('input', () => {
    const val = input.value;

    if (!val || /\s/.test(val)) {
      resetUI();
      return;
    }

    for (let i = 0; i <= 4; i++) bar.classList.remove(`strength-${i}`);

    let allMet = true;
    rules.forEach(({ id, test }) => {
      const ok = test(val);
      document.getElementById(id)?.classList.toggle('text-success', ok);
      if (!ok) allMet = false;
    });

    if (!allMet) {
      bar.value = 0;
      text.innerText = '';
      return;
    }

    const score = zxcvbn(val).score;
    bar.value = score * 25;
    bar.classList.add(`strength-${score}`);
    text.innerText = getPwdMsg(score);
  });
}

function getPwdMsg(score) {
  switch (score) {
    case 0: return 'too weak';
    case 1: return 'very weak';
    case 2: return 'moderately weak';
    case 3: return 'fairly strong';
    case 4: return 'very strong';
    default: return '';
  }
}
