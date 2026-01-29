export function addMarkerByCoordinates(map, lat, lng, options = {}) {
  const markerOptions = {
    title: options.title || 'Marker',
    ...options,
  };

  lat = parseFloat(lat);
  lng = parseFloat(lng);
  if (isNaN(lat) || isNaN(lng)) {
    console.error('Invalid coordinates:', { lat, lng });
    return null;
  }

  const marker = L.marker([lat, lng], markerOptions).addTo(map);
  if( options.popupContent ) { marker.bindPopup(options.popupContent); }
  if( options.icon ){ marker.setIcon(options.icon); }

  return marker;
}

export function clearMarkers(map, markers) {
  markers.forEach(marker => {
    map.removeLayer(marker);
  });
  markers.length = 0; // Clear the array
}

export function setView(map, lat, lng, zoomLevel = 13) {
  map.setView([lat, lng], zoomLevel);
}

export function fitBounds(map, bounds) {
  map.fitBounds(bounds);
}

// Nuova funzione per il fitBounds basata su un livello specifico
export function fitBoundsToLevel(map, boundariesData, level, options = {}) {
  const defaultOptions = { padding: [50, 50], ...options };
  
  if (boundariesData?.layers?.[level]) {
    map.fitBounds(boundariesData.layers[level].getBounds(), defaultOptions);
    return true;
  }
  
  console.warn(`No boundary layer found for level ${level}`);
  return false;
}

export function addTileLayer(map, urlTemplate, options = {}) {
  const tileLayer = L.tileLayer(urlTemplate, options).addTo(map);
  return tileLayer;
}

export function removeTileLayer(map, tileLayer) {
  map.removeLayer(tileLayer);
}

export function addGeoJSONLayer(map, geojsonData, options = {}) {
  const geoJsonLayer = L.geoJSON(geojsonData, options).addTo(map);
  return geoJsonLayer;
}

export function removeGeoJSONLayer(map, geoJsonLayer) {
  map.removeLayer(geoJsonLayer);
}

export function createLayerGroup(map, name) {
  const layerGroup = L.layerGroup().addTo(map);
  return layerGroup;
}

export function addGeoJSONToGroup(layerGroup, geojsonData, options = {}) {
  const layer = L.geoJSON(geojsonData, options);
  layerGroup.addLayer(layer);
  return layer;
}

export function clearLayerGroup(layerGroup) {
  layerGroup.clearLayers();
}