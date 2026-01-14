import { fetchApi } from "../../../shared/utils/fetch.js";
import { getBounds } from "../../../shared/components/timeline/api/getTimelineData.js";
import { setBounds, fetchBoundForValue} from "../../../shared/components/timeline/components/boundsSelector.js";
import { setTimeRange } from "../../../shared/components/timeline/services/setTimeRange.js";
import { populateMaterialTechniqueFromArray } from "../components/materialTechniqueComponent.js";
import { adminLevelOptions } from "../api/getArtifactSelect.js";

async function fetchData(itemId) {
  try {
    const payload = {
      class: 'Artifact',
      action: 'getArtifact',
      id: itemId
    };
    return await fetchApi({body:payload});
  } catch (error) {
    console.error('Error in buildEditForm:', error);
  }
}

export async function buildEditForm(mapInit) {
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('item');
  if (!itemId || !Number.isInteger(Number(itemId)) || Number(itemId) <= 0) {
    console.warn('Invalid or missing item ID in URL');
    return;
  }
  const result = await fetchData(itemId);
  if (!result || result.error !== 0) {
    console.error('Failed to fetch artifact data for edit form.');
    return;
  }

  // Popola il form con i dati ricevuti
  setMainDataSection(result.data.artifact);
  setMetadataSection(result.data.artifact_metadata);
  populateMaterialTechniqueFromArray(result.data.artifact_material_technique);

  result.data.crono.timeline_id = result.data.artifact.timeline
  result.data.crono.start = result.data.artifact.start
  result.data.crono.end = result.data.artifact.end
  setCronoSection(result.data.crono);
  setFindPlaceSection(result.data.artifact_findplace, mapInit);
  
  return;
}



async function setFindPlaceSection(data, mapInit) {
  if(data.parish){ document.getElementById('parish').value = data.parish;
    delete data.parish;
  }
  if(data.toponym){ 
    document.getElementById('toponym').value = data.toponym; 
    delete data.toponym;
  }
  if(data.notes){ 
    document.getElementById('findplace_notes').value = data.notes; 
    delete data.notes;
  }

  // Raccogli e ordina le chiavi bounds_ valide
  const bounds = Object.fromEntries(
    Object.entries(data)
      .filter(([key, value]) => key.startsWith('bounds_') && value !== null)
      .sort(([a], [b]) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]))
      .map(([key, value]) => [key.split('_')[1], value])
  );
  const maxLevel = Object.keys(bounds).length > 0 ? Math.max(...Object.keys(bounds).map(k => parseInt(k))) : -1;
  
  const gidList0 = await adminLevelOptions(0,{});
  setOptions(0, gidList0, bounds['0']);
  for (const [level, gid] of Object.entries(bounds)) {
    const gidList = await adminLevelOptions(level, gid);
    if(gidList.length === 0){ break; }
    const nextLevel = parseInt(level) + 1;
    setOptions(level, gidList, bounds[nextLevel.toString()]);
    const container = document.getElementById(`gid_${nextLevel}_container`);
    if(container){ container.classList.remove('hide'); }
  }

  if (data.latitude && data.longitude) {
    document.getElementById('resetMapValueBtn').classList.remove('hide');
    const lat = parseFloat(data.latitude).toFixed(4);
    const lng = parseFloat(data.longitude).toFixed(4);
    const marker = L.marker([lat, lng]).addTo(mapInit.map);
    mapInit.marker = marker;
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    mapInit.map.setView([lat, lng], 15);
  }else if (maxLevel >= 0) {
    try {
      const payload = {
        class: 'Geom',
        action: 'getSimpleBoundary',
        level: maxLevel,
        gid: bounds[maxLevel.toString()]
      };
      const response = await fetchApi({ body: payload });
      if (response.error === 0 && response.data && response.data.items && response.data.items.length > 0) {
        const geoJson = JSON.parse(response.data.items[0].geom); // Assumo GeoJSON valido
        const layer = L.geoJSON(geoJson); // Assumo Leaflet
        const polygonBounds = layer.getBounds();
        mapInit.map.fitBounds(polygonBounds);
      } else {
        console.warn('Nessun boundary trovato per il livello massimo');
      }
    } catch (error) {
      console.error('Errore nel recupero del boundary:', error);
    }
  } else {
    console.warn('Nessun dato per fitBounds: lat/lng null e nessun livello disponibile');
  }

}

function setOptions(level, list, selected){
  const current = level === 0 ? level : parseInt(level) + 1;
  const selectEl = document.getElementById('gid_' + current);
  if(selectEl){
    selectEl.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.text = '-- select value --';
    selectEl.appendChild(defaultOpt);
    list.forEach(item=>{
      const option = document.createElement('option');
      option.value = item.gid;
      option.text = item.name;
      if(selected && item.gid == selected){
        option.selected = true;
      }
      selectEl.appendChild(option);
    });
  }
}


function setMainDataSection(data) {
  Object.keys(data).forEach(key => {
    const element = document.getElementById(key);
    if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
      element.value = data[key];
    }
    if (element && element.tagName === 'SELECT') {
      const valueToSet = key === 'storage_place' ? data[key] : data[key + '_id'];
      element.value = valueToSet;
      
      if (key === 'category_class') {
        const event = new Event('change');
        element.dispatchEvent(event);
      }
    }
  });

  const copyCheckbox = document.getElementById('is_museum_copy');
  if(data['is_museum_copy'] === 1){
    copyCheckbox.checked = true;
  } else {
    copyCheckbox.checked = false;
  }

  if (data['category_specs_id']) {
    const specs = document.getElementById('category_specs');
    if (specs) {
      setTimeout(() => {
        specs.value = data['category_specs_id'];
      }, 500);
    }
  }
}

function setMetadataSection(data) {
    Object.keys(data).forEach(key => {
    const element = document.getElementById(key);
    if (element && element.tagName === 'SELECT') {
      element.value = data[key].id;
    }
  });
}

async function setCronoSection(data) {
  document.getElementById('timeline').value = data.timeline_id;
  const bounds = await getBounds(data.timeline_id);
  await setBounds(bounds);
  
  // Trova i bounds corrispondenti a start e end tramite query
  const lowerBoundData = await fetchBoundForValue(data.timeline_id, data.start);
  const upperBoundData = await fetchBoundForValue(data.timeline_id, data.end);
  
  const lowerBoundLabel = lowerBoundData ? (lowerBoundData.specific || lowerBoundData.generic || lowerBoundData.macro) : 'Custom Range';
  const upperBoundLabel = upperBoundData ? (upperBoundData.specific || upperBoundData.generic || upperBoundData.macro) : 'Custom Range';
  
  setTimeRange(data.start, data.end, true, lowerBoundLabel);
  setTimeRange(data.start, data.end, false, upperBoundLabel);
  
  const start = document.getElementById('start');
  const end = document.getElementById('end');
  start.disabled = false;
  end.disabled = false;
}