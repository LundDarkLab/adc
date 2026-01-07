import { artifactSelect } from './api/getArtifactSelect.js';
import { buildSelectOptions } from './components/artifactSelectComponent.js';
import { initTimelineSelector } from "../../shared/components/timeline/components/timelineSelector.js";
import { toggleTimeAccordion, closeAllAccordions } from '../../shared/components/timeline/utils/toggleAccordion.js';

export function initArtifactPage() {
  
  // Logica specifica per pagina
  if (window.pageType === 'artifact_add') {
    initAddPage();
  } else if (window.pageType === 'artifact_edit') {
    initEditPage();
  } else if (window.pageType === 'artifact_view') {
    initViewPage();
  }
}

async function initCommonArtifactLogic() {
  const select = await artifactSelect();
  await initTimelineSelector('complete');
  buildSelectOptions(select);
  const toggleTimeBoundsBtn = document.querySelectorAll(".boundsBtn");
  toggleTimeBoundsBtn.forEach(btn => {
    btn.addEventListener('click', (ev)=>{
      const i = btn.querySelector('i');
      if (!i || !i.id) {
        console.warn('Icon element or icon id not found in button', btn);
        // Usa un id alternativo basato sul button stesso
        const icon = btn.id || 'defaultIcon';
        const wrap = btn.dataset.accordionWrap;
        if (wrap) {
          toggleTimeAccordion(icon, wrap);
        }
        return;
      }
      const icon = i.id;
      const wrap = btn.dataset.accordionWrap;
      toggleTimeAccordion(icon, wrap);
    })
  })

  document.addEventListener('click', closeAllAccordions);
}

function initAddPage() {
  initCommonArtifactLogic();
  // Es. getArtifactSelectOptions(), initListener() come nel tuo codice
}

function initEditPage() {
  // Logica specifica per edit: carica dati esistenti, listeners per modifica
  console.log('Inizializzazione pagina edit');
}

function initViewPage() {
  // Logica specifica per view: sola visualizzazione, disabilita form
  console.log('Inizializzazione pagina view');
}