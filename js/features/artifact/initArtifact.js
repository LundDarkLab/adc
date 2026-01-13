import { artifactSelect } from './api/getArtifactSelect.js';
import { initEventListeners } from './utils/artifact_listeners.js'
import { buildSelectOptions } from './components/artifactSelectComponent.js';
import { toggleMapAlert, addMArkerOnClick } from './components/artifactMapComponent.js';
import { initTimelineSelector } from "../../shared/components/timeline/components/timelineSelector.js";
import { initMap } from '../../modules/initMaps.js';
import { layerControl } from '../../components/mapsComponent.js';

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
  buildSelectOptions(select);
  await initTimelineSelector('complete');
  const mapElement = await initMap('map');
  layerControl(mapElement, { baseLayers: true})
  initEventListeners(mapElement);
  return mapElement;
}

async function initAddPage() {
  const mapInit = await initCommonArtifactLogic();
  toggleMapAlert(mapInit.map);
  await addMArkerOnClick(mapInit);
}

function initEditPage() {
  // Logica specifica per edit: carica dati esistenti, listeners per modifica
  console.log('Inizializzazione pagina edit');
}

function initViewPage() {
  // Logica specifica per view: sola visualizzazione, disabilita form
  console.log('Inizializzazione pagina view');
}

