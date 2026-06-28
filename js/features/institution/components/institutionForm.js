import { getCategoryList, searchCity } from '../api/institutionApi.js';

export async function loadCategories() {
  const categories = await getCategoryList();
  const select = document.getElementById('category');
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.value;
    select.appendChild(opt);
  });
}

export function initColorPicker() {
  const colorPicker = document.getElementById('colorPicker');
  const isStoragePlace = document.getElementById('is_storage_place');
  colorPicker.hidden = true;

  isStoragePlace.addEventListener('change', () => {
    colorPicker.hidden = !isStoragePlace.checked;
  });

  document.getElementById('randomColor').addEventListener('click', () => {
    document.getElementById('color').value = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
  });
}

export function initCityAutocomplete(mapElement = null) {
  const cityInput = document.getElementById('city');
  const suggestionsList = document.getElementById('citySuggested');
  let autocompleted = false;

  suggestionsList.style.display = 'none';

  cityInput.addEventListener('keyup', async () => {
    const query = cityInput.value.trim();
    if (query.length < 2) {
      suggestionsList.innerHTML = '';
      suggestionsList.style.display = 'none';
      autocompleted = false;
      return;
    }

    try {
      const results = await searchCity(query);
      suggestionsList.innerHTML = '';
      if (!results.length) {
        suggestionsList.style.display = 'none';
        return;
      }
      results.forEach(place => {
        const item = document.createElement('a');
        item.className = 'list-group-item list-group-item-action';
        item.textContent = place.display_name;
        item.addEventListener('click', () => {
          const name = place.address?.city || place.address?.town || place.address?.village || place.display_name;
          cityInput.value = name;
          cityInput.dataset.cityid = place.place_id;
          suggestionsList.style.display = 'none';
          autocompleted = true;

          if (mapElement?.map && place.boundingbox) {
            const [s, n, w, e] = place.boundingbox.map(Number);
            mapElement.map.fitBounds([[s, w], [n, e]]);
          }
        });
        suggestionsList.appendChild(item);
      });
      suggestionsList.style.display = 'block';
    } catch (e) {
      console.error('City search error:', e);
    }
  });

  document.addEventListener('click', (e) => {
    if (!suggestionsList.contains(e.target) && suggestionsList.style.display !== 'none') {
      suggestionsList.style.display = 'none';
      if (cityInput.value && !autocompleted) {
        cityInput.value = '';
        cityInput.dataset.cityid = '';
      }
    }
  });
}

export function initLogoPreview() {
  const logoInput = document.getElementById('logo');
  const logoPreview = document.getElementById('logoPreview');
  const imgPlaceholder = document.getElementById('imgPlaceholder');

  imgPlaceholder.style.display = 'none';

  logoInput.addEventListener('change', () => {
    if (!logoInput.files.length) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.max(w, h) > 200 ? 200 / Math.max(w, h) : 1;
        const newW = Math.floor(w * scale);
        const newH = Math.floor(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        canvas.getContext('2d').drawImage(img, 0, 0, newW, newH);
        logoPreview.src = canvas.toDataURL('image/png');
        imgPlaceholder.style.display = 'block';
      };
    };
    reader.readAsDataURL(logoInput.files[0]);
  });
}
