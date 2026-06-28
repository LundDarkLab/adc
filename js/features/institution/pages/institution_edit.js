import { initMap } from '../../../shared/components/map/initMap.js';
import { bsAlert } from '../../../components/bsComponents.js';
import { getInstitution, saveInstitution } from '../api/institutionApi.js';
import { loadInstitutionsOnMap, initMapAlert, initMapMarker, initMapReset, placeMarker } from '../components/institutionMap.js';
import { loadCategories, initColorPicker, initCityAutocomplete, initLogoPreview } from '../components/institutionForm.js';

const L = window.L;
const institutionId = new URLSearchParams(window.location.search).get('item');

export async function initPage() {
  if(!institutionId){
    bsAlert('Institution not provided', 'danger', 5000);
    window.location.href = 'index.php';
  }
  const mapElement = await initMap('map');
  const baseLayers = {};
  Object.values(mapElement.layerControl.baseLayers).forEach(({ label, tile }) => {
    baseLayers[label] = tile;
  });
  L.control.layers(baseLayers).addTo(mapElement.map);

  await Promise.all([
    loadInstitutionsOnMap(mapElement, institutionId),
    loadCategories(),
  ]);

  initColorPicker();
  initCityAutocomplete(mapElement);
  initLogoPreview();
  initMapMarker(mapElement);
  initMapAlert(mapElement.map);
  initMapReset(mapElement);

  if (institutionId) {
    await loadInstitutionData(mapElement);
  }

  initFormSubmit();

  document.getElementById('loadingDiv')?.classList.add('d-none');
}

async function loadInstitutionData(mapElement) {
  const institution = await getInstitution(institutionId);
  if (!institution) {
    bsAlert('Institution not found', 'danger', 5000);
    return;
  }

  if (institution.is_storage_place == 1) {
    document.getElementById('is_storage_place').checked = true;
    document.getElementById('colorPicker').hidden = false;
    document.getElementById('color').value = institution.color || '#000000';
  }

  document.getElementById('category').value = institution.category_id;
  document.getElementById('name').value = institution.name;
  document.getElementById('abbreviation').value = institution.abbreviation;
  document.getElementById('city').value = institution.city;
  document.getElementById('address').value = institution.address;
  document.getElementById('url').value = institution.url || '';

  if (institution.lat && institution.lon) {
    placeMarker(mapElement, institution.lat, institution.lon);
  }

  if (institution.logo) {
    const logoPreview = document.getElementById('logoPreview');
    logoPreview.src = `img/logo/${institution.logo}`;
    logoPreview.style.height = '100%';
    document.getElementById('imgPlaceholder').style.display = 'block';
  }
}

function initFormSubmit() {
  const form = document.querySelector('[name="editInstitutionForm"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const isStoragePlace = document.getElementById('is_storage_place').checked;
    const logoInput = document.getElementById('logo');
    const action = institutionId ? 'editInstitution' : 'addInstitution';

    const fd = new FormData();
    fd.append('class', 'Institution');
    fd.append('action', action);
    if (institutionId) fd.append('id', institutionId);
    fd.append('is_storage_place', isStoragePlace ? 1 : 0);
    fd.append('color', isStoragePlace ? document.getElementById('color').value : '');
    fd.append('category', document.getElementById('category').value);
    fd.append('name', document.getElementById('name').value);
    fd.append('abbreviation', document.getElementById('abbreviation').value);
    fd.append('city', document.getElementById('city').value);
    fd.append('address', document.getElementById('address').value);
    fd.append('lon', document.getElementById('longitude').value);
    fd.append('lat', document.getElementById('latitude').value);
    fd.append('url', document.getElementById('url').value);
    if (logoInput.files.length) fd.append('logo', logoInput.files[0]);

    try {
      const result = await saveInstitution(fd);
      const res = result.data;
      if (res?.res === 0) {
        bsAlert(res.output, 'danger', 5000);
      } else {
        bsAlert(res?.output || 'Saved successfully', 'success', 3000, () => {
          window.location.href = 'dashboard.php';
        });
      }
    } catch (error) {
      bsAlert('Error saving institution: ' + error.message, 'danger', 5000);
    }
  });
}
