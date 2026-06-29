import { fetchApi } from '../../../shared/utils/fetch.js';
import mapConfig from '../../../shared/components/map/mapConfig.js';

export async function getArtifactsForInstitution(institutionId, isLogged) {
  const filterArr = [`artifact.storage_place = ${institutionId}`];
  if (!isLogged) filterArr.push('artifact.status = 2');
  const response = await fetchApi({
    body: { class: 'Collection', action: 'getGallery', filterArr, getAll: true }
  });
  return response.data?.gallery ?? [];
}

export async function getInstitution(id) {
  const response = await fetchApi({
    body: { class: 'Institution', action: 'getInstitutions', filters: { id: parseInt(id) } }
  });
  return response.data?.[0] ?? null;
}

export async function getInstitutions(filters = {}) {
  const response = await fetchApi({
    body: { class: 'Institution', action: 'getInstitutions', filters }
  });
  return response.data ?? [];
}

export async function getCategoryList() {
  const response = await fetchApi({
    body: { class: 'Institution', action: 'categoryList' }
  });
  return response.data ?? [];
}

export async function saveInstitution(formData) {
  return fetchApi({ body: formData });
}

export async function searchCity(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=5`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Nominatim search failed');
  return response.json();
}

export { mapConfig };
