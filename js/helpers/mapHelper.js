import { bsAlert } from "../components/bsComponents.js";
import { collectionState } from "../modules/collectionStorage.js";
import mapsConfig from "./mapsConfig.js";
import { showLoading } from "../helpers/helper.js";
import { collection } from "../modules/collection.js";

const stateManager = await collectionState();
const coll = await collection();

export async function fetchCollection(){
  const currentState = stateManager.getState();
  return currentState;
}

export function addCollectionMarkers(mapElement, collections, onClickCallback) {
  if (!mapElement || !mapElement.collectionGroup) {
    console.error('mapElement o collectionGroup non valido');
    return;
  }
  if (!Array.isArray(collections)) {
    console.warn('Collections non è un array:', collections);
    return;
  }
  
  collections.forEach(collection => {
    if (!collection.items || !Array.isArray(collection.items)) return;
    const validItems = collection.items.filter((item) => item.latitude !== null && item.longitude !== null);
    if (validItems.length === 0) {
      console.warn(`Nessun item con coordinate valide per la collection: ${collection.name}`);
      return;
    }

    let colors = collection.metadata.color;
    if (!colors) {
      colors = coll.generateCollectionColor();
      const currentState = stateManager.getState();
      const collectionKey = Object.keys(currentState.collections).find(key => 
        currentState.collections[key].metadata.title === collection.metadata.title
      );
      
      if (collectionKey) {
        const updatedCollection = {
          ...currentState.collections[collectionKey],
          metadata: {
            ...currentState.collections[collectionKey].metadata,
            color: colors
          }
        };
        
        const updatedCollections = {
          ...currentState.collections,
          [collectionKey]: updatedCollection
        };
        
        // Usa updateState per salvare nello storage
        stateManager.updateState({ collections: updatedCollections });
      }
    }

    const collectionLayer = L.markerClusterGroup({
      singleMarkerMode: true,
      disableClusteringAtZoom:17,
      iconCreateFunction: function(cluster) {
        var count = cluster.getChildCount();
        var size = 20 + (count * 2);
        return new L.DivIcon({
          html: createClusterIcon(count,size,colors),
          className: 'custom-cluster',
          iconSize: L.point(size, size)
        });
      }
    });

    // Aggiungi i marker al cluster
    validItems.forEach(item => {
      const marker = L.marker([item.latitude, item.longitude]);
      marker.bindPopup(()=>onClickCallback(item));
      collectionLayer.addLayer(marker);
    });
    
    // Salva il cluster nel mapElement usando il nome della collection
    mapElement.collectionGroup[collection.metadata.title] = collectionLayer;

    // Aggiungi il layer alla mappa (sarà controllato dalle checkbox)
    mapElement.map.addLayer(collectionLayer);    
  });
}

export async function fetchFindPlace(id=null){
  try {
    const body ={ class: 'Geom', action: 'getFindPlacePoint' }
    if(id && id !== '' && id !== null && id !== undefined){ body.id = id; }
    const result = await fetchApi({ url: ENDPOINT, body });
    return result;
  } catch (error) {
    bsAlert('Error loading findplace: ' + error.message, 'danger');
  }
}

export function addFindPlaceMarkers(mapElement, data, onClickCallback) {
  if (!mapElement) {
    console.error('mapElement o findPlaceGroup non valido');
    return;
  }
  if (!data || data.error !== 0 || !data.data?.items?.length) {
    console.warn('Nessun dato valido per marker:', data);
    return;
  }

  mapElement.findPlaceGroup = L.markerClusterGroup({
    singleMarkerMode: true,
    disableClusteringAtZoom: 17,
    iconCreateFunction: function(cluster) {
      var count = cluster.getChildCount();
      var size = 20 + (count * 2);
      return new L.DivIcon({
        html: '<div style="background: radial-gradient(circle, rgba(0,128,0,0.6) 0%, rgba(0,100,0,0.9) 100%); border: 2px solid rgba(255,255,255,0.5); color: white; border-radius: 50%; width: ' + size + 'px; height: ' + size + 'px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 0 5px rgba(0,0,0,0.3);">' + count + '</div>',
        className: 'custom-cluster-green',
        iconSize: L.point(size, size)
      });
    }
  }).addTo(mapElement.map);

  // Ensure layerControl knows about this POI so layerControl can show correct count/label
  if (!mapElement.layerControl) mapElement.layerControl = { baseLayers: {}, poi: {}, admin: {} };
  mapElement.layerControl.poi = mapElement.layerControl.poi || {};
  mapElement.layerControl.poi['findplace'] = mapElement.layerControl.poi['findplace'] || {};
  mapElement.layerControl.poi['findplace'].layer = mapElement.findPlaceGroup;
  mapElement.layerControl.poi['findplace'].label = mapElement.layerControl.poi['findplace'].label || 'Find place';

  
  data.data.items.forEach(item => {
    item.feature = 'findplace';
    if (item.latitude && item.longitude) {
      const marker = L.marker([item.latitude, item.longitude], {
        icon: mapsConfig.findplaceIco
      });
      marker.bindPopup(() => onClickCallback(item));
      mapElement.findPlaceGroup.addLayer(marker);
    }
  });

  // force ensure added to map (if removed before)
  if (mapElement.map && !mapElement.map.hasLayer(mapElement.findPlaceGroup)) {
    mapElement.findPlaceGroup.addTo(mapElement.map);
  }
}

