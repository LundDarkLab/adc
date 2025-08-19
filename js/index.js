let artifactsTot=0;
// Cache for county data
let countyDataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Prevent browser scroll restoration for better UX with dynamic content
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
} else {
  // Fallback for older browsers
  window.addEventListener('load', () => {
    window.scrollTo(0, 0);
  });
}

/////////////
// DOM Elements Cache (ottimizzazione)
const byCounty = document.getElementsByName('byCounty')[0];
const byInstitution = document.getElementsByName('byInstitution')[0];
const byCategory = document.getElementsByName('byCategory')[0];
const byMaterial = document.getElementsByName('byMaterial')[0];
const byStart = document.getElementsByName('byStart')[0];
const byEnd = document.getElementsByName('byEnd')[0];
const byDescription = document.getElementsByName('byDescription')[0];
const sortBy = document.getElementsByName('sortBy')[0];
const $window = $(window);
const $document = $(document);

// State variables
let activeFilter = 0;
let cronoData = [];
let institutionData = [];

// Infinite scroll optimization
let scrollTimeout;
const SCROLL_THRESHOLD = 200; // Pixels from bottom to trigger load
const DEBOUNCE_DELAY = 100; // ms

// Google Charts
google.charts.load('current', { 'packages':['corechart']});

// Initial setup
$("#createFromFiltered, #resetCollection").hide();

if($("[name=logged]").val() == 0){
  $("#itemTool, #statWrap").addClass('large');
}else{
  $("#itemTool, #statWrap").addClass(checkDevice()=='pc' ? 'small' :'large');
}

currentPageActiveLink('index.php');

// Initialize everything
initializeApp();

// Event Listeners (ottimizzati con delegation dove possibile)
screen.orientation.addEventListener("change", debounce(resizeDOM, 500));

// Filter events
$(".toggleFilter").on('click', toggleFilter);
$("[name=statToggle]").on('click', toggleStats);
$("a.sortBy").on('click', handleSortChange);
$("#resetGallery").on('click', resetGallery);
$("#createFromFiltered").on('click', createFromFiltered);
$("#resetCollection").on('click', resetCollection);
$("#toggleMenu").on('click', resizeDOM);

// Delegated events for dynamic content
$("body").on('click', "#macroList .dropdown-item", handleChronoChange);

// Infinite scroll with debouncing
$window.on('scroll', debounce(handleScroll, DEBOUNCE_DELAY));

// Tab events
document.querySelectorAll('button[data-bs-toggle="tab"]').forEach((el) => {
  el.addEventListener('show.bs.tab', handleTabChange);
});

// ==================== FUNCTIONS ====================

