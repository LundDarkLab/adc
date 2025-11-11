import { initGallery as gallery } from "./modules/gallery.js";
import { collection } from "./modules/collection.js";
import { createGalleryItem, getCollectStatusBtn } from "./components/galleryCard.js";
import { bsAlert, bsConfirm } from "./components/bsComponents.js";
import { confirmAction } from "./helpers/helper.js";
import { collectionState } from "./modules/collectionStorage.js";
import { toggleCollectionListBtn } from "./helpers/collectionHelper.js";

const stateManager = await collectionState();
const coll = await collection();

const domEl = {
  activeFilter: document.getElementById('activeFilter'),
  addItemBtn: document.querySelectorAll('.addItemBtn'),
  artifactTot: document.querySelector('#artifactTot > h2'),
  btCancelMetadataFormRequest: document.getElementById('btCancelMetadataFormRequest'),
  btClearCollection: document.getElementById('btClearCollection'),
  btDeleteAllCollections: document.getElementById('btDeleteAllCollections'),
  btDeleteCollection: document.getElementById('btDeleteCollection'),
  btExportActive: document.getElementById('btExportActive'),
  btExportAll: document.getElementById('btExportAll'),
  btImportCollection: document.querySelectorAll('.btImportCollection'),
  btNewCollection: document.querySelectorAll('.btNewCollection'),
  btUpdateMetadata: document.getElementById('btUpdateMetadata'),
  byCategory: document.getElementById('byCategory'),
  byCounty: document.getElementById('byCounty'),
  byEnd: document.getElementById('byEnd'),
  byInstitution: document.getElementById('byInstitution'),
  byMaterial: document.getElementById('byMaterial'),
  byStart: document.getElementById('byStart'),
  byDescription: document.getElementById('byDescription'),
  changeCollectionDropdown: document.getElementById('changeCollectionDropdown'),
  collectionBtnWrap: document.getElementById('collectionBtnWrap'),
  collectionContainer: document.getElementById('collectionContainer'),
  collectionForm: document.getElementById('collectionForm'),
  // collectionListDropdown: document.getElementById('collectionListDropdown'),
  collectionTitle: document.getElementById('collectionTitle'),
  collectionTitleBtn: document.getElementById('collectionTitleBtn'),
  collEmail: document.getElementById('collEmail'),
  collAuthor: document.getElementById('collAuthor'),
  collTitle: document.getElementById('collTitle'),
  collDesc: document.getElementById('collDesc'),
  countCollection: document.getElementById('countCollection'),
  createFromFilteredBtn: document.getElementById('createFromFiltered'),
  cronoChart: document.getElementById('crono_chart'),
  filesTot: document.querySelector('#filesTot > h2'),
  filterForm: document.getElementById('filterForm'),
  filterWrap: document.getElementById('filterWrap'),
  ifileJSON: document.getElementById('ifileJSON'),
  institutionChart: document.getElementById('institution_chart'),
  institutionTot: document.querySelector('#institutionTot > h2'),
  itemTool: document.getElementById('itemTool'),
  loader: document.getElementById('loadingDiv'),
  modelTot: document.querySelector('#modelTot > h2'),
  noCollection: document.getElementById('noCollection'),
  noItemsInCollection: document.getElementById('noItemsInCollection'),
  removeItemBtn: document.querySelectorAll(".removeItemBtn"),
  resetCollectionBtn: document.getElementById('resetCollection'),
  resetGallery: document.getElementById('resetGallery'),
  scrollToTopBtn: document.getElementById('scrollToTopBtn'),
  statWrap: document.getElementById('statWrap'),
  statToggle: document.getElementById('statToggleBtn'),
  sortByBtn: document.getElementById('sortByBtn'),
  sortByList: document.querySelectorAll('#sortByBtn + .dropdown-menu .dropdown-item.sortBy'),
  toggleFilterBtn: document.querySelectorAll('.toggleFilter'),
  toggleTabBtn: document.querySelectorAll('button[data-bs-toggle="tab"]'),
  wrapCollection: document.getElementById('wrapCollection'),
}
domEl.toggleSpan = domEl.statToggle ? domEl.statToggle.querySelector('span') : null;

google.charts.load('current', { 'packages':['corechart']});

