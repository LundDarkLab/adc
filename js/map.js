// Inizializzazione mappa
map = L.map('map').fitWorld().setZoom(defaultZoom);
osm = L.tileLayer(osmTile, { maxZoom: 20, attribution: osmAttrib}).addTo(map);
gStreets = L.tileLayer(gStreetTile,{maxZoom: 20, subdomains:gSubDomains });
gSat = L.tileLayer(gSatTile,{maxZoom: 20, subdomains:gSubDomains});
gTerrain = L.tileLayer(gTerrainTile,{maxZoom: 20, subdomains:gSubDomains});

baseLayers = {
  "OpenStreetMap": osm,
  "Google Terrain":gTerrain,
  "Google Satellite": gSat,
  "Google Street": gStreets
};
layerControl = L.control.layers(baseLayers, null,{collapsed:false}).addTo(map);

L.control.betterscale({metric:true, imperial:false}).addTo(map);
L.control.mousePosition({emptystring:'',prefix:'WGS84'}).addTo(map);

countyGroup = L.featureGroup().addTo(map);
artifactByCounty();

// Controllo personalizzato
let myToolbar = L.Control.extend({
  options: { position: 'topleft'},
  onAdd: function (map) {
    let container = L.DomUtil.create('div', 'extentControl leaflet-bar leaflet-control leaflet-touch');
    
    // Creare il bottone home con vanilla JS
    btnHome = document.createElement('a');
    btnHome.href = '#';
    btnHome.title = 'max zoom';
    btnHome.id = 'maxZoomBtn';
    btnHome.setAttribute('data-bs-toggle', 'tooltip');
    btnHome.setAttribute('data-bs-placement', 'right');
    container.appendChild(btnHome);
    
    // Creare l'icona
    const icon = document.createElement('i');
    icon.className = 'mdi mdi-home';
    btnHome.appendChild(icon);
    
    // Event listener con vanilla JS
    btnHome.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      map.fitBounds(countyGroup.getBounds());
    });
    
    return container;
  }
});

map.addControl(new myToolbar());

async function artifactByCounty() {
  try {
    const formData = new FormData();
    formData.append('trigger', 'artifactByCounty');
    formData.append('filter[]', 'artifact.category_class > 0');
    
    console.log('Invio richiesta a:', API + "stats.php");
    console.log('FormData:', Array.from(formData.entries()));
    
    // Configurazione fetch
    const response = await fetch(API + "stats.php", {
      method: 'POST',
      body: formData
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Prima leggi la risposta come testo per debuggare
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    // Controlla se la risposta è vuota o contiene errori
    if (!responseText.trim()) {
      throw new Error('Risposta vuota dal server');
    }
    
    // Controlla se inizia con caratteri HTML (errore PHP)
    if (responseText.trim().startsWith('<')) {
      console.error('Il server ha restituito HTML invece di JSON:', responseText);
      throw new Error('Il server ha restituito HTML invece di JSON');
    }
    
    // Prova a parsare il JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Errore nel parsing JSON:', parseError);
      console.error('Testo della risposta:', responseText);
      throw new Error(`Errore nel parsing JSON: ${parseError.message}`);
    }
    
    console.log('Dati ricevuti:', data);
    
    // Verifica che data sia un array
    if (!Array.isArray(data)) {
      console.error('I dati ricevuti non sono un array:', data);
      throw new Error('I dati ricevuti non sono nel formato atteso');
    }
    
    // Processare i dati solo se esistono
    if (data.length > 0) {
      // Reset dell'array features per evitare duplicati
      countyJson.features = [];
      
      data.forEach((el, index) => {
        try {
          console.log(`Processando elemento ${index}:`, el);
          
          // Verifica che l'elemento abbia le proprietà necessarie
          if (!el.geometry) {
            console.warn(`Elemento ${index} non ha geometry:`, el);
            return;
          }
          
          let geometry;
          try {
            geometry = typeof el.geometry === 'string' ? JSON.parse(el.geometry) : el.geometry;
          } catch (geoError) {
            console.error(`Errore nel parsing geometry per elemento ${index}:`, geoError);
            return;
          }
          
          countyJson.features.push({
            "type": "Feature",
            "properties": {
              area: 'county', 
              name: el.name || 'Unknown', 
              tot: el.tot || 0
            },
            "geometry": geometry
          });
        } catch (elementError) {
          console.error(`Errore processando elemento ${index}:`, elementError);
        }
      });
      
      if (countyJson.features.length > 0) {
        L.geoJson(countyJson).addTo(countyGroup);
        map.fitBounds(countyGroup.getBounds());
      } else {
        console.warn('Nessuna feature valida è stata creata');
      }
    } else {
      console.warn('Nessun dato ricevuto dal server');
    }
    
  } catch (error) {
    console.error('Errore nel caricamento dei dati:', error);
  }
}
