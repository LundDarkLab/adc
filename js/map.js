// Variabili globali
let galleryWrap;
let closeGallery;

// Oggetto per memorizzare i layer di ogni livello
const levelLayers = {};

// Oggetto per tracciare i livelli già caricati
const loadedLevels = {};
const loadingLevels = new Set(); // Per evitare caricamenti multipli

function initMap() {
  map = L.map('map').fitWorld().setZoom(defaultZoom);
  osm = L.tileLayer(osmTile, { maxZoom: 20, attribution: osmAttrib}).addTo(map);
  gStreets = L.tileLayer(gStreetTile,{maxZoom: 20, subdomains:gSubDomains });
  gSat = L.tileLayer(gSatTile,{maxZoom: 20, subdomains:gSubDomains});
  gTerrain = L.tileLayer(gTerrainTile,{maxZoom: 20, subdomains:gSubDomains});

  L.control.betterscale({metric:true, imperial:false}).addTo(map);
  L.control.mousePosition({emptystring:'',prefix:'WGS84'}).addTo(map);

  // disabilita click/drag/scroll sulla mappa quando interagisci col div
  const controlDiv = document.getElementById('layerSwitcher');
  galleryWrap = document.getElementById('mapGalleryWrap');
  const mapInfo = document.getElementById('mapInfo');
  
  const controlElements = [controlDiv, galleryWrap, mapInfo].filter(el => el);
  controlElements.forEach(element => {
    L.DomEvent.disableClickPropagation(element);
    L.DomEvent.disableScrollPropagation(element);
  });

  const baseLayer = {
    'osm': osm,
    'gStreets': gStreets,
    'gSat': gSat,
    'gTerrain': gTerrain
  };
  const allLayers = [osm, gStreets, gSat, gTerrain];

  document.getElementsByName('baselayer').forEach(function(radio) {
    radio.addEventListener('change', function() {
      if (this.checked) {
        allLayers.forEach(layer => {
          if (map.hasLayer(layer)) { map.removeLayer(layer); }
        });
        const selectedLayer = baseLayer[this.value];
        if (selectedLayer) { 
          map.addLayer(selectedLayer); 
        }
      }
    });
  });

  let myToolbar = L.Control.extend({
    options: { position: 'topleft'},
    onAdd: function (map) {
      let container = L.DomUtil.create('div', 'extentControl leaflet-bar leaflet-control leaflet-touch');
      btnHome = document.createElement('a');
      btnHome.href = '#';
      btnHome.title = 'max zoom';
      btnHome.id = 'maxZoomBtn';
      btnHome.setAttribute('data-bs-toggle', 'tooltip');
      btnHome.setAttribute('data-bs-placement', 'right');
      container.appendChild(btnHome);
      
      const icon = document.createElement('i');
      icon.className = 'mdi mdi-home';
      btnHome.appendChild(icon);
      
      btnHome.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (countyGroup.getLayers().length > 0) {
          map.fitBounds(countyGroup.getBounds());
        }
      });
      return container;
    }
  });
  map.addControl(new myToolbar());

  countyGroup = L.featureGroup().addTo(map);
  institutionsGroup = L.featureGroup().addTo(map);
  findPlaceGroup = L.featureGroup().addTo(map);

  loadInstitutions();
  loadFindPlace();
  buildSwitcher(); // Sostituisce loadAllBoundaries()
}

