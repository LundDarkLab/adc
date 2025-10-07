import { bsAlert } from "./components/bsComponents.js";
import { initMap, addLayers } from "./modules/initMaps.js";
import { collectionState } from "./modules/collectionStorage.js";
import { showLoading } from "./helpers/helper.js";
import { domEl, layerControl, openGallery, openPopUp, showGalleryForProps, collectionControl } from "./components/mapsComponent.js";
import { toggleLayer, handleAdminLevel, calculateMaxBoundsAndZoom } from "./helpers/mapHelper.js";

const turf = window.turf;
const L = window.L;

let mapElement = null; // Variabile globale per mantenere il riferimento

async function initializeMap() {
  try {
    showLoading(true);
    mapElement = await initMap('map');
    const result = await addLayers(mapElement, { 
      layers: { findplace: true, institutions: true, collections: true, admin: [0,1,2,3,4,5] },
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

    setupEventListeners(map, result);

    // Preload livello 0 in background
    setTimeout(async () => {
      if (!map.adminGroup[0]) {
        try {
          await handleAdminLevel(map, 0, false, false, result.onClickCallback.admin);
        } catch (error) {
          console.error('Error preloading level 0:', error);
        }
      }
    }, 1000);

    return map;
  } catch (error) {
    showLoading(false);
    bsAlert('Error initializing map: ' + error.message, 'danger');
    console.error('Error initializing map:', error);
    throw error;
  } finally {
    showLoading(false);
  }
}

function setupEventListeners(map, result) {
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
  if (findPlaceCheckbox) {
    findPlaceCheckbox.addEventListener('change', function() {
      toggleLayer(map.map, map.findPlaceGroup, this.checked);
    });
  }

  const institutionCheckBox = document.getElementById('institutions-checkBox');
  if (institutionCheckBox) {
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
}

// Funzione per reinizializzare solo le collezioni
export async function refreshMapCollections() {
  if (!mapElement) {
    console.warn('Map not initialized yet');
    return;
  }

  try {
    // Rimuovi tutti i layer delle collezioni esistenti
    Object.values(mapElement.collectionGroup).forEach(layer => {
      mapElement.map.removeLayer(layer);
    });
    mapElement.collectionGroup = {};

    // Rimuovi solo i controlli delle checkbox collezioni, non tutto collectionsControl
    if (domEl.collectionsControl) {
      domEl.collectionsControl.innerHTML = '';
    }

    // Ricarica solo le collezioni
    const { addCollectionMarkers } = await import('./helpers/mapHelper.js');
    const { fetchCollection } = await import('./helpers/mapHelper.js');
    
    const data = await fetchCollection();
    const collectionsArray = data.collections ? Object.values(data.collections) : [];
    
    if (collectionsArray.length > 0) {
      addCollectionMarkers(mapElement, collectionsArray, openPopUp);
      
      // Ricrea i controlli delle checkbox per le collezioni
      Object.entries(mapElement.collectionGroup).forEach(([collectionName, collectionLayer]) => {
        // Trova la collezione corrispondente per ottenere il colore
        const collection = collectionsArray.find(coll => 
          coll.metadata.title === collectionName
        );
        
        const div = document.createElement('div');
        div.className = 'form-check';
        
        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'checkbox';
        input.name = 'collection';
        input.id = `${collectionName}-checkBox`;
        input.value = collectionName;
        input.checked = true;
        
        // Applica il colore primario se disponibile
        if (collection?.metadata?.color?.primary) {
          const color = collection.metadata.color.primary;
          input.addEventListener('change', function() {
            if (this.checked) {
              this.style.backgroundColor = color;
              this.style.borderColor = color;
              this.style.accentColor = color;
            }
          });
          // Applica subito se è checked
          if (input.checked) {
            input.style.backgroundColor = color;
            input.style.borderColor = color;
            input.style.accentColor = color;
          }
        }
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = input.id;
        label.textContent = collectionName;
        
        div.appendChild(input);
        div.appendChild(label);
        domEl.collectionsControl.appendChild(div);

        // Aggiungi event listener per la checkbox
        input.addEventListener('change', function() {
          const collectionLayer = mapElement.collectionGroup[collectionName];
          if (collectionLayer) {
            toggleLayer(mapElement.map, collectionLayer, this.checked);
          }
        });
      });
      
      // Aggiorna il controllo generale delle collezioni (dropdown, ecc.)
      const stateManager = await collectionState();
      const currentState = stateManager.getState();
      collectionControl(currentState.collections, currentState.activeCollectionKey);
    }
  } catch (error) {
    console.error('Error refreshing map collections:', error);
  }
}

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', initializeMap);

// Listener globale per il refresh delle collezioni
document.addEventListener('collectionUpdated', refreshMapCollections);