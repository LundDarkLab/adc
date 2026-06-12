const form = document.getElementById('resetPwd');
const newPwd = document.getElementById("new_pwd");
const confPwd = document.getElementById("confirm_pwd")
const pwdStrength = document.getElementById("password-strength");
const pwdMsg = document.getElementById("pwdMsg");
const token = document.getElementById('token').value;
const toastToolBar = document.getElementById('toastBtn');
const togglePwd = document.getElementById("toggle-pwd");
const genPwd = document.getElementById("genPwd");
const resetPwdBtn = document.getElementById("resetPwdBtn");
const tokenExpiredDiv = document.getElementById("tokenExpired");
let email;


document.addEventListener('DOMContentLoaded', function() {
  checkToken(token);
  newPwd.addEventListener("input", getPwdStrength);
  togglePwd.addEventListener('click', () => {
    const icon = togglePwd.querySelector('i');
    icon.classList.toggle("mdi-eye");
    icon.classList.toggle("mdi-eye-off");
    
    const type = newPwd.type === "password" ? "text" : "password";
    newPwd.type = type;
    confPwd.type = type;
  });
  genPwd.addEventListener('click', generateRandomPassword);
  resetPwdBtn.addEventListener('click', (ev) => { resetPwd(ev);});
});

async function resetPwd(ev){
  checkPwd();
  try {
    if (form.checkValidity()) {
      ev.preventDefault();
      console.log("Resetting password for", email);
      const response = await fetchApi({
        url: ENDPOINT,
        body: {
          class: 'User',
          action: 'resetPassword',
          token: token,
          email: email,
          password_hash: newPwd.value
        }
      });
      if (!response.ok) {
        throw new Error(data.message || "Errore di sistema. Riprova più tardi.");
      }
      if (response.error == 1) {
        throw new Error(response.message || "Error resetting password");
      }
      if (response.error == 0) {
        console.log("Password reset successfully");
        showToast("Success", response.data.output || "Your password has been successfully reset, you can now log in.", "success");
        setTimeout(() => {
          location.href = "index.php";
        }, 3000);
      } else {
        showToast("Error", response.data.output || "Error resetting password", "error");
      }  
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    showToast(error.message || "Errore di sistema. Riprova più tardi.", "danger");
  }
}

async function checkToken(token){
  try {
    const response = await fetchApi({
      url: ENDPOINT,
      body: { class: 'User', action: 'checkToken', token: token }
    });
    if (response.error == 1) { throw new Error(data.message || "Token expired or invalid"); }
    if (tokenExpiredDiv) {tokenExpiredDiv.remove();}
    if (form) {form.classList.remove('invisible');}
  } catch (error) {
    if (tokenExpiredDiv) {tokenExpiredDiv.textContent = error.message || "Token expired or invalid";}
    if (form) {form.remove();}
  }
}

function checkPwd(){
  if(newPwd.value.length <= 8){
    newPwd.setCustomValidity("Password must have 8 characters at least");
  }else{
    newPwd.setCustomValidity("");
  }
  if(newPwd.value !== confPwd.value){
    confPwd.setCustomValidity("Passwords don't match, please check and try again");
  }else{
    confPwd.setCustomValidity("");
  }
}