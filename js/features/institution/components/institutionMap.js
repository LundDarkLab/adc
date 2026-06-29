import { getInstitutions, mapConfig } from '../api/institutionApi.js';

const L = window.L;

export async function loadInstitutionsOnMap(mapElement, excludeId = null) {
  const institutions = await getInstitutions();
  const group = L.markerClusterGroup({ title: 'markerGroup' });

  institutions.forEach(item => {
    if (excludeId && parseInt(item.id) === parseInt(excludeId)) return;
    L.marker([parseFloat(item.lat), parseFloat(item.lon)], { icon: mapConfig.storagePlaceIco })
      .bindPopup(`<div class='text-center'><h6 class='p-0 m-0'>${item.name}</h6><p class='p-0 m-0'>Artifacts stored: <strong>${item.artifact_count}</strong></p></div>`)
      .addTo(group);
  });

  group.addTo(mapElement.map);

  if (!excludeId && group.getLayers().length > 0) {
    mapElement.map.fitBounds(group.getBounds());
  }
}

export function initMapAlert(map) {
  const mapAlert = document.getElementById('mapAlert');
  map.on('zoomend', () => {
    const zoomed = map.getZoom() >= 14;
    mapAlert.textContent = zoomed ? 'Ok, you can click on map to place a marker' : 'To put a marker on map you have to zoom in';
    mapAlert.classList.toggle('alert-success', zoomed);
    mapAlert.classList.toggle('alert-warning', !zoomed);
  });
}

export function initMapMarker(mapElement) {
  const resetDiv = document.getElementById('resetMapDiv');
  resetDiv.style.display = 'none';

  mapElement.map.on('click', (e) => {
    if (mapElement.map.getZoom() < 14) return;
    if (e.originalEvent.target.closest('.leaflet-control-container, .leaflet-bar')) return;
    const { lat, lng } = e.latlng;
    if (mapElement.marker) mapElement.map.removeLayer(mapElement.marker);
    mapElement.marker = L.marker([lat, lng]).addTo(mapElement.map);
    document.getElementById('latitude').value = lat.toFixed(6);
    document.getElementById('longitude').value = lng.toFixed(6);
    resetDiv.style.display = 'block';
  });
}

export function initMapReset(mapElement) {
  document.querySelector('[name="resetMap"]').addEventListener('click', () => {
    if (mapElement.marker) {
      mapElement.map.removeLayer(mapElement.marker);
      mapElement.marker = null;
    }
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    document.getElementById('resetMapDiv').style.display = 'none';
  });
}

export function placeMarker(mapElement, lat, lon, zoom = 17, icon = null) {
  if (mapElement.marker) mapElement.map.removeLayer(mapElement.marker);
  const opts = icon ? { icon } : {};
  mapElement.marker = L.marker([lat, lon], opts).addTo(mapElement.map);
  mapElement.map.setView([lat, lon], zoom);
  const latEl = document.getElementById('latitude');
  const lonEl = document.getElementById('longitude');
  const resetDiv = document.getElementById('resetMapDiv');
  if (latEl) latEl.value = lat;
  if (lonEl) lonEl.value = lon;
  if (resetDiv) resetDiv.style.display = 'block';
}
