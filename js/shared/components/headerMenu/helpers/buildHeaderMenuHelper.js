import { mainLinks, toggleMenuBtn} from "../../../config/navigationConfig.js";
import { checkLogged } from "../../../utils/checkLoggedUtils.js";
import { checkDevice,isMobile } from "../../../utils/isMobileUtils.js";

export async function buildMenu() {
  const menuContainer = document.getElementById('headerLink');
  if (!menuContainer) return;
  
  // Pulisci il menu esistente
  menuContainer.innerHTML = '';
  
  // Aggiungi i link principali
  mainLinks.forEach(link => {    
    if(checkLogged.isLogged === 'true' && link.label === 'login') { return; };
    const a = document.createElement('a');
    a.href = link.href;
    a.dataset.bsTitle = link.title;
    a.classList.add('animated');
    a.dataset.bsToggle = 'tooltip';
    a.dataset.bsPlacement = 'bottom';
    a.textContent = link.label;
    menuContainer.appendChild(a);
  });

  if(checkLogged.isLogged === 'true' || isMobile()) {
    const toggleBtn = document.createElement('a');
    toggleBtn.href = toggleMenuBtn[0].href;
    toggleBtn.id = toggleMenuBtn[0].id;
    toggleBtn.classList.add('animated');
    toggleBtn.dataset.bsTitle = 'Toggle menu';
    const icon = document.createElement('span');
    icon.className = `mdi ${toggleMenuBtn[0].icon}`;
    toggleBtn.appendChild(icon);
    menuContainer.appendChild(toggleBtn);

    setupHeaderMenuToggle(toggleBtn);

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleNav();
    });
  }
  
}

function setupHeaderMenuToggle(toggleBtn) {
  const userMenu = document.getElementById("userMenu");
  const loggedValue = checkLogged.isLogged;
  const device = checkDevice();
  if(userMenu) {userMenu.classList.add('closed');}
  
  if(loggedValue == 0){
    switch (device) {
      case 'tablet-landscape': 
      toggleBtn.style.display = 'none'; 
      break;
      case 'tablet-portrait': 
      toggleBtn.style.display = 'inline-block'; 
      break;
      case 'pc': 
      toggleBtn.style.display = 'none';
      break;
      default: 
      toggleBtn.style.display = 'inline-block'; 
      break;
    }
  }else{
    toggleBtn.style.display = 'inline-block';
  }
}

function toggleNav(){
  const userMenu = document.getElementById("userMenu");
  const backdrop = document.getElementById("backdrop");
  userMenu.classList.toggle('open');
  backdrop.classList.toggle('show');
  ["wheel", "touchmove"].forEach(event => {
    if(backdrop.classList.contains('show')){
      document.addEventListener(event, preventScroll, {passive: false});
    } else {
      document.removeEventListener(event, preventScroll);
    }
  });
  backdrop.addEventListener('click', (e) => {
    e.preventDefault();
    toggleNav();
  });
}

function preventScroll(e){
  e.preventDefault();
  e.stopPropagation();
  return false;
}