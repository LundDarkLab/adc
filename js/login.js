const loginCard = document.getElementById("loginCard");
const rescuePwdCard = document.getElementById("rescuePwdCard");
const toggleRescue = document.getElementById("toggleRescue");
const toggleLogin = document.getElementById("toggleLogin");
const outputMsgSpinner = `<div class="d-flex justify-content-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;

document.addEventListener('DOMContentLoaded', function() {
  checkAdmin();
  currentPageActiveLink('login.php');


  loginCard.style.display = 'block';
  rescuePwdCard.style.display = 'none';

  toggleRescue.addEventListener('click', function() {
    fadeOut(loginCard, () => { fadeIn(rescuePwdCard); });
  });

  toggleLogin.addEventListener('click', function() {
    fadeOut(rescuePwdCard, () => { 
      fadeIn(loginCard); 
      document.querySelector("[name=email4Rescue]").value = '';
      outputMsg.innerHTML = '';
      outputMsg.className = outputMsg.className.replace(/text-\S+/g, '');
    });
  });

  document.getElementById("toggle-pwd").addEventListener('click', function() {
    const icon = this.querySelector('i');
    icon.classList.toggle("mdi-eye");
    icon.classList.toggle("mdi-eye-off");
    
    const input = document.querySelector(".pwd");
    const type = input.type === "password" ? "text" : "password";
    input.type = type;
  });

  document.querySelectorAll("[name=loginBtn]").forEach(btn => {
    btn.addEventListener('click', (e) => login(e));
  });

  document.querySelectorAll("[name=toggleRescue]").forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector("[name=email4Rescue]").value = '';
    });
  });

  document.querySelectorAll("[name=rescuePwdBtn]").forEach(btn => {
    btn.addEventListener('click', (e) => rescuePwd(e));
  });
});

async function login(el) {
  try {
    const form = document.querySelector("form[name=login]");
    const outputMsg = form.querySelector(".outputMsg");
    outputMsg.className = outputMsg.className.replace(/text-\S+/g, '');
    outputMsg.innerHTML = outputMsgSpinner;

    if (form.checkValidity()) {
      el.preventDefault();
      try {
        const data = await fetchApi({
          url: ENDPOINT,
          body: {
            class: 'User',
            action: 'login',
            email: document.querySelector("[name=email]").value,
            password: document.querySelector("[name=password]").value
          }
        });        
        outputMsg.classList.remove('text-success', 'text-danger');
        console.log(data);
        if (data.data.res === 1) {
          outputMsg.classList.add('text-danger');
          outputMsg.innerHTML = data.data.output;
        } else {
          outputMsg.classList.add('text-success');
          outputMsg.innerHTML = data.data.output + '<br>Redirecting to dashboard...';
          setTimeout(() => {
            location.href = "dashboard.php";
          }, 3000);
        }
      } catch (error) {
        console.log('Login failed:', error);
        outputMsg.innerHTML = error.message;
      }
    }
  } catch (error) {
    console.error('Error initializing login form:', error);
  }  
}

async function rescuePwd(el) {
  try {
    const form = document.querySelector("form[name=rescuePwd]");
    const outputMsg = form.querySelector(".outputMsg");
    outputMsg.className = outputMsg.className.replace(/text-\S+/g, '');
    outputMsg.innerHTML = outputMsgSpinner;
  
    if (form.checkValidity()) {
      el.preventDefault();
      try {
        const data = await fetchApi({
          url: ENDPOINT,
          body: {
            class : 'User',
            action : 'rescuePwd',
            email: document.querySelector("[name=email4Rescue]").value
          }
        });
        outputMsg.classList.remove('text-success', 'text-danger');
        console.log(data);
        if (data.data.error === 1) {
          outputMsg.classList.add('text-danger');
          outputMsg.innerHTML = data.data.output;
        } else {
          outputMsg.classList.add('text-success');
          outputMsg.innerHTML = data.data.output + '<br>Redirecting to home page...';
          setTimeout(() => { location.href = "login.php"; }, 3000);
        }
    } catch (error) {
      console.log("error: " + error.message);
      outputMsg.innerHTML = error.message;
    }
  }
  }catch (error) {
    console.error('Error initializing rescuePwd form:', error);
  }
}

async function checkAdmin() {
  try {
    const data = await fetchApi({
      url: ENDPOINT,
      method: 'POST',
      body: { class: 'User', action: 'checkAdmin' }
    });
    
    if (data == 0) {
      localStorage.setItem("addAdmin", 'true');
      window.location.href = "addUser.php";
    } else {
      if (localStorage.getItem("addAdmin")) {
        localStorage.removeItem('addAdmin');
      }
    }
  } catch (error) {
    console.error('Error checking admin:', error);
  }
}


function fadeIn(element, callback) {
  element.style.display = 'block';
  element.style.transition = 'opacity 0.5s ease';
  
  // Force reflow
  element.offsetHeight;
  
  element.style.opacity = 1;
  element.classList.remove('fade-hidden');
  
  setTimeout(() => {
    if (callback) callback();
  }, 500);
}

function fadeOut(element, callback) {
  element.style.transition = 'opacity 0.5s ease';
  element.style.opacity = 0;
  element.classList.add('fade-hidden');
  
  setTimeout(() => {
    element.style.display = 'none';
    if (callback) callback();
  }, 500);
}
