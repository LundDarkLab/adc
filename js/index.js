import { initGallery as gallery} from "./modules/gallery.js";
import { collection } from "./modules/collection.js";
import { createGalleryItem} from "./components/galleryCard.js"
import {bsToast } from "./components/bsComponents.js"

const coll = collection();
const filterForm = document.getElementById('filterForm');
const resetCollectionBtn = document.getElementById('resetCollection');


const byCounty = document.getElementsByName('byCounty')[0];
const byInstitution = document.getElementsByName('byInstitution')[0];
const byCategory = document.getElementsByName('byCategory')[0];
const byMaterial = document.getElementsByName('byMaterial')[0];
const byStart = document.getElementsByName('byStart')[0];
const byEnd = document.getElementsByName('byEnd')[0];
const sortByBtn = document.querySelectorAll('.sortBy');
const toggleFilterBtn = document.getElementsByName('toggleFilter')[0]
const statToggle = document.getElementById('statToggleBtn');
const toggleSpan = statToggle.querySelector('span');
const createFromFilteredBtn = document.getElementById('createFromFiltered');
const removeItemBtn = document.querySelectorAll(".removeItemBtn");

let filter = [];
let feature = []
let currentFilter = [];

google.charts.load('current', { 'packages':['corechart']});

document.addEventListener('DOMContentLoaded', function() {
  const popoverElement = document.querySelector('[data-bs-toggle="popover"]');
  if (popoverElement) {   
    const popover = new bootstrap.Popover(popoverElement, {
      html: true,
      trigger: 'click',
      placement: 'auto'
    });

    document.addEventListener('click', function(event) {
      if (!popoverElement.contains(event.target) && !document.querySelector('.popover')?.contains(event.target)) {
        popover.hide();
      }
    });
  }
  initializeApp();
});

async function initializeApp() {
  try {
    // Load data in parallel for better performance
    await Promise.all([
      currentPageActiveLink('index.php'),
      interfaceSetup(),
      artifactByCounty(),
      getFilterList(),
      buildStat(),
    ]);

    await showGallery();
    await showCollection();
    await initializeEventListeners();
  } catch (error) {
    console.error('Error initializing app:', error);
  } finally {
    const loader = document.getElementById('loadingDiv');
    if (loader) loader.style.display = 'none';
  }
}

async function showCollection() {
  const activeCollection = await coll.getActiveCollection();
  // Se non c'è una collezione attiva, mostra il messaggio
  if (!activeCollection) {
    noCollection(true);
    return;
  }
  noCollection(false);

  // Recupera i dati della collezione
  const collectionData = await coll.retrieveCollection(activeCollection);

  // Se ci sono items, controlla i metadata
  const meta = collectionData.metadata || {};
  const allMetaFilled =
    [meta.title, meta.email, meta.author, meta.description].every(val => typeof val === 'string' && val.trim() !== '' && val !== 'undefined');

  if (!allMetaFilled) {
    updateMetadataFormVisibility('block', activeCollection, meta);
    document.getElementById('collectionTitle').textContent = 'Collection';
    return;
  }

  // Se non ci sono items ma i metadata sono compilati, mostra solo la gallery vuota
  if (collectionData.items.length === 0) {
    document.getElementById('noItemsInCollection').style.display = 'block';
    updateMetadataFormVisibility('none');
    buildCollection(collectionData); // Mostra la gallery vuota
    collectionMetadata(activeCollection, meta);
    collectionList();
    return;
  }

  // Se ci sono items e metadata compilati, mostra tutto
  updateMetadataFormVisibility('none');
  buildCollection(collectionData);
  collectionMetadata(activeCollection, meta);
  collectionList();
}

function noCollection(show = true){
  const noCollectionDiv = document.getElementById('noCollection');
  const collectionContainer = document.getElementById('collectionContainer');
  if (noCollectionDiv) { noCollectionDiv.style.display = show ? 'block' : 'none'; }
  if (collectionContainer) { collectionContainer.style.display = show ? 'none' : 'block'; }
}

async function onCreateCollection(){
  try {
    const key = await coll.createCollection();
    const collection = await coll.retrieveCollection(key);
    collectionMetadata(key, collection.metadata);
    bsToast('Collection successfully created!', 'success');
  } catch (error) {
    bsToast(`Collection error! ${error}`, 'error');
  }
}