export async function fetchInstitution(id=null){
  try {
    const body ={ class: 'Geom', action: 'getInstitutionPoint' }
    if(id && id !== '' && id !== null && id !== undefined){ body.id = id; }
    const result = await fetchApi({ url: ENDPOINT, body });
    return result;
  } catch (error) {
    bsAlert('Error loading institutions: ' + error.message, 'danger');
  }
}


export function addInstitutionMarkers(mapElement, data, onClickCallback) {
  if (!mapElement) {
    console.error('mapElement o institutionsGroup non valido');
    return;
  }
  if (!data || data.error !== 0 || !data.data?.items?.length) {
    console.warn('Nessun dato valido per marker:', data);
    return;
  }

  const colors = { gradientStart: 'rgba(135,94,42,0.6)', gradientEnd: 'rgba(135,94,42,0.9)' };

  mapElement.institutionsGroup = L.markerClusterGroup({
      singleMarkerMode: true,
      disableClusteringAtZoom:17,
      iconCreateFunction: function(cluster) {
        var count = cluster.getChildCount();
        var size = 20 + (count * 2);
        return new L.DivIcon({
          html: createClusterIcon(count,size,colors),
          className: 'custom-cluster-orange',
          iconSize: L.point(size, size)
        });
      }
  }).addTo(mapElement.map); 
  
  data.data.items.forEach(item => {
    item.feature = 'institution';
    if (item.lat && item.lon) {
      const marker = L.marker([item.lat, item.lon], {
        icon: mapsConfig.storagePlaceIco
      });

      if (onClickCallback && typeof onClickCallback === 'function') {
        marker.on('click', () => onClickCallback(item));
      }
      mapElement.institutionsGroup.addLayer(marker);
    }
  });
}

export async function getAvailableLevels(levels) {
  try {
    const body = { class: 'Geom', action: 'getAvailableLevels', levels:levels };
    const result = await fetchApi({ url: ENDPOINT, body });
    return result;
  } catch (error) {
    bsAlert('Error loading admin boundaries: ' + error.message, 'danger');
  }
}

export async function fetchAdminBoundaries(level, filter = '', status = false) {
  try {
    const body = { class: 'Geom', action: 'getBoundaries', level: level, filter: filter };
    if(status){body.status = status;}
    const result = await fetchApi({ url: ENDPOINT, body });
    return result;
  } catch (error) {
    bsAlert(`Error loading admin level ${level}: ` + error.message, 'danger', 5000);
    console.error(`Error loading admin level ${level}:`, error);
  }
}

export function toggleLayer(map, layer, checked){
  if(!map || !layer){
    console.error('Map o layer non validi'); 
    return; 
  }
  checked ? map.addLayer(layer) : map.removeLayer(layer);
}

export function toggleBaseLayer(event,map){
  const selectedValue = event.currentTarget.value;
  const selectedLayer = map.layerControl.baseLayers[selectedValue];
  if(selectedLayer){
    for (const otherLayer of Object.values(map.layerControl.baseLayers)) {
      if (otherLayer.tile !== selectedLayer.tile) {
        map.map.removeLayer(otherLayer.tile);
      }
    }
    selectedLayer.tile.addTo(map.map);
  };
}

