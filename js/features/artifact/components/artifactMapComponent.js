import { fetchApi } from "../../../shared/utils/fetch.js";
import { bsAlert } from "../../../components/bsComponents.js";
import { levelOptions } from "./adminLevelSelect.js";
export function toggleMapAlert(map) {
  map.on('zoomend', () => {
    const mapAlert = document.getElementById('mapAlert');
    const currentZoom = map.getZoom();
    let alertText, alertClass, mapClick;
    if (currentZoom>=14) {
      alertText = 'Ok, you can click on map to create a marker';
      alertClass = 'alert-success';
    }else {
      alertText = 'To put a marker on map you have to zoom in';
      alertClass = 'alert-warning';
    }
    mapAlert.textContent = alertText;
    mapAlert.classList.remove('alert-success', 'alert-warning');
    mapAlert.classList.add(alertClass);
  });
}

export async function addMArkerOnClick(mapInit){
  mapInit.map.on('click', async (e) => {
    if (mapInit.map.getZoom() < 14) { return; }
    if (e.originalEvent.target.closest('.leaflet-control-container') || e.originalEvent.target.closest('.leaflet-bar')) { return; }
    
    const { lat, lng } = e.latlng;
    if (mapInit.marker) { mapInit.map.removeLayer(mapInit.marker); }
    mapInit.marker = L.marker([lat, lng]).addTo(mapInit.map);
    document.getElementById('latitude').value = lat.toFixed(4);
    document.getElementById('longitude').value = lng.toFixed(4);
    document.getElementById('resetMapValueBtn').classList.remove('hide');
    
    const gid = await reverseGeoLocation(lat, lng);
    
    if (gid && Object.keys(gid).length > 0) {
      const sortedKeys = Object.keys(gid).sort();
      
      // Processa tutti i livelli tranne l'ultimo
      for (let i = 0; i < sortedKeys.length - 1; i++) {
        const key = sortedKeys[i];
        const id = key.split('_')[1];
        await levelOptions(id, gid[key], gid[key]);
      }
      
      // Per l'ultimo livello, imposta direttamente il valore selezionato
      const lastKey = sortedKeys[sortedKeys.length - 1];
      const lastId = lastKey.split('_')[1];
      const lastSelect = document.getElementById(`gid_${lastId}`);
      if (lastSelect) {
        lastSelect.value = gid[lastKey];
      }
    }
  });
}

export function resetMapValue(mapInit){
  if (mapInit.marker) {
    mapInit.map.removeLayer(mapInit.marker);
    mapInit.marker = null;
  }
  document.getElementById('latitude').value = '';
  document.getElementById('longitude').value = '';
  document.getElementById('resetMapValueBtn').classList.add('hide');
}

async function reverseGeoLocation(lat, lng){
  try {
    const payload ={ 
      class: 'Geom', 
      action: 'reverseGeoLocation',
      ll:[lat,lng]
    }
    const result = await fetchApi({ body: payload });
    
    // Gestisci il nuovo formato della risposta
    if(!result.data || !result.data.success){
      bsAlert('Error reverse geolocation: ' + (result.data?.error || 'Unknown error'), 'danger');
      return {};
    }
    
    if(result.data.found === false){
      bsAlert('No administrative area found for these coordinates', 'warning');
      return {};
    }
    
    // Verifica che result.data.data esista
    if(!result.data.data){
      return {};
    }
    
    // Estrai i gid dalla nuova struttura
    let gid = Object.entries(result.data.data)
      .filter(([key, value]) => key.includes("gid_") && value !== undefined && value !== null)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    
    return gid;
  } catch (error) {
    bsAlert('Error reverse geolocation: ' + error.message, 'danger');
    return {};
  }
}