document.addEventListener('DOMContentLoaded', function() {
  initNav();
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

async function stateInit() {
  // Lettura: ottiene una copia snapshot dello stato centrale
  const currentState = stateManager.getState();
  getCollectStatusBtn();
}

async function initializeApp() {
  try {
    await stateInit();
    await Promise.all([
      currentPageActiveLink('index.php'),
      interfaceSetup(),
      artifactByCounty(),
      getFilterList(),
      buildStat(),
    ]);
    restoreFormValues();
    await showGallery();
    await showCollection();
    await initializeEventListeners();   
  } catch (error) {
    console.error('Error initializing app:', error);
  } finally {
    if (domEl.loader) domEl.loader.style.display = 'none';
  }
}

export async function showCollection() {
  const currentState = stateManager.getState();
  const activeCollection = currentState.activeCollectionKey;
  if (!activeCollection || !currentState.activeCollection) {
    noCollection(true);
    collectionBtnGroup(false);
    domEl.wrapCollection.style.display = 'none';
    domEl.noItemsInCollection.style.display = 'none';
    domEl.collectionTitleBtn.textContent = 'no collection';
    return;
  }

  const collectionData = currentState.activeCollection;
  const meta = collectionData.metadata || {};
  domEl.collectionTitleBtn.textContent = meta.title || 'Collection metadata';
  const allMetaFilled = [meta.email, meta.author, meta.description].every(val => typeof val === 'string' && val.trim() !== '' && val !== 'undefined');
  const hasItems = Array.isArray(collectionData.items) && collectionData.items.length > 0;

  noCollection(false);

  if (!allMetaFilled) {
    updateMetadataFormVisibility(true, activeCollection, meta);
    domEl.collectionTitle.textContent = meta.title || 'Default Collection';
    domEl.wrapCollection.style.display = 'none';
    domEl.noItemsInCollection.style.display = 'none';
    currentState.collectionFormMode = 'update';
    currentState.editingCollectionKey = activeCollection;
    stateManager.updateState({
      collectionFormMode: currentState.collectionFormMode,
      editingCollectionKey: currentState.editingCollectionKey
    });
    return;
  }
  
  // Se metadata completi, mostra la collezione
  if (!hasItems) {
    domEl.noItemsInCollection.style.display = 'block';
  } else {
    domEl.noItemsInCollection.style.display = 'none';
  }
  
  collectionBtnGroup(true);
  updateMetadataFormVisibility(false);
  buildCollection(collectionData);
  getCollectStatusBtn();
  collectionMetadata(meta);
}

function collectionBtnGroup(show = true){
  if (domEl.collectionBtnWrap) {
    domEl.collectionBtnWrap.style.display = show ? 'block' : 'none';
  }
}

export function noCollection(show = true){
  if (domEl.noCollection) { 
    domEl.noCollection.style.display = show ? 'block' : 'none'; 
  }
  if (domEl.collectionContainer) { 
    domEl.collectionContainer.style.display = show ? 'none' : 'block'; 
  }
  if (show) {
    domEl.collectionTitleBtn.textContent = 'no collection';
    domEl.countCollection.textContent = '';
  }
}

async function onCreateCollection() {
  // Lettura: ottiene una copia snapshot dello stato centrale
  const currentState = stateManager.getState();
  domEl.collectionForm.reset();
  domEl.collectionTitle.textContent = 'Collection metadata';
  domEl.wrapCollection.style.display = 'none';
  updateMetadataFormVisibility(true);
  currentState.collectionFormMode = 'create';
  currentState.editingCollectionKey = null;
  // Aggiornamento: modifica direttamente il singleton
  stateManager.updateState({collectionFormMode: currentState.collectionFormMode});
  stateManager.resetState(['editingCollectionKey']);
}

async function onUpdateCollection() {
  // Lettura: ottiene una copia snapshot dello stato centrale
  const currentState = stateManager.getState();
  domEl.wrapCollection.style.display = 'none';
  const activeCollection = currentState.activeCollectionKey;
  if (!activeCollection){
    bsAlert('No active collection to update!', 'danger');
    return;
  }
  const collectionObj = currentState.collections[activeCollection];
  if (!collectionObj || !collectionObj.metadata) {
    bsAlert('Collection not found!', 'danger');
    return;
  }
  const meta = collectionObj.metadata;
  const fields = [
    { id: 'collEmail', value: meta.email || '' },
    { id: 'collAuthor', value: meta.author || '' },
    { id: 'collTitle', value: meta.title || '' },
    { id: 'collDesc', value: meta.description || '' }
  ];
  fields.forEach(f => {
    const el = domEl[f.id];
    if (el) el.value = f.value;
  });
  domEl.collectionTitle.textContent = meta.title || 'Collection metadata';
  updateMetadataFormVisibility(true);
  currentState.collectionFormMode = 'update';
  currentState.editingCollectionKey = activeCollection;
  stateManager.updateState({
    collectionFormMode: currentState.collectionFormMode,
    editingCollectionKey: currentState.editingCollectionKey
  });
}

function buildCollection(data){
  noCollection(false);
  domEl.collectionTitleBtn.textContent = data.metadata.title;
  if (domEl.countCollection) { domEl.countCollection.textContent = data.items.length; }
  domEl.wrapCollection.style.display = 'grid';
  domEl.wrapCollection.innerHTML = '';

  data.items.forEach(item => {
    const itemEl = createGalleryItem(item,null,galleryInstance.onUnCollect);
    domEl.wrapCollection.appendChild(itemEl);
  });
}

function collectionMetadata(metadata) {
  domEl.collectionTitle.textContent =  metadata.title || 'Collection metadata';
  if (domEl.collEmail) {domEl.collEmail.value = metadata.email || '';}
  if (domEl.collAuthor) {domEl.collAuthor.value = metadata.author || '';}
  if (domEl.collTitle) {domEl.collTitle.value = metadata.title || '';}
  if (domEl.collDesc) {domEl.collDesc.value = metadata.description || '';}
}

function updateMetadataFormVisibility(display = true, activeCollection=null, metadata=null) {
  noCollection(false);
  domEl.collectionForm.style.display = display ? 'block' : 'none';
  if (activeCollection && metadata) {
    collectionMetadata(metadata);
    return;
  }
}

async function interfaceSetup() {
  const currentState = stateManager.getState();
  console.log('Interface setup with state:', currentState.searchFilters);
  
  domEl.createFromFilteredBtn.style.visibility = 'hidden';
  domEl.resetCollectionBtn.style.display = 'none';
  // if(logged.value == 0){ 
  //   if(domEl.itemTool) domEl.itemTool.classList.add('large');
  //   if(domEl.statWrap) domEl.statWrap.classList.add('large');
  // }else{
  //   if(domEl.itemTool) domEl.itemTool.classList.add(checkDevice()=='pc' ? 'small' :'large');
  //   if(domEl.statWrap) domEl.statWrap.classList.add(checkDevice()=='pc' ? 'small' :'large');
  // }
  toggleCollectionListBtn(stateManager, showCollection, coll.setActiveCollection);
}

/////////////////////////////////////////////////////////
// form submit handler init and helper functions /////////
//////////////////////////////////////////////////////////
async function handleCollectionFormSubmit(e) {
  e.preventDefault();
  // Lettura: ottiene una copia snapshot dello stato centrale
  const currentState = stateManager.getState();
  const metadata = getFormMetadata();
  if (!validateMetadata(metadata, currentState)) return;
  
  try {
    if (currentState.collectionFormMode === 'create') {
      await handleCreateCollection(metadata, currentState);
    } else if (currentState.collectionFormMode === 'update') {
      await handleUpdateCollection(metadata, currentState);
    }
    
    // Common post-action cleanup
    resetFormMode(currentState);
    refreshUI();
  } catch (error) {
    console.error('Form submission error:', error);
    bsAlert('An error occurred. Please try again.', 'danger');
  }
}

function getFormMetadata() {
  return {
    email: domEl.collEmail.value.trim(),
    author: domEl.collAuthor.value.trim(),
    title: domEl.collTitle.value.trim(),
    description: domEl.collDesc.value.trim()
  };
}

function validateMetadata(metadata, currentState) {
  if (!metadata.title) {
    bsAlert('Title is required.', 'danger');
    return false;
  }
  if (currentState.collectionFormMode === 'create' && coll.isTitleDuplicate(metadata.title)) {
    bsAlert('Title already exists. Please choose another.', 'danger');
    return false;
  }
  if (currentState.collectionFormMode === 'update' && coll.isTitleDuplicate(metadata.title, currentState.editingCollectionKey)) {
    bsAlert('Title already exists. Please choose another.', 'danger');
    return false;
  }
  return true;
}

async function handleCreateCollection(metadata, currentState) {
  const key = await coll.createCollection(metadata, showCollection);
  
  const updatedState = stateManager.getState();

  updatedState.collectionList[key] = true;
  updatedState.activeCollectionKey = key;
  updatedState.activeCollection = updatedState.collections[key];
  
  stateManager.updateState({
    collectionList: { ...updatedState.collectionList },
    activeCollectionKey: updatedState.activeCollectionKey,
    activeCollection: updatedState.activeCollection
  });
  
  bsAlert('Collection successfully created!', 'success');
  updateMetadataFormVisibility(false, key, metadata);
}

async function handleUpdateCollection(metadata, currentState) {
  const collectionObj = currentState.collections[currentState.editingCollectionKey];
  if (!collectionObj) {
    bsAlert('Collection not found!', 'danger');
    return;
  }
  
  // Update metadata
  collectionObj.metadata = metadata;
  currentState.collections[currentState.editingCollectionKey] = collectionObj;
  currentState.activeCollection = collectionObj;
  
  // Aggiornamento: modifica direttamente il singleton
  stateManager.updateState({
    collections: { ...currentState.collections },
    activeCollection: currentState.activeCollection
  });
  
  bsAlert('Metadata successfully updated!', 'success');
  updateMetadataFormVisibility(false, currentState.editingCollectionKey, metadata);
  domEl.collectionTitle.textContent = metadata.title;
  domEl.collectionTitleBtn.textContent = metadata.title;
}

function resetFormMode(currentState) {
  currentState.collectionFormMode = null;
  currentState.editingCollectionKey = null;
  // Aggiornamento: modifica direttamente il singleton
  stateManager.resetState(['collectionFormMode', 'editingCollectionKey']);
}

// Helper: Refresh UI
async function refreshUI() {
  toggleCollectionListBtn(stateManager, showCollection, coll.setActiveCollection);
  collectionBtnGroup(true);
  getCollectStatusBtn();
  await showCollection();
}
///////////////////////////////////////////////

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
    domEl.byCounty.appendChild(countyFragment);

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
    const response = await fetch(API + "get.php", { method: 'POST', body: formData });
    
    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`);}
    const data = await response.json();
    populateFilterSelects(data);
  } catch (error) {
    console.error('Error loading filter list:', error);
  }
}

// Funzione di utilità per popolare le select
function populateFilterSelects(data) {
  // Usa native DocumentFragment per performance
  const categoryFragment = document.createDocumentFragment();
  const materialFragment = document.createDocumentFragment();
  const institutionFragment = document.createDocumentFragment();

  [categoryFragment, materialFragment, institutionFragment].forEach(frag => {
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select an option';
    defaultOption.value = '';
    defaultOption.selected = true;
    frag.appendChild(defaultOption);
  });

  data.category.forEach((item) => {
    const option = document.createElement('option');
    option.textContent = item.value;
    option.value = item.id;
    categoryFragment.appendChild(option);
  });

  data.material.forEach((item) => {
    const option = document.createElement('option');
    option.textContent = item.value;
    option.value = item.id;
    materialFragment.appendChild(option);
  });

  data.institution.forEach((item) => {
    const option = document.createElement('option');
    option.textContent = item.value;
    option.value = item.id;
    institutionFragment.appendChild(option);
  });

  // Svuota e riempi le select
  domEl.byCategory.innerHTML = '';
  domEl.byMaterial.innerHTML = '';
  domEl.byInstitution.innerHTML = '';
  domEl.byCategory.appendChild(categoryFragment);
  domEl.byMaterial.appendChild(materialFragment);
  domEl.byInstitution.appendChild(institutionFragment);
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

    domEl.artifactTot.textContent = data.artifact.tot;
    domEl.modelTot.textContent = data.model.tot;
    domEl.institutionTot.textContent = data.institution.tot;
    domEl.filesTot.textContent = data.files.tot;

    await new Promise((resolve) => {
      google.charts.setOnLoadCallback(resolve);
    });

    cronoChart(cronoData);
    institutionChart(institutionData);
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function initializeEventListeners() {
  screen.orientation.addEventListener("change", debounce(resizeDOM, 500));

  window.addEventListener('scroll', () => { 
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    let backTopPos = scrollTop > 0 ? '10px' : '50px';
    backToTop.style.transform = 'translate(-50%, ' + backTopPos + ')';
    let activeTab = document.querySelector('#viewCollection')?.classList.contains('active');
    if (activeTab) {  hideStats(); } else { scrollTop > 0 ? hideStats() : showStats(); }
  });

  if (domEl.collectionForm) {
    domEl.collectionForm.addEventListener('submit', handleCollectionFormSubmit); 
  }
  
  domEl.toggleTabBtn.forEach((el) => { el.addEventListener('shown.bs.tab', handleTabChange); });
  
  domEl.toggleFilterBtn.forEach(btn => btn.addEventListener('click', toggleFilter));
  
  if (domEl.createFromFilteredBtn){
    domEl.createFromFilteredBtn.addEventListener('click', createFromFiltered);
  }
  
  if (domEl.resetCollectionBtn){ 
    domEl.resetCollectionBtn.addEventListener('click', resetCollection);
  }
  
  domEl.resetGallery.addEventListener('click', resetGallery);
  
  if (toggleMenuBtn){
    toggleMenuBtn.addEventListener('click', debounce(resizeDOM, 500));
  }

  if (domEl.statToggle){ 
    domEl.statToggle.addEventListener('click', toggleStats); 
  }


  domEl.sortByList.forEach(item => item.addEventListener('click', handleSortChange));

  if (domEl.scrollToTopBtn){
    domEl.scrollToTopBtn.addEventListener('click', () => { 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
    });
  }

  if(domEl.filterForm){
    domEl.filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      showGallery();
    });
  }

  domEl.btImportCollection.forEach(btn => {
    btn.addEventListener('click', async () => {
      const currentState = stateManager.getState();
      if(domEl.ifileJSON) {
        domEl.ifileJSON.value = ''; // reset per permettere re-import dello stesso file
        domEl.ifileJSON.click();
        domEl.ifileJSON.addEventListener('change', async (event) => {
          const file = event.target.files[0];
          if(!file) {return;}
          try {
            const result = await coll.importCollection(file);
            if (result.status === 'success') {
              const key = result.key;
              currentState.collections[key] = result.importedData;
              await coll.setActiveCollection(key);
              bsAlert('Collection successfully imported!', 'success', 3000, async ()=>{
                toggleCollectionListBtn(stateManager, showCollection, coll.setActiveCollection);
                collectionBtnGroup(true);
                getCollectStatusBtn();
                await showCollection();
                noCollection(false);
              });
            } else if (result.status === 'duplicate') {
              await confirmAction(
                `A collection named "${result.title}" already exists. Do you want to overwrite it and merge new items?`,
                async () => { await mergeItems(result); },
                () => { bsAlert('Import cancelled by user.', 'info'); }
              );
            } else {
              bsAlert(result.message, result.status);
            }
          } catch (error) {
            bsAlert('Import failed: ' + error.message, 'danger');
            console.error(error);
          }
        }, { once: true });
      }
    });
  });

  if(domEl.btExportActive) {
    domEl.btExportActive.addEventListener('click', async () => {
      await coll.exportCollection(true);
    });
  }

  if(domEl.btExportAll) {
    domEl.btExportAll.addEventListener('click', async () => {
      await coll.exportCollection(false);
    });
  }

  domEl.btNewCollection.forEach(btn => { 
    btn.addEventListener('click', onCreateCollection); 
  });

  if(domEl.btUpdateMetadata){
    domEl.btUpdateMetadata.addEventListener('click', onUpdateCollection); 
  }

  if(domEl.btCancelMetadataFormRequest) {
    domEl.btCancelMetadataFormRequest.addEventListener('click', async () => {
      const currentState = stateManager.getState();
      domEl.collectionForm.reset();
      updateMetadataFormVisibility(false);
      const activeCollection = currentState.activeCollectionKey;
      if (activeCollection) {
        const collectionObj = currentState.collections[activeCollection];
        if (collectionObj) {
          const meta = collectionObj.metadata || {};
          domEl.collectionTitle.textContent = meta.title || 'Collection metadata';
          domEl.wrapCollection.style.display = 'grid';
        }
      } else {
        domEl.collectionTitle.textContent = 'Collection metadata';
        currentState.activeCollection = null;
        currentState.collectStatus = {};
        stateManager.resetState(['activeCollection', 'activeCollectionKey', 'collectStatus']);
        getCollectStatusBtn();
        collectionBtnGroup(false);
        noCollection(true);
      }

      if (coll.getCollectionList().length === 0) { 
        noCollection(true); 
      }
    });
  }

  if(domEl.btClearCollection) {
    domEl.btClearCollection.addEventListener('click', async () => {
      await confirmAction(
        'Are you sure you want to clear the entire collection? This action cannot be undone.', 
        async () => {
          await coll.clearCollection();
          toggleCollectionListBtn(stateManager, showCollection, coll.setActiveCollection);
          collectionBtnGroup(true);
          getCollectStatusBtn();
          await showCollection();
        }
      );
    });
  }

  if(domEl.btDeleteCollection) {
    domEl.btDeleteCollection.addEventListener('click', async () => {
      await confirmAction(
        'Are you sure you want to delete the entire collection? This action cannot be undone.', 
        async () => {
          await coll.deleteCollection();
          toggleCollectionListBtn(stateManager, showCollection, coll.setActiveCollection);
          collectionBtnGroup(true);
          getCollectStatusBtn();
          await showCollection();
        }
      );
    });
  }

  if(domEl.btDeleteAllCollections) {
    domEl.btDeleteAllCollections.addEventListener('click', async () => {
      await confirmAction(
        'Are you sure you want to delete all collections? This action cannot be undone.', 
        async () => {
          await coll.deleteCollection(true);
          toggleCollectionListBtn (stateManager, showCollection, coll.setActiveCollection);
          collectionBtnGroup(false);
          getCollectStatusBtn();
          await showCollection();
        }
      );
    });
  }
}

async function mergeItems(result) {
  const currentState = stateManager.getState();
  const existingIds = new Set(result.duplicate.items.map(item => item.id));
  const newItems = result.importedData.items.filter(item => !existingIds.has(item.id));
  result.duplicate.items.push(...newItems);
  const key = Object.keys(currentState.collections).find(k => currentState.collections[k] === result.duplicate);
  currentState.collections[key] = result.duplicate;
  stateManager.updateState({ collections: { ...currentState.collections } });
  bsAlert(
    `Collection "${result.title}" updated with ${newItems.length} new items.`, 
    'success', 
    3000, 
    async ()=>{
      toggleCollectionListBtn(stateManager, showCollection, coll.setActiveCollection);
      collectionBtnGroup(true);
      getCollectStatusBtn();
      await showCollection();
    }
  ); 
}

function checkActiveFilter(){
  const currentState = stateManager.getState();
  let displayClass = currentState.searchFilters.activeFilter > 0 ? "visible" : "hidden";
  domEl.createFromFilteredBtn.style.visibility = displayClass;
  domEl.activeFilter.textContent = currentState.searchFilters.activeFilter > 0 ? currentState.searchFilters.activeFilter : '';
}

async function createFromFiltered() {
  try {
    domEl.createFromFilteredBtn.disabled = true;
    domEl.createFromFilteredBtn.innerHTML = '<i class="mdi mdi-loading mdi-spin"></i> adding items...';
    const currentState = stateManager.getState();
    const filters = currentState.searchFilters;
    const body = {
      class: 'Collection',
      action: 'getGallery',
      filterArr: filters.filter,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      getAll: true
    };
    const result = await fetchApi({ url: ENDPOINT, body });
    const allFilteredItems = result.data.gallery;
    const activeKey = currentState.activeCollectionKey;
    if (!activeKey) {
      bsAlert('No active collection!', 'danger');
      return;
    }
    const addedCount = await coll.addItems(activeKey, allFilteredItems);
    bsAlert(`${addedCount} items added to collection!`, 'success');
  
    // Aggiorna UI
    getCollectStatusBtn();
    await showCollection();
  } catch (error) {
    console.error('Error creating collection:', error);
  } finally {
    domEl.createFromFilteredBtn.disabled = false;
    // domEl.createFromFilteredBtn.style.visibility = 'hidden';
    domEl.createFromFilteredBtn.innerHTML = 'add all items';
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

function restoreFormValues() {
  const currentState = stateManager.getState();
  const filterValues = currentState.searchFilters.currentFilter || {};
  domEl.byCounty.value = filterValues.byCounty || '';
  domEl.byInstitution.value = filterValues.byInstitution || '';
  domEl.byCategory.value = filterValues.byCategory || '';
  domEl.byMaterial.value = filterValues.byMaterial || '';
  domEl.byStart.value = filterValues.byStart || '';
  domEl.byEnd.value = filterValues.byEnd || '';
  domEl.byDescription.value = filterValues.byDescription || '';
}

async function getFilter() {
  const currentState = stateManager.getState();
  const filters = { ...currentState.searchFilters };
  const formData = new FormData(domEl.filterForm);
  const filterValues = Object.fromEntries(formData.entries());
  
  // Salva i valori grezzi per il ripristino del form
  filters.currentFilter = filterValues;
  
  // Costruisci filterArr come array di stringhe SQL
  let filterArr = [];
  if (filterValues.byCounty) {
    filterArr.push("af.gid_1 = '" + filterValues.byCounty + "'");
  }
  if (filterValues.byInstitution) {
    filterArr.push("artifact.storage_place = " + filterValues.byInstitution);
  }
  if (filterValues.byCategory) {
    filterArr.push("class.id = " + filterValues.byCategory);
  }
  if (filterValues.byMaterial) {
    filterArr.push("material.id = " + filterValues.byMaterial);
  }
  if (filterValues.byStart) {
    filterArr.push("artifact.start >= " + filterValues.byStart);
  }
  if (filterValues.byEnd) {
    filterArr.push("artifact.end <= " + filterValues.byEnd);
  }
  if (filterValues.byDescription) {
    filterArr.push("(artifact.description like '%" + filterValues.byDescription + "%' or artifact.name like '%" + filterValues.byDescription + "%')");
  }
  
  // Salva l'array costruito
  filters.filter = filterArr;
  
  // Conta i filtri attivi
  let activeFilterCount = Object.values(filterValues).filter(val => val.trim() !== '').length;
  filters.activeFilter = activeFilterCount;
  
  stateManager.updateState({ searchFilters: filters });
  if(screen.width < 576 ) {hideStats();}
  checkActiveFilter();
}

async function handleSortChange(ev) {
  domEl.sortByList.forEach(item => item.classList.remove('active'));
  ev.currentTarget.classList.add('active');
  const sortBy = ev.currentTarget.dataset.sort;
  const sortDir = ev.currentTarget.dataset.order;
  
  const currentState = stateManager.getState();
  const updatedFilters = { ...currentState.searchFilters, sortBy, sortDir };
  stateManager.updateState({ searchFilters: updatedFilters });
  await showGallery();
}

function hideStats() {
  domEl.statWrap.classList.add('statWrapHidden');
  domEl.toggleSpan.classList.remove('mdi-chevron-left');
  domEl.toggleSpan.classList.add('mdi-chevron-right');
}

function showStats() {
  domEl.statWrap.classList.remove('statWrapHidden');
  domEl.toggleSpan.classList.remove('mdi-chevron-right');
  domEl.toggleSpan.classList.add('mdi-chevron-left');
}

async function handleTabChange(pane) {
  if (pane.target.id === 'viewCollection') {
    if(domEl.statToggle) domEl.statToggle.style.transform = 'translate(-50px, 0)';
    hideStats();
    domEl.toggleFilterBtn.forEach(btn => btn.style.visibility = 'hidden');
    if(domEl.sortByBtn) domEl.sortByBtn.style.visibility = 'hidden';
    if(domEl.createFromFilteredBtn) domEl.createFromFilteredBtn.style.visibility = 'hidden';
    if(domEl.filterWrap) domEl.filterWrap.classList.add('d-none');
    window.scrollTo(0, 0);
    await showCollection();
  } else {
    if(domEl.statToggle) domEl.statToggle.style.transform = 'translate(5px, 0)';
    showStats();
    window.scrollTo(0,0);
    domEl.toggleFilterBtn.forEach(btn => btn.style.visibility = 'visible');
    if(domEl.sortByBtn) domEl.sortByBtn.style.visibility = 'visible';
    checkActiveFilter();
  }
  getCollectStatusBtn(); 
}

function resetCollection() {
  if (domEl.removeItemBtn) { domEl.removeItemBtn.forEach(btn => btn.style.display = 'none'); }
  if (domEl.addItemBtn) { domEl.addItemBtn.forEach(btn => btn.style.display = 'block'); }
  
  const currentState = stateManager.getState();
  const updatedFilters = { ...currentState.searchFilters, activeFilter: 0, currentFilter: {}, filter: [] };
  stateManager.updateState({ searchFilters: updatedFilters });
  
  checkActiveFilter();
  if (domEl.filterForm) domEl.filterForm.reset();
  showGallery();
}

function resetGallery() {
  const currentState = stateManager.getState();
  const updatedFilters = { 
    ...currentState.searchFilters, 
    activeFilter: 0, 
    currentFilter: {},
    filter: [],
    sortBy: "id",
    sortDir: "DESC"
  };
  stateManager.updateState({ searchFilters: updatedFilters });
  
  domEl.filterForm.reset();
  if (countyGroup && typeof countyGroup.getBounds === 'function') {
    map2.fitBounds(countyGroup.getBounds());
  } else {
    console.error("countyGroup is not defined or does not have a getBounds method");
  }
  if (galleryInstance && typeof galleryInstance.reset === 'function') {
    galleryInstance.reset();
  }
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
  domEl.filterWrap.classList.toggle('d-none');
  domEl.filterWrap.classList.toggle('d-block');

  domEl.toggleSpan.classList.toggle('mdi-chevron-down');
  domEl.toggleSpan.classList.toggle('mdi-chevron-up');
}

function toggleStats(event) {
  domEl.statWrap.classList.toggle('statWrapHidden');
  domEl.toggleSpan.classList.toggle('mdi-chevron-left');
  domEl.toggleSpan.classList.toggle('mdi-chevron-right');
}

async function showGallery() {
  await getFilter();
  if (galleryInstance && typeof galleryInstance.reset === 'function') { galleryInstance.reset();}
  galleryInstance = gallery(showCollection);
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
    var chart = new google.visualization.PieChart(domEl.institutionChart);
    google.visualization.events.addListener(chart, 'select', function() {
      var selection = chart.getSelection();
      
      if (selection.length > 0) {
        var selectedItem = selection[0];
        if (selectedItem.row !== null) {
          var institutionName = data.getValue(selectedItem.row, 0);
          var artifactCount = data.getValue(selectedItem.row, 1);
          var institutionId = getInstitutionIdByName(institutionName);
          
          if (institutionId) {
            domEl.byInstitution.value = institutionId;
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
    var chart = new google.visualization.BarChart(domEl.cronoChart);

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
            domEl.byStart.value = startValue;
            domEl.byEnd.value = endValue;
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
  const option = Array.from(domEl.byInstitution.options).find(opt => opt.textContent === name);
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
      
      let btnHome = document.createElement('a');
      btnHome.href = '#';
      btnHome.title = 'max zoom';
      btnHome.id = 'maxZoomBtn';
      btnHome.setAttribute('data-bs-toggle', 'tooltip');
      btnHome.setAttribute('data-bs-placement', 'right');
      
      let icon = document.createElement('i');
      icon.className = 'mdi mdi-home';
      btnHome.appendChild(icon);

      container.appendChild(btnHome);
      
      btnHome.addEventListener('click', (e) => {
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

    for (var i = 0; i < grades.length; i++) {
      let row = document.createElement('div');
      div.appendChild(row);

      let img = document.createElement('img');
      img.className = 'arrowGroup arrow' + grades[i];
      img.src = 'img/ico/play.png';
      row.appendChild(img);

      let iEl = document.createElement('i');
      iEl.style.backgroundColor = getColorByGroup(grades[i] + 1);
      row.appendChild(iEl);

      let small = document.createElement('small');
      small.textContent = grades[i] + (grades[i + 1] ? '-' + grades[i + 1] : '+');
      row.appendChild(small);
    }
    return div;
  };
  legend.addTo(map2);
  document.querySelectorAll('.arrowGroup').forEach(el => el.style.visibility = 'hidden');
  map2.fitBounds(countyGroup.getBounds())
}

function filterElement(e){
  domEl.byCounty.value = e.target.feature.properties.id
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