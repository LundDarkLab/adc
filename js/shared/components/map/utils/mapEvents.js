/**
 * CONFIGURAZIONE
 * MAX_ZOOM_THRESHOLD: Lo zoom oltre il quale tutti i poligoni vengono nascosti (12).
 * VIEWPORT_PADDING: Margine di tolleranza (0.1 = 10%). Aiuta a non far sparire i layer 
 * non appena toccano il bordo fisico del monitor.
 */
const MAX_ZOOM_THRESHOLD = 12;
const VIEWPORT_PADDING = 0.1; 

/**
 * Valuta se un layer deve essere visualizzato
 */
function shouldShowLayer(map, layer) {
  const currentZoom = map.getZoom();
  
  // REGOLA 1: Se lo zoom è >= 12, spegniamo tutto (limite tollerabile)
  if (currentZoom >= MAX_ZOOM_THRESHOLD) { return false; }

  if (!layer || !layer.getBounds) { return false; }

  // Applichiamo il padding ai bordi della mappa per una transizione più dolce
  const paddedMapBounds = map.getBounds().pad(VIEWPORT_PADDING);
  const layerBounds = layer.getBounds();

  // REGOLA 2: Il poligono deve essere COMPLETAMENTE contenuto nei bordi (con padding)
  // Questo assicura che l'utente veda l'entità amministrativa intera
  return paddedMapBounds.contains(layerBounds);
}

/**
 * Gestore principale degli eventi di zoom e movimento
 */
export function handleMapUpdate(mapElement) {
  if (!mapElement.adminGroup?.layers) { return; }

  const map = mapElement.map;
  const layers = mapElement.adminGroup.layers;

  Object.entries(layers).forEach(([level, layer]) => {
    const show = shouldShowLayer(map, layer);
    const isCurrentlyVisible = map.hasLayer(layer);

    if (show && !isCurrentlyVisible) {
      map.addLayer(layer);
    } else if (!show && isCurrentlyVisible) {
      map.removeLayer(layer);
    }
  });
}

/**
 * Inizializza i listener sulla mappa
 */
export function initZoomEndHandler(mapElement) {
  if (!mapElement?.map || !mapElement.adminGroup?.layers) { return; }

  // 1. Pulizia iniziale: partiamo da una mappa pulita
  Object.values(mapElement.adminGroup.layers).forEach(layer => {
    if (mapElement.map.hasLayer(layer)) {
      mapElement.map.removeLayer(layer);
    }
  });

  // 2. Registriamo gli eventi
  // Usiamo sia 'zoomend' che 'moveend' per gestire spostamenti manuali della mappa
  mapElement.map.on('zoomend moveend', () => handleMapUpdate(mapElement));
  
  // 3. Prima esecuzione per impostare lo stato iniziale
  handleMapUpdate(mapElement);
}