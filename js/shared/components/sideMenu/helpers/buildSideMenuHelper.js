import { checkLogged } from "../../../utils/checkLoggedUtils.js";
import { isMobile, checkDevice } from "../../../utils/isMobileUtils.js";
import { mainLinks, dashBoardBtn, mainSectionMenu, adminSectionMenu, userAccountMenu} from "../../../config/navigationConfig.js";

export async function buildSideMenu() {
  const linkWrap = document.getElementById('linkWrap');
  if(checkLogged.isLogged === 'true'){
    const menuHeader = document.createElement('span');
    menuHeader.id = 'user';
    menuHeader.textContent = checkLogged.userEmail;
    linkWrap.appendChild(menuHeader);

    createLinkElements(linkWrap, dashBoardBtn);
    createLinkElements(linkWrap, mainSectionMenu, 'add resource')
    if(parseInt(checkLogged.userRole) === 1){
      createLinkElements(linkWrap, adminSectionMenu, 'admin section');
    }
    createLinkElements(linkWrap, userAccountMenu, 'my account');
  }
    
  
  if(checkDevice() !== 'tablet-landscape' && checkDevice() !== 'pc') {
    createLinkElements(linkWrap, mainLinks, 'main pages');
  }
}

export function createLinkElements(linkWrap,links, title = null) {
  if(title) {
    const titleEl = document.createElement('span');
    titleEl.className = 'titleSection';
    titleEl.textContent = title.toUpperCase();
    linkWrap.appendChild(titleEl);
  }
  links.forEach(link => {
    if(checkLogged.isLogged === 'true' && link.label === 'login') { return; };
    const a = document.createElement('a');
    a.href = link.href;
    a.dataset.bsTitle = link.title;
    a.classList.add('animated');
    a.dataset.bsToggle = 'tooltip';
    a.dataset.bsPlacement = 'bottom';
    a.innerHTML = `<i class="mdi ${link.icon}"></i> ${link.label}`;
    linkWrap.appendChild(a);
  });
  
}