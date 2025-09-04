import { initGallery as gallery } from './gallery.js';

let currentFilter = [];
let galleryInstance = null;

// Variabili globali
let galleryWrap;
let closeGallery;

// Oggetto per memorizzare i layer di ogni livello
const levelLayers = {};

// Oggetto per tracciare i livelli già caricati
const loadedLevels = {};
const loadingLevels = new Set(); // Per evitare caricamenti multipli

function initMap() {
  // map = L.map('map').fitWorld().setZoom(defaultZoom);
  const bounds = [
  [35.5, -10],   // Sud-Ovest (esempio: sud Europa)
  [60, 30]       // Nord-Est (esempio: nord Europa)
];
map = L.map('map').fitBounds(bounds);
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
  buildSwitcher();
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
    if (!data.success || !Array.isArray(data.levels)) {
      throw new Error('Formato dati non valido');
    }
    
    const overlayDiv = document.getElementById('overlay');
    if (!overlayDiv) {
      console.error('Elemento #overlay non trovato nel DOM');
      return;
    }
    
    // Crea le checkbox per ogni livello disponibile
    data.levels.forEach(levelData => {
      const { level, count, name } = levelData;      
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

  showLoading();
  if (checkbox && label) {
    checkbox.disabled = true;
    label.innerHTML = `<span class="spinner-border spinner-border-sm me-2" style="width: 0.8rem; height: 0.8rem;"></span>${getLevelName(level)}`;
  }
}

function hideLevelLoader(level) {
  const checkbox = document.getElementById(`level-${level}`);
  const label = checkbox?.nextElementSibling;

  hideLoading();
  if (checkbox && label) {
    checkbox.disabled = false;
    const originalText = label.getAttribute('data-original-text') || getLevelName(level);
    label.textContent = originalText;
  }
}

function showLoading(){
  const loadingDiv = document.getElementById('loadingDiv');
  loadingDiv.style.display = 'flex';
}

function hideLoading(){
  const loadingDiv = document.getElementById('loadingDiv');
  loadingDiv.style.display = 'none';
}

async function getBoundaries(level) {
  const layerName = getLevelName(level);
  
  try {
    const formData = new FormData();
    formData.append('trigger', 'getBoundaries');
    formData.append('level', level);
    formData.append('filter', '');    
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
          onEachFeature: openGallery
        });
        
        levelLayers[level] = levelLayer;
        
        // Aggiungi alla mappa solo se la checkbox è attiva
        const checkbox = document.getElementById(`level-${level}`);
        if (checkbox && checkbox.checked) {
          levelLayer.addTo(countyGroup);
        }
        return geoJsonData.features.length;
      }
    } else {
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
    if (data && Array.isArray(data.items)) {
      data.items.forEach(institution => {
        if (institution.lat && institution.lon) {
          const marker = L.marker([institution.lat, institution.lon], { icon: storagePlaceIco });
          marker.on('click', function(e) {
            showGalleryForProps({ institution: institution.id, name: institution.name });
          });
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
    if (data && Array.isArray(data.items)) {
      data.items.forEach(obj => {
        if (obj.latitude && obj.longitude) {
          const marker = L.marker([obj.latitude, obj.longitude], { icon: findplaceIco });
          marker.bindPopup(popUp(obj));
          marker.on('click', function(e) { console.log(obj); });
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

function popUp(properties) {
  let popupContent = "<div class='card popUpCard'>";
  popupContent += `<div class="card-header mapCardHeader">`;
  popupContent += `<img src="archive/thumb/${properties.thumbnail}" alt="${properties.thumbnail}" loading="lazy" class="cardImage" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;16&quot; height=&quot;16&quot; fill=&quot;currentColor&quot; class=&quot;bi bi-image&quot; viewBox=&quot;0 0 16 16&quot;&gt;<path d=&quot;M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0&quot;/><path d=&quot;M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z&quot;/></svg>'; this.className ='cardPlaceholder'"/>`;
  popupContent += `<p class="txt-adc-dark fw-bold headerTxt">${properties.id}</p>`;
  popupContent += "</div>";

  popupContent += `<div class="card-body">`;
  popupContent += `<h3 class="card-title txt-adc-dark fw-bold">${properties.category}</h3>`;
  popupContent += `<p class="m-0 mb-1">${properties.nation} / ${properties.county}</p>`;
  popupContent += `<p class="m-0 mb-1">${properties.institution}</p>`;
  popupContent += `<p class="m-0 mb-1">${properties.start} / ${properties.end}</p>`;
  popupContent += `<p class="txt-adc-dark">${properties.description}</p>`;
  popupContent += "</div>";

  popupContent += `<div class="card-footer">`;
  popupContent += `<a href="artifact_view.php?item=${properties.id}" class="btn btn-adc-blue text-white">View</a>`;
  popupContent += "</div>";

  popupContent += "</div>";
  return popupContent;
}

function openGallery(feature, layer) {
  layer.on('click', async function() {
    showGalleryForProps(feature.properties);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  closeGallery = document.getElementById('closeGallery');
  const mapGuide = document.getElementById('mapGuide');
  const mapGuideBtn = document.getElementById('mapGuideBtn');
  const closeGuide = document.getElementById('closeGuide');

  if (closeGallery) {
    closeGallery.addEventListener('click', function() {
      galleryWrap.classList.remove('visible');
    });
  }

  if (mapGuideBtn) {
    mapGuideBtn.addEventListener('click', function() {
      mapGuide.classList.toggle('visible');
    });
  }

  if (closeGuide) {
    closeGuide.addEventListener('click', function() {
      mapGuide.classList.remove('visible');
    });
  }

  initMap();
});

function showGalleryForProps(props) {
  if (!props) return;
  let feature = null
  let filter = null;
  if (props.institution) {
    feature = 'institution'; 
    filter = [`inst.id = ${props.institution}`]; 
  } 
  else if (props.level !== undefined && props.gid !== undefined) {
    feature = 'boundary'; 
    filter = [`af.gid_${props.level} = '${props.gid}'`]; 
  } 
  else { filter = []; }
  currentFilter = filter;
  const content = document.getElementById('wrapCollection');
  if (content) {
    content.scrollTop = 0;
    content.innerHTML = '';
  }

  if (galleryInstance && typeof galleryInstance.reset === 'function') { galleryInstance.reset();}
  galleryInstance = gallery('map', {name:props.name, type:feature}, currentFilter);
  galleryWrap.classList.add('visible');
}