import { bsAlert } from "./components/bsComponents.js";
import { initMap, addLayers, refreshClusters } from "./modules/initMaps.js";
import { collectionState } from "./modules/collectionStorage.js";
import { showLoading } from "./helpers/helper.js";
import { domEl, layerControl, openGallery, openPopUp, showGalleryForProps,collectionControl} from "./components/mapsComponent.js";
import { toggleLayer, toggleBaseLayer, handleAdminLevel, calculateMaxBoundsAndZoom} from "./helpers/mapHelper.js";

const turf = window.turf;
const L = window.L;
let map;

async function initializeMap() {
  try {
    showLoading(true);
    if (map && map.map) {
      try { 
        map.map.off(); 
        map.map.remove(); 
      } catch (e) { 
        console.warn('Error removing previous map:', e); 
      }
      map = null;
    }
    if (domEl.baseLayerControl) domEl.baseLayerControl.innerHTML = '';
    if (domEl.poiControl) domEl.poiControl.innerHTML = '';
    if (domEl.collectionsControl) domEl.collectionsControl.innerHTML = '';
    if (domEl.adminControl) domEl.adminControl.innerHTML = '';
    if (domEl.collectionListDropdown) domEl.collectionListDropdown.innerHTML = '';
    if (domEl.activeCollectionTitle) domEl.activeCollectionTitle.innerHTML = '';

    const mapElement = await initMap('map');
    const result = await addLayers(mapElement, { 
      layers: { findplace: true, institutions: true, collections:true, admin: [0,1,2,3,4,5] },
      onClickCallback: {
        findplace: openPopUp,
        institutions: showGalleryForProps,
        collections: openPopUp,
        admin: openGallery,
      }
    });
    map = result.mapElement;
    const availableLevels = result.availableLevels;
    // Ottieni le collection per i controlli
    const stateManager = await collectionState();
    const currentState = stateManager.getState();    
    await Promise.all([
      calculateMaxBoundsAndZoom(map.map),
      layerControl(map, { baseLayers: true, poi: ['findplace', 'institutions'], admin: availableLevels }),
    ]);
    // Aggiungi il controllo collezione se ci sono collezioni
    collectionControl(currentState.collections, currentState.activeCollectionKey);
    const controlElements = [domEl.controlDiv, domEl.mapGalleryWrap, domEl.mapInfo, domEl.collectionDiv].filter(el => el);
    controlElements.forEach(element => {
      L.DomEvent.disableClickPropagation(element);
      L.DomEvent.disableScrollPropagation(element);
    });
    const maxZoomBtn = document.getElementById('maxZoomBtn');
    if (maxZoomBtn) {
      maxZoomBtn.addEventListener('click', (e) => {
        e.preventDefault();
        calculateMaxBoundsAndZoom(map.map);
      });
    }
    
    const findPlaceCheckbox = document.getElementById('findplace-checkBox');
    if(findPlaceCheckbox){
      findPlaceCheckbox.addEventListener('change', function() {
        toggleLayer(map.map, map.findPlaceGroup, this.checked);
      });
    }
  
    const institutionCheckBox = document.getElementById('institutions-checkBox');
    if(institutionCheckBox){
      institutionCheckBox.addEventListener('change', function() {
        toggleLayer(map.map, map.institutionsGroup, this.checked);
      });
    }
  
    document.getElementsByName('admin').forEach(input => {
      input.addEventListener('change', async function() {
        const level = parseInt(this.value);
        await handleAdminLevel(map, level, this.checked, true, result.onClickCallback.admin);
      });
    });

    document.getElementsByName('baseLayer').forEach(input => {
      input.addEventListener('change', (event) => toggleBaseLayer(event, map));
    });
  
    // Aggiungi event listener per checkbox collection
    document.getElementsByName('collection').forEach(input => {
      input.addEventListener('change', function() {
        const collectionName = this.value;
        const collectionLayer = map.collectionGroup[collectionName];
        if (collectionLayer) {
          toggleLayer(map.map, collectionLayer, this.checked);
        }
      });
    });
  
    if (domEl.mapGuideBtn) {
      domEl.mapGuideBtn.addEventListener('click', function() {
        domEl.mapGuide.classList.toggle('visible');
      });
    }
  
    if (domEl.closeGuide) {
      domEl.closeGuide.addEventListener('click', function() {
        domEl.mapGuide.classList.remove('visible');
      });
    }
  
    document.querySelectorAll('#collectionListDropdown .dropdown-item').forEach(btn => {
      btn.addEventListener('click', function() {
        const title = this.textContent || 'Untitled Collection';
        const collectionTitleBtn = document.getElementById('activeCollectionTitle');
        if (collectionTitleBtn) collectionTitleBtn.innerHTML = `Active collection: <strong>${title}</strong>`;
      });
    });

    document
  
    // Preload livello 0 in background
    setTimeout(async () => {
      if (!map.adminGroup[0]) {
        try {
          await handleAdminLevel(map, 0, false, false, result.onClickCallback.admin);
        } catch (error) {
          console.error('Error preloading level 0:', error);
        }
      }
    }, 1000); // Ritardo di 1 secondo per non interferire con l'inizializzazione
  } catch (error) {
    showLoading(false);
    bsAlert('Error initializing map: ' + error.message, 'danger');
    console.error('Error initializing map:', error);
  }finally {
    showLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initializeMap();
});

document.addEventListener('collectionUpdated', async () => {
  await refreshCollectionMarkers()
});

async function refreshCollectionMarkers() {
  if (map) {
    const result = await refreshClusters(map, {
      onClickCallback: {
        collections: openPopUp,
        findplace: openPopUp
      }
    });

    // Ricarica i controlli dei layer con tutte le opzioni per evitare svuotamenti
    const availableLevels = result.availableLevels;  // availableLevels da addLayers
    layerControl(map, { baseLayers: true, poi: ['findplace', 'institutions'], admin: availableLevels });

    // AGGIUNGI QUESTA PARTE - Aggiorna anche il collectionControl
    const stateManager = await collectionState();
    const currentState = stateManager.getState();
    collectionControl(currentState.collections, currentState.activeCollectionKey);


    // Riattacca gli event listener per le checkbox (poiché il DOM è stato ricreato)
    document.getElementsByName('poi').forEach(input => {
      input.addEventListener('change', function() {
        const layer = map.layerControl.poi[this.value]?.layer;
        if (layer) {
          if (this.checked) {
            map.map.addLayer(layer);
          } else {
            map.map.removeLayer(layer);
          }
        }
      });
    });

    document.getElementsByName('collection').forEach(input => {
      input.addEventListener('change', function() {
        const layer = map.collectionGroup[this.value];
        if (layer) {
          if (this.checked) {
            map.map.addLayer(layer);
          } else {
            map.map.removeLayer(layer);
          }
        }
      });
    });

    // Riattacca anche per baseLayer e admin se necessario
    document.getElementsByName('baseLayer').forEach(input => {
      input.addEventListener('change', function() {
        const tile = map.layerControl.baseLayers[this.value]?.tile;
        if (tile) {
          map.map.removeLayer(map.osm);
          map.map.removeLayer(map.gStreets);
          map.map.removeLayer(map.gSat);
          map.map.removeLayer(map.gTerrain);
          map.map.addLayer(tile);
        }
      });
    });

    document.getElementsByName('admin').forEach(input => {
      input.addEventListener('change', function() {
        handleAdminLevel(map, parseInt(this.value), this.checked);
      });
    });
    return true;
  } else {
    console.error('refreshClusters: map non inizializzata');
    return false;
  }
}
