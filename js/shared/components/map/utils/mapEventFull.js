/**
 * Controlla se un layer è completamente visibile nel viewport
 */
function isLayerFullyVisible(map, layer) {
  if (!layer || !layer.getBounds) { return false; }
  
  const mapBounds = map.getBounds();
  const layerBounds = layer.getBounds();
  
  return mapBounds.contains(layerBounds);
}

/**
 * Controlla se un layer è più grande del viewport (esce dai bordi)
 */
function isLayerTooLarge(map, layer) {
  if (!layer || !layer.getBounds) { return false; }
  
  const mapBounds = map.getBounds();
  const layerBounds = layer.getBounds();
  
  return layerBounds.contains(mapBounds);
}

/**
 * Trova il livello appropriato da visualizzare
 * Strategia: mostra il livello PIÙ GENERALE che sia completamente visibile
 */
function findAppropriateLevel(mapElement) {
  if (!mapElement.adminGroup?.layers) { return null; }

  const layers = mapElement.adminGroup.layers;
  // Ordina dal GENERALE al DETTAGLIATO (0, 1, 2, 3)
  const availableLevels = Object.keys(layers).map(l => parseInt(l)).sort((a, b) => a - b);
  
  if (availableLevels.length === 0) return null;

  let selectedLevel = null;
  
  // Cerca dal più generale al più dettagliato
  for (const level of availableLevels) {
    const layer = layers[level];
    
    const isTooLarge = isLayerTooLarge(mapElement.map, layer);
    const isFullyVisible = isLayerFullyVisible(mapElement.map, layer);
    
    // Se troppo grande, passa al successivo (più dettagliato)
    if (isTooLarge) { continue; }
    
    // Se completamente visibile, usa QUESTO (il più generale)
    if (isFullyVisible) {
      selectedLevel = level;
      break; // FERMATI al primo completamente visibile (più generale)
    }
    
    // Se parzialmente visibile, salva come fallback ma continua
    if (!isFullyVisible && !isTooLarge) {
      if (selectedLevel === null) { selectedLevel = level; }
    }
  }

  return selectedLevel;
}

export function handleZoomEnd(mapElement) {
  if (!mapElement.adminGroup?.layers) { return; }
  const currentZoom = mapElement.map.getZoom();
  const targetLevel = findAppropriateLevel(mapElement);
  
  if (targetLevel === null) {
    for (const [level, layer] of Object.entries(mapElement.adminGroup.layers)) {
      if (mapElement.map.hasLayer(layer)) {
        mapElement.map.removeLayer(layer);
      }
    }
    return;
  }


  // Mostra SOLO il livello target
  for (const [level, layer] of Object.entries(mapElement.adminGroup.layers)) {
    const levelNum = parseInt(level);
    
    if (levelNum === targetLevel) {
      if (!mapElement.map.hasLayer(layer)) {
        mapElement.map.addLayer(layer);
      }
    } else {
      if (mapElement.map.hasLayer(layer)) {
        mapElement.map.removeLayer(layer);
      }
    }
  }
}

export function initZoomEndHandler(mapElement) {
  if (!mapElement?.map) { return; }
  if (!mapElement.adminGroup?.layers || Object.keys(mapElement.adminGroup.layers).length === 0) { return; }
  mapElement.map.on('zoomend', () => handleZoomEnd(mapElement));
  
  handleZoomEnd(mapElement);
}

