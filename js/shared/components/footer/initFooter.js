import { checkLogged } from "../../utils/checkLoggedUtils.js";
import { mainLinks } from "../../config/navigationConfig.js";

export async function initFooter() {
  try {
    const response = await fetch('../../../../assets/footer.html');
    if (!response.ok) {
      throw new Error(`Errore nel caricamento del file: ${response.status}`);
    }
    const html = await response.text();
    const footerElement = document.getElementById('footer');
    if (footerElement) {
      footerElement.innerHTML = html;
      const currentYear = document.getElementById('currentYear');
      const d = new Date();
      const year = d.getFullYear();
      if (currentYear) { currentYear.textContent = year; }
      const linkWrap = document.getElementById('footerMenu');
      createFooterLinkElements(linkWrap, mainLinks)
    } else {
      console.error('Elemento footer non trovato');
    }
  } catch (error) {
    console.error('Errore durante il caricamento del footer:', error);
  }
}

function createFooterLinkElements(linkWrap,links){
  links.forEach(link => {
    if(checkLogged.isLogged === 'true' && link.label === 'login') { return; };
    const a = document.createElement('a');
    a.href = link.href;
    a.dataset.bsTitle = link.title;
    a.classList.add('animated');
    a.dataset.bsToggle = 'tooltip';
    a.dataset.bsPlacement = 'left';
    a.innerHTML = `${link.label} <i class="mdi ${link.icon}"></i>`;
    linkWrap.appendChild(a);
  });
}