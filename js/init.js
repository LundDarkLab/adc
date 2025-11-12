document.addEventListener("DOMContentLoaded", function() {
  initNav();
  if(toggleMenuBtn){
    toggleMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleNav();
    });
  }
  screen.orientation.addEventListener("change", initNav);
});

function initNav(){
  const userMenu = document.getElementById("userMenu");
  const toggleMenuBtn = document.getElementById("toggleMenu");
  const backdrop = document.getElementById("backdrop");
  const loggedValue = document.querySelector("[name=logged]").value;
  const device = checkDevice();
  if(userMenu) {userMenu.classList.add('closed');}
  
  if(loggedValue == 0){
    switch (device) {
      case 'tablet-landscape': 
      toggleMenuBtn.style.display = 'none'; 
      break;
      case 'tablet-portrait': 
      toggleMenuBtn.style.display = 'inline-block'; 
      break;
      case 'pc': 
      toggleMenuBtn.style.display = 'none';
      // backdrop.remove();
      // userMenu.remove();
      break;
      default: 
      toggleMenuBtn.style.display = 'inline-block'; 
      break;
    }
  }else{
    toggleMenuBtn.style.display = 'inline-block';
  }
  
  if(backdrop){
    backdrop.addEventListener('click', (e) => {
      e.preventDefault();
      toggleNav();
    });
  }
}

function toggleNav(){
  const userMenu = document.getElementById("userMenu");
  userMenu.classList.toggle('open');
  backdrop.classList.toggle('show');
  ["wheel", "touchmove"].forEach(event => {
    if(backdrop.classList.contains('show')){
      document.addEventListener(event, preventScroll, {passive: false});
    } else {
      document.removeEventListener(event, preventScroll);
    }
  });
}
function preventScroll(e){
  e.preventDefault();
  e.stopPropagation();
  return false;
}


async function currentPageActiveLink(url) {
  document.querySelectorAll('.headerLink > a.currentPage').forEach(el => {
    el.classList.remove('currentPage');
  });
  const activeLink = document.querySelector(`.headerLink > a[href="${url}"]`);
  if (activeLink) {
    activeLink.classList.add('currentPage');
  }
}

function getSelectOptions(list, column, filter, select){
  ajaxSettings.url=API+"get.php";
  ajaxSettings.data = {trigger:'getSelectOptions',list:list, filter:filter, column:column}
  $.ajax(ajaxSettings)
  .done(function(data) {
    data.forEach((opt, i) => {
      $("<option/>").val(opt.id).text(opt[column]).appendTo("#"+select)
    });
  });
}