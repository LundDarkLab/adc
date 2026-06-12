const checkLogged = {isLogged: document.getElementById('isLogged')?.value};

if (checkLogged.isLogged === 'true') {
  checkLogged.userId = parseInt(document.getElementById('userId')?.value);
  checkLogged.userRole = parseInt(document.getElementById('userRole')?.value);
  checkLogged.userInstitution = parseInt(document.getElementById('userInstitution')?.value);
  checkLogged.userEmail = document.getElementById('userEmail')?.value;
}

function canShow(userId, userInstitution) {
  if (checkLogged.isLogged !== 'true') return false;

  const isSelf        = checkLogged.userId === userId;
  const isGlobalAdmin = checkLogged.userRole === 1;
  const isLocalAdmin  = checkLogged.userRole === 2 && checkLogged.userInstitution === userInstitution;

  return isSelf || isGlobalAdmin || isLocalAdmin;
}

export { checkLogged, canShow };