function buildCollection(data){
  noCollection(false);
  const countCollection = document.getElementById('countCollection');
  if (countCollection) { countCollection.textContent = data.items.length; }
  const wrapCollection = document.getElementById('wrapCollection');
  wrapCollection.innerHTML = '';

  data.items.forEach(item => {
    const itemEl = createGalleryItem(item, 'collection',null,galleryInstance.onUnCollect);
    wrapCollection.appendChild(itemEl);
  });
}

function collectionMetadata(activeCollection, metadata) {
  document.getElementById('collectionTitle').textContent =  metadata.title || 'Collection';
  const email = document.getElementById('collEmail');
  const author = document.getElementById('collAuthor');
  const title = document.getElementById('collTitle');
  const description = document.getElementById('collDesc');

  if(!metadata.title || metadata.title == '' || metadata.title == 'undefined'){
    updateMetadataFormVisibility('block')
  }else{
    updateMetadataFormVisibility('none')
  }

  if (email) {email.value = metadata.email || '';}
  if (author) {author.value = metadata.author || '';}
  if (title) {title.value = metadata.title || '';}
  if (description) {description.value = metadata.description || '';}
}

async function saveCollectionMetadata(e) {
  e.preventDefault();
  const activeCollection = await coll.getActiveCollection();
  const updatedMetadata = {
    email: document.getElementById('collEmail').value,
    author: document.getElementById('collAuthor').value,
    title: document.getElementById('collTitle').value,
    description: document.getElementById('collDesc').value
  };
  try {
    if (activeCollection) {
      let collectionObj = JSON.parse(localStorage.getItem(activeCollection));
      if (collectionObj) {
        collectionObj.metadata = updatedMetadata;
        localStorage.setItem(activeCollection, JSON.stringify(collectionObj));
        bsToast('Metadata successfully updated!', 'success', 3000, ()=>updateMetadataFormVisibility('none', activeCollection, collectionObj.metadata));
      } else {
        bsToast('Collection not found!', 'error');
      }
    }
  } catch (err) {
    bsToast('Error during updating metadata', 'error');
    console.error(err);
  }
}

function updateMetadataFormVisibility(display, activeCollection=null, metadata=null) {
  noCollection(false);
  const metaForm = document.getElementById('collectionForm');
  metaForm.style.display = display;
  if (activeCollection && metadata) {
    collectionMetadata(activeCollection, metadata);
    return;
  }
}

async function collectionList(){
  const list = await coll.getCollectionList();
}

async function interfaceSetup() {
  createFromFilteredBtn.style.visibility = 'hidden';
  resetCollectionBtn.style.display = 'none';
  if(logged.value == 0){ 
    itemTool.classList.add('large');
    statWrap.classList.add('large');
  }else{
    itemTool.classList.add(checkDevice()=='pc' ? 'small' :'large');
    statWrap.classList.add(checkDevice()=='pc' ? 'small' :'large');
  }
}

