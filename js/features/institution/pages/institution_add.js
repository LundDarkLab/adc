import { initMap } from '../../../shared/components/map/initMap.js';
import { bsAlert } from '../../../components/bsComponents.js';
import { saveInstitution } from '../api/institutionApi.js';
import { loadInstitutionsOnMap, initMapAlert, initMapMarker, initMapReset } from '../components/institutionMap.js';
import { loadCategories, initColorPicker, initCityAutocomplete, initLogoPreview } from '../components/institutionForm.js';

const L = window.L;

export async function initPage() {
  const mapElement = await initMap('map');
  const baseLayers = {};
  Object.values(mapElement.layerControl.baseLayers).forEach(({ label, tile }) => {
    baseLayers[label] = tile;
  });
  L.control.layers(baseLayers).addTo(mapElement.map);

  await Promise.all([
    loadInstitutionsOnMap(mapElement),
    loadCategories(),
  ]);

  initColorPicker();
  initCityAutocomplete(mapElement);
  initLogoPreview();
  initMapMarker(mapElement);
  initMapAlert(mapElement.map);
  initMapReset(mapElement);

  initFormSubmit();

  document.getElementById('loadingDiv')?.classList.add('d-none');
}

function initFormSubmit() {
  const form = document.querySelector('[name="newInstitutionForm"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const isStoragePlace = document.getElementById('is_storage_place').checked;
    const logoInput = document.getElementById('logo');

    const fd = new FormData();
    fd.append('class', 'Institution');
    fd.append('action', 'addInstitution');
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