async function initializeApp() {
  try {
    // Load data in parallel for better performance
    await Promise.all([
      artifactByCounty(),
      getFilterList(),
      buildStat()
    ]);
        
    // Load first page
    resetPagination();
    buildGallery(gallery, 1, false);
    
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

function resetPagination() {
  currentPage = 1;
  hasMoreItems = true;
  isLoading = false;
}

function loadNextPage() {
  if (!hasMoreItems || isLoading) return;
  
  currentPage++;
  buildGallery(gallery, currentPage, true);
}

function handleScroll() {
  const scrollTop = $window.scrollTop();
  const windowHeight = $window.height();
  const documentHeight = $document.height();
  
  // Handle stats visibility
  handleStatsVisibility(scrollTop);
  
  // Handle infinite scroll
  if (scrollTop + windowHeight >= documentHeight - SCROLL_THRESHOLD) {
    if (hasMoreItems && !isLoading) {
      loadNextPage();
    }
  }
}

function handleStatsVisibility(scrollTop) {
  const statWrap = document.getElementById("statWrap");
  const statToggle = document.querySelector("[name=statToggle]");
  
  if (scrollTop > 0) {
    if (statWrap.classList.contains('statWrapVisible')) {
      statWrap.classList.remove('statWrapVisible');
      statWrap.classList.add('statWrapHidden');
      
      const toggleSpan = statToggle.querySelector('span');
      toggleSpan.classList.remove('mdi-chevron-left');
      toggleSpan.classList.add('mdi-chevron-right');
    }
  } else {
    if (statWrap.classList.contains('statWrapHidden')) {
      statWrap.classList.remove('statWrapHidden');
      statWrap.classList.add('statWrapVisible');
      
      const toggleSpan = statToggle.querySelector('span');
      toggleSpan.classList.remove('mdi-chevron-right');
      toggleSpan.classList.add('mdi-chevron-left');
    }
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
  const statWrap = document.getElementById('statWrap');
  const toggleSpan = event.currentTarget.querySelector('span');
  
  statWrap.classList.toggle('statWrapVisible');
  statWrap.classList.toggle('statWrapHidden');
  
  toggleSpan.classList.toggle('mdi-chevron-left');
  toggleSpan.classList.toggle('mdi-chevron-right');
}

function handleSortChange() {
  sort = $(this).data('sort') + " asc";
  resetPagination();
  getFilter();
}

function handleFilterChange() {
  resetPagination();
  getFilter();
}

function handleChronoChange(el) {
  $("#macroList .dropdown-item").removeClass('active');
  $(el.target).addClass('active');
  $("#chronoDropDownBtn").text($(el.target).text());
  resetPagination();
  getFilter();
}

function handleTabChange(event) {
  if (event.target.id == 'viewCollection') {
    window.scrollTo(0, 350);
  }
}

function resetGallery() {
  filter = [];
  sort = "artifact.id DESC";
  activeFilter = 0;
  
  // Reset del form
  document.getElementById('filterForm').reset();  
  resetPagination();
  buildGallery(gallery, 1, false);
  
  if (countyGroup && typeof countyGroup.getBounds === 'function') {
    map2.fitBounds(countyGroup.getBounds());
  } else {
    console.error("countyGroup is not defined or does not have a getBounds method");
  }
}

function createFromFiltered() {
  $(".addItemBtn").trigger('click');
  $(this).hide();
}

function resetCollection() {
  $(".removeItemBtn").hide();
  $(".addItemBtn").show();
  buildCollection();
  checkActiveFilter();
}

function getFilter() {
  filter = [];
  
  // Ottieni tutti i dati del form in una volta
  const formData = new FormData(document.getElementById('filterForm'));
  
  // Converti FormData in un oggetto normale per facilità d'uso
  const filterValues = Object.fromEntries(formData.entries());
  
  // Costruisci i filtri solo per i campi con valori
  if (filterValues.byCounty) {
    filter.push("af.gid_1 = '" + filterValues.byCounty + "'");
    
    // Zoom to selected county on map
    if (typeof county !== 'undefined' && county) {
      county.eachLayer(function(layer) {
        if (layer.feature.properties.id === filterValues.byCounty) {
          map2.fitBounds(layer.getBounds());
        }
      });
    }
  }
  
  if (filterValues.byInstitution) { filter.push("artifact.storage_place = " + filterValues.byInstitution); }
  if (filterValues.byCategory) { filter.push("class.id = " + filterValues.byCategory); }
  if (filterValues.byMaterial) { filter.push("material.id = " + filterValues.byMaterial); }
  if (filterValues.byStart) { filter.push("artifact.start >= " + filterValues.byStart); }
  if (filterValues.byEnd) { filter.push("artifact.end <= " + filterValues.byEnd); }
  if (filterValues.description) {
    filter.push("(artifact.description like '%" + filterValues.description + "%' or artifact.name like '%" + filterValues.description + "%')");
  }
  
  
  resetPagination();
  document.getElementById('wrapGallery').innerHTML = '';
  
  if(screen.width < 576 ) {handleStatsVisibility(100);}
  buildGallery(gallery, 1, false);
}

// Aggiungi event listener per il form in JavaScript puro
document.getElementById('filterForm').addEventListener('submit', function(e) {
  e.preventDefault();
  resetPagination();
  getFilter();
});

function initializeEventListeners() {
  // Reset gallery
  document.getElementById('resetGallery').addEventListener('click', resetGallery);
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
    
    // Create options for category
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

function checkActiveFilter(){
  filter.length > 0 ? $("#createFromFiltered").show() : $("#createFromFiltered").hide();
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

    google.charts.setOnLoadCallback(cronoChart);
    google.charts.setOnLoadCallback(institutionChart);
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function artifactByCounty() {
  // Check if we have valid cached data
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
    // Verifica che data sia un array
    if (!Array.isArray(data)) {
      console.error('Expected array but got:', typeof data, data);
      throw new Error('Expected array response');
    }
    
    // Popola il dropdown delle county
    const countyFragment = document.createDocumentFragment();
    data.forEach((county) => {
      // county.fillOpacity = county.tot > 0 ? 0.7 : 0.1;
      const option = document.createElement('option');
      option.textContent = county.name_1;
      option.value = county.gid_1;
      countyFragment.appendChild(option);
    });
    byCounty.appendChild(countyFragment);

    // Cache the response
    countyDataCache = data;
    cacheTimestamp = Date.now();
    mapStat(data);
    
  } catch (error) {
    console.error('Error loading county data:', error);
  }
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

function institutionChart() {
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
          resetPagination();
          getFilter();
        }
      }
    }
  });
  
  chart.draw(data, options);
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

function cronoChart() {
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
        console.log(selectedItem);
        
        // Accedi direttamente ai dati originali usando l'indice della riga selezionata
        var rowIndex = selectedItem.row + 1; // +1 perché saltiamo la prima riga (header)
        var chronologyName = cronoData[rowIndex][0];
        var artifactCount = cronoData[rowIndex][1];
        var startValue = cronoData[rowIndex][2]; // Valore start
        var endValue = cronoData[rowIndex][3];   // Valore end
        
        console.log('Selected chronology:', chronologyName);
        console.log('Artifact count:', artifactCount);
        console.log('Start value:', startValue);
        console.log('End value:', endValue);
        
        // Imposta i valori nei campi del filtro e applica il filtro
        if (startValue && endValue) {
          byStart.value = startValue;
          byEnd.value = endValue;
          resetPagination();
          getFilter();
        }
      }
    }
  });

  chart.draw(data, options);
}

// Utility function for debouncing
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

// Chiamare questa funzione nell'inizializzazione
document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();
});