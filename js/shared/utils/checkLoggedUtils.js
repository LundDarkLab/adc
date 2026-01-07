const checkLogged = {isLogged: document.getElementById('isLogged')?.value};

if (checkLogged.isLogged === 'true') {
  checkLogged.userId = document.getElementById('userId')?.value;
  checkLogged.userRole = document.getElementById('userRole')?.value;
  checkLogged.userInstitution = document.getElementById('userInstitution')?.value;
  checkLogged.userEmail = document.getElementById('userEmail')?.value;
}

export { checkLogged };