// Funzione per verificare quali livelli hanno geometrie e costruire lo switcher
async function buildSwitcher() {
  try {
    const formData = new FormData();
    formData.append('trigger', 'getAvailableLevels');
    
    const response = await fetch(API + "geom.php", {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!data.success || !Array.isArray(data.levels)) {
      throw new Error('Formato dati non valido');
    }
    
    const overlayDiv = document.getElementById('overlay');
    if (!overlayDiv) {
      console.error('Elemento #overlay non trovato nel DOM');
      return;
    }
    
    console.log('Elemento overlay trovato, creando checkbox...');
    
    // Crea le checkbox per ogni livello disponibile
    data.levels.forEach(levelData => {
      const { level, count, name } = levelData;
      
      console.log(`Creating checkbox for level ${level}: ${name} (${count})`);
      
      const checkDiv = document.createElement('div');
      checkDiv.className = 'form-check';
      
      const checkbox = document.createElement('input');
      checkbox.className = 'form-check-input';
      checkbox.type = 'checkbox';
      checkbox.id = `level-${level}`;
      checkbox.value = level;
      checkbox.checked = level === 0; // Solo livello 0 checked
      
      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.setAttribute('for', `level-${level}`);
      label.textContent = `${name} (${count})`;
      label.setAttribute('data-original-text', `${name} (${count})`); // Salva il testo originale
      
      // Event listener per caricamento lazy
      checkbox.addEventListener('change', function() {
        handleLevelToggle(level, this.checked);
      });
      
      checkDiv.appendChild(checkbox);
      checkDiv.appendChild(label);
      overlayDiv.appendChild(checkDiv);
      
      console.log(`✓ Checkbox created for level ${level}`);
    });
    
    // Carica subito il livello 0 se esiste
    const level0 = data.levels.find(l => l.level === 0);
    if (level0) {
      showLevelLoader(0);
      await loadLevel(0);
      hideLevelLoader(0);
      loadedLevels[0] = true;
      
      // Fit bounds dopo aver caricato il livello 0
      if (countyGroup.getLayers().length > 0) {
        map.fitBounds(countyGroup.getBounds());
      }
    }
    
  } catch (error) {
    console.error('Errore nel caricamento dei livelli disponibili:', error);
    
    // Fallback: carica livelli di default
    const defaultLevels = [0, 1, 2];
    const overlayDiv = document.getElementById('overlay');
    
    if (overlayDiv) {
      defaultLevels.forEach(level => {
        const checkDiv = document.createElement('div');
        checkDiv.className = 'form-check';
        
        const checkbox = document.createElement('input');
        checkbox.className = 'form-check-input';
        checkbox.type = 'checkbox';
        checkbox.id = `level-${level}`;
        checkbox.value = level;
        checkbox.checked = level === 0;
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.setAttribute('for', `level-${level}`);
        label.textContent = getLevelName(level);
        
        checkbox.addEventListener('change', function() {
          handleLevelToggle(level, this.checked);
        });
        
        checkDiv.appendChild(checkbox);
        checkDiv.appendChild(label);
        overlayDiv.appendChild(checkDiv);
      });
      
      // Carica il livello 0 anche nel fallback
      try {
        showLevelLoader(0);
        await loadLevel(0);
        hideLevelLoader(0);
        loadedLevels[0] = true;
      } catch (fallbackError) {
        console.error('Errore anche nel fallback:', fallbackError);
        hideLevelLoader(0); // Assicurati di rimuovere lo spinner anche in caso di errore
      }
    }
  }
}

// Funzione per gestire il toggle dei livelli
async function handleLevelToggle(level, isChecked) {
  if (isChecked) {
    // Mostra il layer se già caricato
    if (loadedLevels[level] && levelLayers[level]) {
      levelLayers[level].addTo(countyGroup);
    } else if (!loadingLevels.has(level)) {
      // Carica il livello se non è già stato caricato
      showLevelLoader(level);
      await loadLevel(level);
      hideLevelLoader(level);
    }
  } else {
    // Nascondi il layer
    if (levelLayers[level]) {
      countyGroup.removeLayer(levelLayers[level]);
    }
  }
}

// Funzione per caricare un singolo livello
async function loadLevel(level) {
  if (loadingLevels.has(level)) return; // Evita caricamenti multipli
  
  loadingLevels.add(level);
  
  try {
    const result = await getBoundaries(level);
    loadedLevels[level] = true;
    console.log(`✓ Livello ${level} caricato: ${result} features`);
    return result;
  } catch (error) {
    console.error(`✗ Errore caricando livello ${level}:`, error);
    return 0;
  } finally {
    loadingLevels.delete(level);
  }
}

// Funzioni per mostrare/nascondere loader per livello specifico
function showLevelLoader(level) {
  const checkbox = document.getElementById(`level-${level}`);
  const label = checkbox?.nextElementSibling;
  
  if (checkbox && label) {
    // Disabilita checkbox e mostra spinner
    checkbox.disabled = true;
    label.innerHTML = `<span class="spinner-border spinner-border-sm me-2" style="width: 0.8rem; height: 0.8rem;"></span>${getLevelName(level)}`;
  }
}

function hideLevelLoader(level) {
  const checkbox = document.getElementById(`level-${level}`);
  const label = checkbox?.nextElementSibling;
  
  if (checkbox && label) {
    // Riabilita checkbox e ripristina il testo originale
    checkbox.disabled = false;
    // Cerca di mantenere il conteggio originale se presente
    const originalText = label.getAttribute('data-original-text') || getLevelName(level);
    label.textContent = originalText;
  }
}

async function getBoundaries(level) {
  const layerName = getLevelName(level);
  
  try {
    const formData = new FormData();
    formData.append('trigger', 'getBoundaries');
    formData.append('level', level);
    formData.append('filter', '');
    
    console.log(`Caricamento livello ${level}...`);
    
    const response = await fetch(API + "geom.php", {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
    const responseText = await response.text();
    
    if (!responseText.trim()) { throw new Error('Risposta vuota dal server');  }
    if (responseText.trim().startsWith('<')) {
      console.error('Il server ha restituito HTML invece di JSON:', responseText);
      throw new Error('Il server ha restituito HTML invece di JSON');
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Errore nel parsing JSON:', parseError);
      throw new Error(`Errore nel parsing JSON: ${parseError.message}`);
    }
    
    // Il server restituisce un oggetto con la proprietà 'items'
    let items = [];
    if (data && Array.isArray(data.items)) {
      items = data.items;
    } else if (Array.isArray(data)) {
      items = data;
    } else {
      console.error('Struttura dati non riconosciuta:', data);
      throw new Error('I dati ricevuti non sono nel formato atteso');
    }
    
    if (items.length > 0) {
      const geoJsonData = {
        "type": "FeatureCollection",
        "features": []
      };
      
      items.forEach((el, index) => {
        try {
          let geometryField = el.geom || el.geometry;
          if (!geometryField) {
            console.warn(`Elemento ${index} non ha geometry:`, el);
            return;
          }
          
          let geometry;
          try {
            geometry = typeof geometryField === 'string' ? JSON.parse(geometryField) : geometryField;
          } catch (geoError) {
            console.error(`Errore nel parsing geometry per elemento ${index}:`, geoError);
            return;
          }
          
          geoJsonData.features.push({
            "type": "Feature",
            "properties": {
              area: 'boundary',
              level: level,
              name: el.country || el.name || 'Unknown', 
              gid: el.gid_0 || el.gid || null,
              tot: el.tot || 0
            },
            "geometry": geometry
          });
        } catch (elementError) {
          console.error(`Errore processando elemento ${index}:`, elementError);
        }
      });
      
      // Crea un layer separato per questo livello
      if (geoJsonData.features.length > 0) {
        const levelLayer = L.geoJson(geoJsonData, {
          style: {
            color: getLevelColor(level),
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
          },
          onEachFeature: adminItems
        });
        
        levelLayers[level] = levelLayer;
        
        // Aggiungi alla mappa solo se la checkbox è attiva
        const checkbox = document.getElementById(`level-${level}`);
        if (checkbox && checkbox.checked) {
          levelLayer.addTo(countyGroup);
        }
        
        console.log(`✓ Livello ${level} completato: ${geoJsonData.features.length} features`);
        return geoJsonData.features.length;
      }
    } else {
      console.log(`Livello ${level}: nessun dato disponibile`);
      return 0;
    }
    
  } catch (error) {
    console.error(`✗ Errore nel caricamento dei dati per livello ${level}:`, error);
    return 0;
  }
}

function getLevelName(level) {
  const levelNames = {
    0: 'Country',
    1: 'Provinces',
    2: 'Districts', 
    3: 'Municipalities',
    4: 'Admin Boundaries Level 1',
    5: 'Admin Boundaries Level 2'
  };
  return levelNames[level] || `Level ${level}`;
}

// Funzione per ottenere il colore del livello
function getLevelColor(level) {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
  return colors[level] || '#34495e';
}

async function loadInstitutions() {
  try {
    const formData = new FormData();
    formData.append('trigger', 'getInstitutionPoint');
    const response = await fetch(API + "geom.php", {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Dati istituzioni:', data);
    if (data && Array.isArray(data.items)) {
      data.items.forEach(institution => {
        if (institution.lat && institution.lon) {
          const marker = L.marker([institution.lat, institution.lon], { icon: storagePlaceIco });
          marker.bindPopup(`<strong>${institution.name || 'Institution'}</strong>`);
          institutionsGroup.addLayer(marker);
        }
      });
    }

    document.getElementById('institutions').addEventListener('change', function() {
      if (this.checked) {
        institutionsGroup.addTo(map);
      } else {
        map.removeLayer(institutionsGroup);
      }
    });
  } catch (error) {
    console.error('Errore nel caricamento delle istituzioni:', error);
  }
}

async function loadFindPlace() {
  try {
    const formData = new FormData();
    formData.append('trigger', 'getFindPlacePoint');
    const response = await fetch(API + "geom.php", {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Dati artefatto:', data);
    if (data && Array.isArray(data.items)) {
      data.items.forEach(obj => {
        if (obj.latitude && obj.longitude) {
          const marker = L.marker([obj.latitude, obj.longitude]);
          marker.bindPopup(`<strong>${obj.name || 'Artefatto'}</strong>`);
          findPlaceGroup.addLayer(marker);
        }
      });
    }
    document.getElementById('findPlace').addEventListener('change', function() {
      if (this.checked) {
        findPlaceGroup.addTo(map);
      } else {
        map.removeLayer(findPlaceGroup);
      }
    });
  } catch (error) {
    console.error('Errore nel caricamento delle istituzioni:', error);
  }
}

function adminItems(feature, layer) {
  // layer.bindPopup(`<strong>${feature.properties.name}</strong><br>Gid: ${feature.properties.gid}<br>Level: ${feature.properties.level}`);
  layer.on('click', function() {
    console.log(`Clicked on ${feature.properties.name}`);
    galleryWrap.classList.add('visible');
  });
}

document.addEventListener('DOMContentLoaded', function() {
  closeGallery = document.getElementById('closeGallery');
  
  if (closeGallery) {
    closeGallery.addEventListener('click', function() {
      galleryWrap.classList.remove('visible');
    });
  }
  
  initMap();
});