export async function handleAdminLevel(mapElement, level, checked, add = true, onClickCallback = null) {
  if (checked || !add) {
    if (mapElement.adminGroup[level]) {
      if (add) {
        toggleLayer(mapElement.map, mapElement.adminGroup[level].layer, checked);
      }
    } else {
      if (add) showLoading(true);
      const geoData = await fetchAdminBoundaries(level);
      if (add) showLoading(false);
      
      if (geoData && geoData.data && geoData.data.items) {
        const levelGroup = L.featureGroup();
        const geoJsonLayer = createGeoJsonLayer(geoData.data.items, { level, onClickCallback });
        if (geoJsonLayer) {
          geoJsonLayer.addTo(levelGroup);
          mapElement.adminGroup[level] = { layer: levelGroup, geoJson: geoJsonLayer };
          if (add) {
            toggleLayer(mapElement.map, levelGroup, checked);
          }        
        }
      }
    }
  } else {
    if (mapElement.adminGroup[level]) {
      toggleLayer(mapElement.map, mapElement.adminGroup[level].layer, checked);
    }
  }
}

export function createGeoJsonLayer(data, options = {}) {
  if (!data || !Array.isArray(data)) {
    console.warn('Dati non validi per createGeoJsonLayer:', data);
    return null;
  }
  const features = data.map(item => {
    if (item.geom) {
      const geom = JSON.parse(item.geom);
      const simplified = options.simplify !== false ? turf.simplify(geom, { tolerance: options.tolerance || 0.05, highQuality: true }) : geom;
      return {
        type: "Feature",
        geometry: simplified,
        properties: {
          feature: options.feature || 'admin',
          level: options.level || 0,
          gid: item.gid,
          name: item.name
        }
      };
    }
    return null;
  }).filter(f => f);

  if (features.length === 0) return null;

  const geoJsonData = { type: "FeatureCollection", features: features };
  const geoJsonOptions = getGeoJsonOptions(options.level || 0, options.onClickCallback);
  if (options.style) {
    geoJsonOptions.style = { ...geoJsonOptions.style, ...options.style };
  }

  return L.geoJSON(geoJsonData, geoJsonOptions);
}

export function calculateMaxBoundsAndZoom(map) {
  let overallBounds = L.latLngBounds();
  let hasValidBounds = false;

  map.eachLayer(function(layer) {
    if (layer.getBounds && typeof layer.getBounds === 'function') {
      try {
        const bounds = layer.getBounds();
        if (bounds && bounds.isValid && bounds.isValid()) {
          overallBounds.extend(bounds);
          hasValidBounds = true;
        }
      } catch (e) {
        console.warn('Error getting bounds for layer:', e);
      }
    }
  });

  if (hasValidBounds && overallBounds.isValid()) {
    map.fitBounds(overallBounds);
  } else {
    map.setView(mapsConfig.mapExt, mapsConfig.defaultZoom);
  }
}

export function getGeoJsonOptions(level, callback = null) {
  return {
    style: {
      color: getLevelColor(level),
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.3
    },
    onEachFeature: callback
  };
}

function getLevelColor(level) {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
  return colors[level] || '#34495e';
}

const zoomThresholds = {
  0: { min: 2, max: 6 },
  1: { min: 7, max: 9 },
  2: { min: 10, max: 12 },
  3: { min: 13, max: 15 },
  4: { min: 16, max: 18 },
  5: { min: 19, max: 21 },
  6: { min: 22, max: 24 }
};
let activeThreshold = null;
export function zoomEvent(currentZoom, mapElement) {
  for (const [level, range] of Object.entries(zoomThresholds)) {
    if (currentZoom >= range.min && currentZoom <= range.max) {
      activeThreshold = level;
    }
  }
  for(let l = 0; l <= 6; l++){
    const levelCheckbox = document.getElementById(`admin-level-${l}`);
    if(!levelCheckbox) {return;}
    const adminLayer = mapElement.adminGroup[l]?.layer;
    if(l < activeThreshold){
      levelCheckbox.disabled = true;
      if(adminLayer && mapElement.map.hasLayer(adminLayer)){
        toggleLayer(mapElement.map, adminLayer, false);
      }
    } else {
      levelCheckbox.disabled = false;
      if(levelCheckbox.checked){
        if(adminLayer && !mapElement.map.hasLayer(adminLayer)){
          toggleLayer(mapElement.map, adminLayer, true);
        }
      }
    }
  }
}

function createClusterIcon(count,size, colors) {
  return `<div style="background: radial-gradient(circle, ${colors.gradientStart} 0%, ${colors.gradientEnd} 100%); border: 2px solid rgba(255,255,255,0.5); color: white; border-radius: 50%; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 0 5px rgba(0,0,0,0.3);">${count}</div>`;
}