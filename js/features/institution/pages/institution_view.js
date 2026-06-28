import { bsAlert } from "../../../components/bsComponents.js";
import { initMap } from "../../../shared/components/map/initMap.js";
import { getInstitution } from "../api/institutionApi.js";
import { placeMarker } from "../components/institutionMap.js";

const L = window.L;
const institutionId = new URLSearchParams(window.location.search).get('item');

export async function initPage(){
  if(!institutionId){
    bsAlert('Institution not provided', 'danger', 5000);
    window.location.href = 'index.php';
    return;
  }
  const mapElement = await initMap('map');
  const baseLayers = {};
  Object.values(mapElement.layerControl.baseLayers).forEach(({ label, tile }) => {
    baseLayers[label] = tile;
  });
  L.control.layers(baseLayers).addTo(mapElement.map);

  await loadInstitutionData(mapElement);

  document.getElementById('loadingDiv')?.classList.add('d-none');
}

async function loadInstitutionData(mapElement){
  const institution = await getInstitution(institutionId);
  if(!institution){
    bsAlert('Institution not found', 'danger', 5000);
    return;
  }
  renderInfo(institution, mapElement);
}

function renderInfo(data, mapElement){
  document.getElementById('logo-banner').style.setProperty('--banner-logo', `url('/img/logo/${data.logo}')`);
  document.getElementById('banner-title').textContent = data.name;

  const fields = {
    name: data.name,
    abbreviation: data.abbreviation,
    category: data.category,
    city: data.city,
    address: data.address,
    coordinates: `${data.lat} / ${data.lon}`,
    url: data.url,
    artifact_count: data.artifact_count,
  };

  Object.entries(fields).forEach(([key, value]) => {
    const span = document.querySelector(`[data-field="${key}"]`);
    if (!span) return;
    if (key === 'url' && value) {
      span.href = value;
      span.textContent = value;
    } else {
      span.textContent = value ?? '';
    }
  });

  if (data.lat && data.lon) {
    placeMarker(mapElement, data.lat, data.lon);
  }
}