async function artifactByCounty() {
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  if (countyDataCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    mapStat(countyDataCache);
    return;
  }

  try {
    const formData = new FormData();
    formData.append('trigger', 'artifactByCounty');
    formData.append('filter[]', 'a.category_class > 0');
    
    const response = await fetch(API + "stats.php", {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error('Expected array but got:', typeof data, data);
      throw new Error('Expected array response');
    }
    
    const countyFragment = document.createDocumentFragment();
    data.forEach((county) => {
      const option = document.createElement('option');
      option.textContent = county.name_1;
      option.value = county.gid_1;
      countyFragment.appendChild(option);
    });
    byCounty.appendChild(countyFragment);

    countyDataCache = data;
    cacheTimestamp = Date.now();
    mapStat(data);
    
  } catch (error) {
    console.error('Error loading county data:', error);
  }
}

async function getFilterList() {
  try {
    const formData = new FormData();
    formData.append('trigger', 'getFilterList');
    
    const response = await fetch(API + "get.php", {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Use native DocumentFragment for better performance
    const categoryFragment = document.createDocumentFragment();
    const materialFragment = document.createDocumentFragment();
    const institutionFragment = document.createDocumentFragment();
    
    data.category.forEach((item) => {
      const option = document.createElement('option');
      option.textContent = item.value;
      option.value = item.id;
      categoryFragment.appendChild(option);
    });
    
    // Create options for material
    data.material.forEach((item) => {
      const option = document.createElement('option');
      option.textContent = item.value;
      option.value = item.id;
      materialFragment.appendChild(option);
    });
    
    // Create options for institution
    data.institution.forEach((item) => {
      const option = document.createElement('option');
      option.textContent = item.value;
      option.value = item.id;
      institutionFragment.appendChild(option);
    });
    
    // Append fragments to select elements
    byCategory.appendChild(categoryFragment);
    byMaterial.appendChild(materialFragment);
    byInstitution.appendChild(institutionFragment);
    
  } catch (error) {
    console.error('Error loading filter list:', error);
  }
}

async function buildStat() {
  try {
    const formData = new FormData();
    formData.append('trigger', 'statIndex');
    
    const response = await fetch(API + "stats.php", {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    artifactsTot = data.artifact.tot;
    cronoData.push(['chronology', 'tot', 'start', 'end']);
    institutionData.push(['Institution', 'Artifact stored', 'color']);
    
    data.typeChronologicalDistribution.forEach((v) => {
      cronoData.push([v.crono, v.tot, v.start, v.end]);
    });
    data.institutionDistribution.forEach((v) => {
      institutionData.push([v.name, v.tot, v.color]);
    });
    
    document.querySelector("#artifactTot > h2").textContent = data.artifact.tot;
    document.querySelector("#modelTot > h2").textContent = data.model.tot;
    document.querySelector("#institutionTot > h2").textContent = data.institution.tot;
    document.querySelector("#filesTot > h2").textContent = data.files.tot;

    // Aspetta che Google Charts sia completamente caricato
    await new Promise((resolve) => {
      google.charts.setOnLoadCallback(resolve);
    });

    // Ora inizializza i grafici
    cronoChart(cronoData);
    institutionChart(institutionData);
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function initializeEventListeners() {
  screen.orientation.addEventListener("change", debounce(resizeDOM, 500));

  window.addEventListener('scroll', function() { 
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    let backTopPos = scrollTop > 0 ? '10px' : '50px';
    backToTop.style.transform = 'translate(-50%, ' + backTopPos + ')';
    let activeTab = document.querySelector('#viewCollection')?.classList.contains('active');
    if (activeTab) return;
    scrollTop > 0 ? hideStats() : showStats();
  });

  document.querySelectorAll('button[data-bs-toggle="tab"]').forEach((el) => {
    el.addEventListener('show.bs.tab', handleTabChange);
  });

  toggleFilterBtn.addEventListener('click', toggleFilter);

  if (createFromFilteredBtn){
    createFromFilteredBtn.addEventListener('click', createFromFiltered);
  }

  if (resetCollectionBtn){
    resetCollectionBtn.addEventListener('click', resetCollection);
  }

  document.getElementById('resetGallery').addEventListener('click', resetGallery);

  if (toggleMenuBtn){
    toggleMenuBtn.addEventListener('click', debounce(resizeDOM, 500));
  }

  if (statToggle){
    statToggle.addEventListener('click', toggleStats);
  }

  if (sortByBtn){
    sortByBtn.forEach(btn => btn.addEventListener('click', handleSortChange));
  }

  if (backToTopBtn){
    backToTopBtn.addEventListener('click', () => { 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
    });
  }

  filterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    showGallery();
  });

  document.querySelectorAll('.btNewCollection').forEach(btn => {
    btn.addEventListener('click', onCreateCollection);
  });

  document.getElementById('metadataBtn').addEventListener('click',()=>{
    updateMetadataFormVisibility('block')
  });

  document.getElementById('collectionForm').addEventListener('submit', saveCollectionMetadata);
}

function checkActiveFilter(){
  let displayClass = activeFilter > 0 ? "visible" : "hidden";
  createFromFilteredBtn.style.visibility = displayClass;
  document.getElementById('activeFilter').textContent = activeFilter > 0 ? activeFilter : '';
}

function createFromFiltered() {
  try {
    createFromFilteredBtn.disabled = true;
    createFromFilteredBtn.innerHTML = '<i class="mdi mdi-loading mdi-spin"></i> Creating Collection...';

  } catch (error) {
    console.error('Error creating collection:', error);
  } finally {
    createFromFilteredBtn.style.visibility = 'hidden';
    createFromFilteredBtn.innerHTML = 'Create Collection';
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function getFilter() {
  filter = [];
  let activeFilterCount = 0;
  const formData = new FormData(filterForm);
  const filterValues = Object.fromEntries(formData.entries());
  
  if (filterValues.byCounty) {
    filter.push("af.gid_1 = '" + filterValues.byCounty + "'");
    activeFilterCount++;
    if (typeof county !== 'undefined' && county) {
      county.eachLayer(function(layer) {
        if (layer.feature.properties.id === filterValues.byCounty) {
          map2.fitBounds(layer.getBounds());
        }
      });
    }
  }
  
  if (filterValues.byInstitution) { 
    filter.push("artifact.storage_place = " + filterValues.byInstitution); 
    activeFilterCount++;
  }
  if (filterValues.byCategory) { 
    filter.push("class.id = " + filterValues.byCategory); 
    activeFilterCount++;
  }
  if (filterValues.byMaterial) { 
    filter.push("material.id = " + filterValues.byMaterial); 
    activeFilterCount++;
  }
  if (filterValues.byStart) { 
    filter.push("artifact.start >= " + filterValues.byStart); 
    activeFilterCount++;
  }
  if (filterValues.byEnd) { 
    filter.push("artifact.end <= " + filterValues.byEnd); 
    activeFilterCount++;
  }
  if (filterValues.byDescription) {
    filter.push("(artifact.description like '%" + filterValues.byDescription + "%' or artifact.name like '%" + filterValues.byDescription + "%')");
    activeFilterCount++;
  }  
  // Salva il numero di filtri attivi in una variabile globale, se vuoi
  activeFilter = activeFilterCount;
  if(screen.width < 576 ) {hideStats();}
  checkActiveFilter();
}

function handleSortChange(ev) {
  sort = ev.currentTarget.dataset.sort + " ASC";
  getFilter();
}

function hideStats() {
  statWrap.classList.add('statWrapHidden');
  toggleSpan.classList.remove('mdi-chevron-left');
  toggleSpan.classList.add('mdi-chevron-right');
}

function showStats() {
  statWrap.classList.remove('statWrapHidden');
  toggleSpan.classList.remove('mdi-chevron-right');
  toggleSpan.classList.add('mdi-chevron-left');
}

function handleTabChange(pane) {
  if (pane.target.id === 'viewCollection') {
    statToggle.style.transform = 'translate(-50px, 0)';
    hideStats();
    toggleFilterBtn.style.visibility = 'hidden';
    document.getElementById('sortByBtn').style.visibility = 'hidden';
  }else{
    statToggle.style.transform = 'translate(5px, 0)';
    showStats();
    window.scrollTo(0, 350);
    toggleFilterBtn.style.visibility = 'visible';
    document.getElementById('sortByBtn').style.visibility = 'visible';
  }
}

function resetCollection() {
  removeItemBtn.forEach(btn => btn.style.display = 'none');
  addItemBtn.forEach(btn => btn.style.display = 'block');
  checkActiveFilter();
}

function resetGallery() {
  filter = [];
  sort = "artifact.id DESC";
  activeFilter = 0;
  filterForm.reset();    
  if (countyGroup && typeof countyGroup.getBounds === 'function') {
    map2.fitBounds(countyGroup.getBounds());
  } else {
    console.error("countyGroup is not defined or does not have a getBounds method");
  }
  galleryInstance.reset();
  showGallery();
}

function resizeDOM() {
  if (
    screen.orientation.type.split('-')[0] == 'landscape' &&
    (screen.orientation.angle == 0 || screen.orientation.angle == 180)
  ) {
    map2.remove();
    setTimeout(function() {
      cronoChart();
      institutionChart();
      artifactByCounty();
    }, 500);
  }
}

function toggleFilter() {
  const filterWrap = document.getElementById('filterWrap');
  const toggleSpan = document.querySelector('.toggleFilter span');
  
  filterWrap.classList.toggle('d-none');
  filterWrap.classList.toggle('d-block');
  
  toggleSpan.classList.toggle('mdi-chevron-down');
  toggleSpan.classList.toggle('mdi-chevron-up');
}

function toggleStats(event) {
  const toggleSpan = event.currentTarget.querySelector('span');
  statWrap.classList.toggle('statWrapHidden');
  
  toggleSpan.classList.toggle('mdi-chevron-left');
  toggleSpan.classList.toggle('mdi-chevron-right');
}

async function showGallery() {
  await getFilter();
  feature = [];
  currentFilter = filter;
  if (galleryInstance && typeof galleryInstance.reset === 'function') { galleryInstance.reset();}
  galleryInstance = gallery('index', feature, currentFilter);
}

/******************/
/*****CHARTS ******/

function institutionChart(institutionData) {
  // Verifica che Google Charts sia caricato
  if (!window.google || !google.visualization || !google.visualization.arrayToDataTable) {
    console.warn('Google Charts not ready, retrying...');
    setTimeout(() => institutionChart(institutionData), 100);
    return;
  }

  try {
    var data = google.visualization.arrayToDataTable(institutionData);
    var slices = [];
    for (var i = 0; i < data.getNumberOfRows(); i++) {
      slices.push({color: data.getValue(i, 2)});
    }
    var options = {
      title: 'Total artifacts by institution',
      chartArea: {width: '100%', height: '300px'},
      pieHole: 0.4,
      slices: slices,
      width: '100%',
      height: '300px'
    };
    var chart = new google.visualization.PieChart(document.getElementById('institution_chart'));
    
    google.visualization.events.addListener(chart, 'select', function() {
      var selection = chart.getSelection();
      
      if (selection.length > 0) {
        var selectedItem = selection[0];
        if (selectedItem.row !== null) {
          var institutionName = data.getValue(selectedItem.row, 0);
          var artifactCount = data.getValue(selectedItem.row, 1);
          var institutionId = getInstitutionIdByName(institutionName);
          
          if (institutionId) {
            byInstitution.value = institutionId;
            showGallery();
          }
        }
      }
    });
    
    chart.draw(data, options);
    
  } catch (error) {
    console.error('Error creating institution chart:', error);
  }
}

function cronoChart(cronoData) {
  // Verifica che Google Charts sia caricato
  if (!window.google || !google.visualization || !google.visualization.DataTable) {
    console.warn('Google Charts not ready, retrying...');
    setTimeout(() => cronoChart(cronoData), 100);
    return;
  }

  try {
    // Crea la DataTable solo con le colonne che servono per la visualizzazione
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'chronology');
    data.addColumn('number', 'tot');
    
    // Aggiungi solo le prime due colonne per la visualizzazione
    for (let i = 1; i < cronoData.length; i++) {
      data.addRow([cronoData[i][0], cronoData[i][1]]);
    }

    var options = {
      title: 'Chronological distribution',
      chartArea: {width: '70%', height: '80%', top: 60, left: 100, right: 20, bottom: 60},
      legend: {position: 'top'},
      width: '100%',
      height: '400px',
      hAxis: {
        title: 'Total',
        titleTextStyle: {color: '#333'}
      },
      vAxis: {
        minValue: 0,
        textStyle: {
          fontSize: 12
        }
      }
    };
    var chart = new google.visualization.BarChart(document.getElementById('crono_chart'));

    google.visualization.events.addListener(chart, 'select', function() {
      var selection = chart.getSelection();
      
      if (selection.length > 0) {
        var selectedItem = selection[0];
        if (selectedItem.row !== null) {
          // Accedi direttamente ai dati originali usando l'indice della riga selezionata
          var rowIndex = selectedItem.row + 1; // +1 perché saltiamo la prima riga (header)
          var chronologyName = cronoData[rowIndex][0];
          var artifactCount = cronoData[rowIndex][1];
          var startValue = cronoData[rowIndex][2];
          var endValue = cronoData[rowIndex][3];
          
          if (startValue && endValue) {
            byStart.value = startValue;
            byEnd.value = endValue;
            showGallery();
          }
        }
      }
    });

    chart.draw(data, options);
    
  } catch (error) {
    console.error('Error creating chronology chart:', error);
  }
}


function getInstitutionIdByName(name) {
  for (let i = 1; i < institutionData.length; i++) { 
    if (institutionData[i][0] === name) {
      break;
    }
  }
  const option = Array.from(byInstitution.options).find(opt => opt.textContent === name);
  return option ? option.value : null;
}


/*****************/
/*****  MAP ******/
function mapStat(countyData){
  map2 = L.map('mapChart').fitBounds(mapExt)
  L.maptilerLayer({apiKey: mapTilerKey, style: "dataviz-light"}).addTo(map2)
  countyGroup = L.featureGroup().addTo(map2);
  let countyJson = {"type":"FeatureCollection", "features": []}
  countyData.forEach(el => {
    countyJson.features.push({
      "type": "Feature",
      "properties": {area:'county',id:el.gid_1,name:el.name_1, tot:el.tot},
      "geometry": JSON.parse(el.geometry)
    })
  });
  
  county = L.geoJson(countyJson, {
    style: styleByGroup,
    onEachFeature: onEachFeature
  }).addTo(countyGroup);
  
  
  let myToolbar = L.Control.extend({
    options: { position: 'topleft'},
    onAdd: function (map) {
      let container = L.DomUtil.create('div', 'extentControl leaflet-bar leaflet-control leaflet-touch');
      btnHome = $("<a/>",{href:'#', title:'max zoom', id:'maxZoomBtn'}).attr({"data-bs-toggle":"tooltip","data-bs-placement":"right"}).appendTo(container)
      $("<i/>",{class:'mdi mdi-home'}).appendTo(btnHome)
      
      btnHome.on('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        if(window.location.pathname.includes('artifact_view')){
          map.fitBounds(countyGroup.getBounds())
        }else{
          map2.fitBounds(countyGroup.getBounds())
        }
      });
      return container;
    }
  })
  map2.addControl(new myToolbar());
  
  let legend = L.control({position: 'bottomright'});
  legend.onAdd = function (map2) {
    let div = L.DomUtil.create('div', 'info legend border rounded')
    let grades = [0, 10, 20, 50, 100, 200, 500, 1000]
    let labels = [];
    for (var i = 0; i < grades.length; i++) {
      let row = $("<div/>").appendTo(div)
      let img = $("<img/>",{class:'arrowGroup arrow'+grades[i], src:'img/ico/play.png'}).appendTo(row)
      $("<i/>").css("background-color",getColorByGroup(grades[i] + 1)).appendTo(row)
      $("<small/>").text(grades[i] + (grades[i + 1] ? '-' + grades[i + 1] : '+')).appendTo(row)
    }
    return div;
  };
  legend.addTo(map2);
  $(".arrowGroup").css('visibility','hidden')
  map2.fitBounds(countyGroup.getBounds())
}

function filterElement(e){
  byCounty.value = e.target.feature.properties.id
  map2.fitBounds(e.target.getBounds());
  showGallery();
};

function onEachFeature(feature, layer) {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice) {
    let touchTimeout;
    let isHighlighted = false;
    layer.on({
      touchstart: function(e) {
        e.originalEvent.preventDefault();
        
        // Simula hover dopo un breve delay
        touchTimeout = setTimeout(() => {
          if (!isHighlighted) {
            isHighlighted = true;
            highlightFeature(e);
          }
        }, 200);
      },
      
      touchend: function(e) {
        clearTimeout(touchTimeout);
        
        if (isHighlighted) {
          setTimeout(() => {
            resetHighlight(e);
            isHighlighted = false;
            if(window.location.pathname.includes('artifact_view')){
              zoomToFeature(e);
            } else {
              filterElement(e);
            }
          }, 300);
        }
      },
      
      touchcancel: function(e) {
        clearTimeout(touchTimeout);
        if (isHighlighted) {
          resetHighlight(e);
          isHighlighted = false;
        }
      }
    });
    
  } else {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: (e) => {
        if(window.location.pathname.includes('artifact_view')){
          zoomToFeature(e);
        } else {
          filterElement(e);
        }
      }
    });
  }
}