import { bsAlert } from "./components/bsComponents.js";
import { initMap, addLayers } from "./modules/initMaps.js";
import { collectionState } from "./modules/collectionStorage.js";
import { showLoading } from "./helpers/helper.js";
import { domEl, layerControl, openGallery, openPopUp, showGalleryForProps,collectionControl} from "./components/mapsComponent.js";
import { toggleLayer, handleAdminLevel, calculateMaxBoundsAndZoom } from "./helpers/mapHelper.js";

const turf = window.turf;
const L = window.L;

document.addEventListener('DOMContentLoaded', async function() {
  try {
    showLoading(true);
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
    const map = result.mapElement;
    const availableLevels = result.availableLevels;

    // Ottieni le collection per i controlli
    const stateManager = await collectionState();
    const currentState = stateManager.getState();    

    await Promise.all([
      calculateMaxBoundsAndZoom(map.map),
      layerControl(map, { baseLayers: true, poi: ['findplace', 'institutions'], admin: availableLevels }),
    ]);

    // Aggiungi il controllo collezione se ci sono collezioni
    if (Object.values(currentState.collections).length > 0) {
      collectionControl(currentState.collections, currentState.activeCollectionKey);
    }

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
      input.addEventListener('change', function() {
        if (this.checked) {
          const selectedLayer = map.layerControl.baseLayers[this.value];
          for (const otherLayer of Object.values(map.layerControl.baseLayers)) {
            if (otherLayer.tile !== selectedLayer.tile) { map.map.removeLayer(otherLayer.tile); }
          }
          if (selectedLayer) { selectedLayer.tile.addTo(map.map); }
        }        
      });
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
  

});