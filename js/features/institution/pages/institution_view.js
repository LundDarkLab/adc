import { bsAlert } from "../../../components/bsComponents.js";
import { initMap } from "../../../shared/components/map/initMap.js";
import { getInstitution, getArtifactsForInstitution, mapConfig } from "../api/institutionApi.js";
import { createGalleryItem, getCollectStatusBtn } from "../../../components/galleryCard.js";
import { collectionState } from "../../../modules/collectionStorage.js";
import { collection } from "../../../modules/collection.js";

const L = window.L;
const institutionId = new URLSearchParams(window.location.search).get('item');
const isLogged = document.getElementById('isLogged')?.value === 'true';

let stateManager;
let coll;
const artifactMarkers = new Map();

export async function initPage() {
  if (!institutionId) {
    bsAlert('Institution not provided', 'danger', 5000);
    window.location.href = 'index.php';
    return;
  }

  stateManager = await collectionState();
  coll = await collection();

  const mapElement = await initMap('map');
  const baseLayers = {};
  Object.values(mapElement.layerControl.baseLayers).forEach(({ label, tile }) => {
    baseLayers[label] = tile;
  });
  L.control.layers(baseLayers).addTo(mapElement.map);

  await loadInstitutionData(mapElement);
  document.getElementById('loadingDiv')?.classList.add('d-none');
}

async function loadInstitutionData(mapElement) {
  const institution = await getInstitution(institutionId);
  if (!institution) {
    bsAlert('Institution not found', 'danger', 5000);
    return;
  }
  const institutionMarker = renderInfo(institution, mapElement);
  const artifacts = await getArtifactsForInstitution(institutionId, isLogged);
  renderArtifacts(artifacts, mapElement);
  fitAllMarkers(mapElement, institutionMarker);
}

function fitAllMarkers(mapElement, institutionMarker) {
  const all = [];
  if (institutionMarker) all.push(institutionMarker);
  artifactMarkers.forEach(m => all.push(m));
  if (all.length === 0) return;
  if (all.length === 1) {
    mapElement.map.setView(all[0].getLatLng(), 14);
    return;
  }
  const group = L.featureGroup(all);
  mapElement.map.fitBounds(group.getBounds(), { padding: [40, 40] });
}

function renderInfo(data, mapElement) {
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

  let institutionMarker = null;
  if (data.lat && data.lon) {
    institutionMarker = L.marker([parseFloat(data.lat), parseFloat(data.lon)], {
      icon: mapConfig.storagePlaceIco
    }).addTo(mapElement.map);
  }
  return institutionMarker;
}

function renderArtifacts(artifacts, mapElement) {
  const container = document.getElementById('cardContainer');
  if (!container) return;

  artifacts.forEach(artifact => {
    if (artifact.latitude && artifact.longitude) {
      const marker = L.marker([parseFloat(artifact.latitude), parseFloat(artifact.longitude)], {
        icon: mapConfig.findplaceIco
      }).addTo(mapElement.map);
      artifactMarkers.set(String(artifact.id), marker);
    }

    const card = createGalleryItem(
      artifact,
      (item, btn) => onCollect(item, btn),
      (btn) => onUncollect(btn)
    );

    if (artifactMarkers.has(String(artifact.id))) {
      const footer = card.querySelector('.card-footer');
      if (footer) {
        const viewOnMapBtn = document.createElement('button');
        viewOnMapBtn.className = 'btn btn-sm btn-secondary';
        viewOnMapBtn.textContent = 'View on map';
        viewOnMapBtn.addEventListener('click', () => {
          const marker = artifactMarkers.get(String(artifact.id));
          mapElement.map.setView(marker.getLatLng(), 17);
          document.getElementById('map-container').scrollIntoView({ behavior: 'smooth' });
        });
        footer.appendChild(viewOnMapBtn);
      }
    }

    container.appendChild(card);
  });
}

async function onCollect(item, btn) {
  btn.style.display = 'none';
  const uncollectBtn = btn.nextElementSibling;
  if (uncollectBtn?.classList.contains('uncollectItemBtn')) {
    uncollectBtn.style.display = 'inline-block';
  }
  const currentState = stateManager.getState();
  let key = currentState.activeCollectionKey;
  if (!key) {
    key = await coll.createCollection();
    bsAlert("A new collection named 'My Collection' has been created. You can edit its metadata later.", 'info', 4000);
    await new Promise(resolve => setTimeout(resolve, 4100));
  }
  await coll.addItem(key, item);
  getCollectStatusBtn();
}

async function onUncollect(btn) {
  btn.style.display = 'none';
  const collectBtn = btn.previousElementSibling;
  if (collectBtn?.classList.contains('collectItemBtn')) {
    collectBtn.style.display = 'inline-block';
  }
  const itemId = btn.dataset.item;
  const currentState = stateManager.getState();
  const key = currentState.activeCollectionKey;
  if (!key) {
    bsAlert('No active collection selected!', 'danger');
    return;
  }
  await coll.removeItem(itemId);
  const postRemoveState = stateManager.getState();
  const updatedCollectStatus = { ...postRemoveState.collectStatus };
  delete updatedCollectStatus[itemId];
  stateManager.updateState({
    activeCollection: postRemoveState.collections[key],
    collectStatus: updatedCollectStatus
  });
  getCollectStatusBtn();
}
