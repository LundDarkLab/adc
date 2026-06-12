import { buildSelectOptions } from "../api/getArtifactSelect.js";
import { initEventListeners } from "../utils/artifact_listeners.js"
import { initTimelineSelector } from "../../../shared/components/timeline/components/timelineSelector.js";
import { toggleMapAlert, addMArkerOnClick } from "../components/artifactMapComponent.js";
import { initMap } from "../../../modules/initMaps.js";
import { layerControl } from "../../../components/mapsComponent.js";

export async function initAddPage() {
  // Carica dati per i form
  await buildSelectOptions();
  await initTimelineSelector('complete');
  
  // Inizializza mappa con funzionalità di editing
  const mapElement = await initMap('map');
  layerControl(mapElement, { baseLayers: true });
  initEventListeners('artifact_add', mapElement);
  
  // Funzionalità specifiche per aggiunta artifact
  toggleMapAlert(mapElement.map);
  await addMArkerOnClick(mapElement);
}