const usrCard = document.getElementById('usrCard');

export function renderUserCard(person){
  if(!usrCard){
    console.error('User card element not found');
    return;
  }
  console.log(person);
  
  const isActive = person.active == 1 ? 'Active user' : 'Disabled user';
  const isActiveClass = person.active == 1 ? 'success' : 'danger';
  const div = `
  <div class="card">
    <div class="card-header">
      <h6>User info</h6>
    </div>
    <ul class="list-group list-group-flush" id="userInfoList">
      <li class="list-group-item">
        <span class="fw-bold">is active: </span>
        <span class="alert py-0 px-3 m-0 alert-${isActiveClass}">${isActive}</span>
      </li>
      <li class="list-group-item">
        <span class="fw-bold">role: </span>
        <span id="role">${person.user_class}</span>
      </li>
    </ul>
  </div>
  `;
  usrCard.innerHTML = div;
}

export function renderNoUserDiv(name){
  if(!usrCard){
    console.error('User card element not found');
    return;
  }
  const div = `<div class="alert alert-danger"> ${name} does not have a registered account, edit profile to create a system user </div>`;
  usrCard.innerHTML = div;
}