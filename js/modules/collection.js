import { collectionState } from "./collectionStorage.js";
import { bsAlert } from "../components/bsComponents.js";
import { getCollectStatusBtn } from "../components/galleryCard.js";
import { getDateString, sanitizeString, generateUUID } from "../helpers/utils.js";
import { toggleCollectionListBtn } from "../helpers/collectionHelper.js";

const stateManager = await collectionState();  // Singleton: ora tutti i moduli condividono la stessa istanza di stateManager
// Nota: nessun stato locale globale qui; tutto passa attraverso il singleton

export async function collection(){
  // Lettura: ottiene una copia snapshot dello stato centrale per basePath e template
  const currentState = stateManager.getState();
  const basePath = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
  const COLLECTIONTEMPLATE = {
    metadata:{
      type: "DC_COLL",
      version: "2.0",
      user: getUserId(),
      time: new Date().toISOString(),
      email: '',
      author: '',
      title: 'My Collection',
      description: '',
    },
    items:[]
  };

  const ITEMTEMPLATE = {
    id: '',
    name: '',
    institution: '',
    nation: '',
    county: '',
    description: '',
    category_id: '',
    category: '',
    material: '',
    start: '',
    end: '',
    object: '',
    thumbnail: ''
  };

  function getCollectionList() {
    // Lettura: ottiene una copia snapshot dello stato centrale
    const currentState = stateManager.getState();
    const obj = currentState.collectionList || {};
    const list = [];
    Object.keys(obj).forEach(key => {
      const collection = currentState.collections[key];
      if (collection && collection.metadata) {
        list.push({key, title: collection.metadata.title});
      }
    });
    return list;
  }

  async function setActiveCollection(key){
    // Lettura: ottiene una copia snapshot dello stato centrale
    const currentState = stateManager.getState();
    if (!key || !currentState.collections[key]){
      bsAlert('Collection not found!', 'danger');
      return false;
    }
    // Modifica: crea un nuovo oggetto per collectionList invece di modificare currentState
    const newCollectionList = { ...currentState.collectionList };
    Object.keys(newCollectionList).forEach(k => { newCollectionList[k] = false; });
    newCollectionList[key] = true;
    // Aggiornamento: modifica direttamente il singleton e sincronizza con localStorage
    stateManager.updateState({
      collectionList: newCollectionList,
      activeCollectionKey: key,
      activeCollection: currentState.collections[key]
    });
    getCollectStatusBtn();
    return true;
  }

  async function addCollection(key) {
    // Lettura: ottiene una copia snapshot dello stato centrale
    const currentState = stateManager.getState();
    if (!key || !currentState.collections[key]) {
      bsAlert('Collection not found!', 'danger');
      return false;
    }

    // Modifica: crea un nuovo oggetto per collectionList
    const newCollectionList = { ...currentState.collectionList };
    Object.keys(newCollectionList).forEach(k => { newCollectionList[k] = false; });
    newCollectionList[key] = true;
    // Aggiornamento: modifica direttamente il singleton
    stateManager.updateState({
      collectionList: newCollectionList,
      activeCollectionKey: key,
      activeCollection: currentState.collections[key]
    });

    return true;
  }

  async function createCollection(metadata = null, onShowCollection = null){
    // Lettura: ottiene una copia snapshot dello stato centrale
    const currentState = stateManager.getState();
    const key = "dyncoll_" + generateUUID();
    const collection = structuredClone(COLLECTIONTEMPLATE);
    if (metadata && typeof metadata === 'object') {
      collection.metadata = { ...collection.metadata, ...metadata };
    }
    // Modifica: aggiorna prima currentState, poi passa a updateState
    const newCollections = { ...currentState.collections, [key]: collection };
    // Aggiornamento: modifica direttamente il singleton
    stateManager.updateState({ collections: newCollections });
    await addCollection(key);
    toggleCollectionListBtn(stateManager, onShowCollection, setActiveCollection);
    return key;
  }

  async function clearCollection() {
    // Lettura: ottiene una copia snapshot dello stato centrale
    const currentState = stateManager.getState();
    const key = currentState.activeCollectionKey;
    if (!key) {
      bsAlert('No active collection to clear!', 'warning'); 
      return false;
    }
    const collection = currentState.collections[key];
    if (!collection) {
      bsAlert('Active collection not found!', 'danger');
      return false;
    }

    // Modifica: crea nuovi oggetti per aggiornamenti
    const newCollections = { ...currentState.collections };
    newCollections[key] = { ...collection, items: [] };
    // Aggiornamento: modifica direttamente il singleton
    stateManager.updateState({
      collections: newCollections,
      activeCollection: newCollections[key],
      collectStatus: {}
    });

    // Aggiorna la UI
    setCounter(key);
    const collectionEl = document.getElementById('wrapCollection');
    if (collectionEl) { collectionEl.innerHTML = ''; }
    bsAlert('Collection cleared!', 'success');
    return true;
  }

  async function deleteCollection(all = false){
    // Lettura: ottiene una copia snapshot dello stato centrale
    const currentState = stateManager.getState();
    if (all) {
      stateManager.resetAll();
      setCounter(null);
      bsAlert('All collections deleted!', 'success');
      return true;
    }

    const key = currentState.activeCollectionKey;
    if (!key){
      bsAlert('No active collection to delete!', 'warning'); 
      return false;
    }

    // Modifica: crea nuovi oggetti
    const newCollections = { ...currentState.collections };
    const newCollectionList = { ...currentState.collectionList };
    delete newCollections[key];
    delete newCollectionList[key];

    const keys = Object.keys(newCollectionList);
    let newActiveKey = null;
    let newActiveCollection = null;
    const resetList = { ...newCollectionList };
    
    if (keys.length > 0) {
      // Imposta la prima collezione disponibile come attiva
      Object.keys(resetList).forEach(k => { resetList[k] = false; });
      resetList[keys[0]] = true;
      newActiveKey = keys[0];
      newActiveCollection = newCollections[keys[0]];
      getCollectStatusBtn();
      setCounter(keys[0]);
    } else {
      setCounter(null);
    }

    // Aggiornamento: modifica direttamente il singleton
    stateManager.updateState({
      collections: newCollections,
      collectionList: resetList,
      activeCollectionKey: newActiveKey,
      activeCollection: newActiveCollection
    });

    bsAlert('Collection deleted!', 'success');
    return true;
  }
  
  async function addItem(key, item){
    // Lettura: ottiene una copia snapshot dello stato centrale
    const currentState = stateManager.getState();
    let obj = currentState.collections[key];
    if (!obj) {
      bsAlert('Collection not found!', 'danger');
      return false;
    }
    const alreadyPresent = obj.items.some(i => i.id === item.id);
    if (!alreadyPresent) { 
      // Modifica: crea nuovi oggetti
      const newCollections = { ...currentState.collections };
      const newCollectStatus = { ...currentState.collectStatus };
      newCollections[key] = { ...obj, items: [...obj.items, item] };
      newCollectStatus[item.id] = true;
      // Aggiornamento: modifica direttamente il singleton
      stateManager.updateState({
        collections: newCollections,
        activeCollection: newCollections[key],
        collectStatus: newCollectStatus
      });
      setCounter(key);
      bsAlert('Item added to collection!', 'success');
      getCollectStatusBtn();
      return true;
    }
    bsAlert('Item already in collection!', 'info');
    return false;
  }

  // Aggiunge più elementi a una collezione
  async function addItems(key, items) {
    let addedCount = 0;
    for (const item of items) {
      const added = await addItem(key, item);
      if (added) addedCount++;
    }
    return addedCount;
  }

  async function removeItem(itemId){
    // Lettura: ottiene una copia snapshot dello stato centrale
    const currentState = stateManager.getState();
    const key = currentState.activeCollectionKey;
    if (!key){
      bsAlert('No active collection to remove item from!', 'warning');
      return false;
    } 
    let obj = currentState.collections[key];
    if (!obj){
      bsAlert('Active collection not found!', 'danger');
      return false;
    } 
    const initialLength = obj.items.length;
    
    const newCollections = { ...currentState.collections };
    const newCollectStatus = { ...currentState.collectStatus };
    newCollections[key] = { ...obj, items: obj.items.filter(item => String(item.id) !== String(itemId)) };
    delete newCollectStatus[itemId];
    stateManager.updateState({
      collections: newCollections,
      activeCollection: newCollections[key],
      collectStatus: newCollectStatus
    });

    setCounter(key);
    if (newCollections[key].items.length < initialLength) {
      getCollectStatusBtn();
      bsAlert('Item removed from collection!', 'success');
      return true;
    } else {
      bsAlert('Item not found in collection!', 'info');
      return false;
    }
  }

  function setCounter(key){
    // Lettura: ottiene una copia snapshot dello stato centrale
    const currentState = stateManager.getState();
    const counterElem = document.getElementById('countCollection');
    if (!counterElem) return;
    if (!key) {
      counterElem.innerText = '0';
      return;
    }
    const collection = currentState.collections[key];
    counterElem.innerText = collection ? collection.items.length : '0';
  } 

  function getUserId() {
    const jwt = localStorage.getItem("dyncol-jwt");
    if (jwt) {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        return payload.id || 'unregistered';
      }catch (e) {
        console.error("Invalid JWT token", e);
      }
    }

    const activeUsr = document.getElementById('activeUsr');
    if (activeUsr && activeUsr.value && activeUsr.value !== '' && activeUsr.value !== 'unregistered' && activeUsr.value !== 'guest') {
      return activeUsr.value;
    }else{
      return 'unregistered';
    }
  }

  function isTitleDuplicate(title, excludeKey = null) {
    const list = getCollectionList();
    return list.some(collection => 
      collection.title?.trim().toLowerCase() === title.trim().toLowerCase() &&
      collection.key !== excludeKey
    );
  }

  async function exportCollection(activeOnly = true) {
    // Lettura: ottiene una copia snapshot dello stato centrale
    const currentState = stateManager.getState();
    const zip = new JSZip();
    const dateString = getDateString().slice(0,3).join('');

    let readme = '';
    try {
      const response = await fetch(`${basePath}assets/readme/exported_collection.md`);
      readme = await response.text();
    } catch (error) {
      console.error(`Failed to load ${basePath}assets/readme/exported_collection.md template:`, error);
    } 
    zip.file("README.md", readme);

    let license = '';
    try {
      const response = await fetch(`${basePath}assets/license/CC_BY_4.0.txt`);
      license = await response.text();
    } catch (error) {
      console.error(`Failed to load ${basePath}assets/license/CC_BY_4.0.txt template:`, error);
    }
    zip.file("LICENSE.txt", license);

    let collectionsToExport = [];
    if (activeOnly) {
      if (currentState.activeCollection) {
        collectionsToExport = [currentState.activeCollection];
      }
    } else {
      collectionsToExport = Object.values(currentState.collections).filter(c => c);
    }

    collectionsToExport = collectionsToExport.filter(c => Array.isArray(c.items) && c.items.length > 0);

    if (collectionsToExport.length === 0) {
      bsAlert('No valid collections to export!', 'warning');
      return;
    }

    for (const coll of collectionsToExport) {
      const title = sanitizeString(coll.metadata?.title || 'Untitled_Collection');
      const csvName = `${dateString}_${title}.csv`;
      const jsonName = `${dateString}_${title}.json`;

      const csvData = collectionToCSV(coll.items);
      const jsonData = JSON.stringify({
        metadata: coll.metadata || {},
        items: coll.items
      }, null, 2);

      zip.file(csvName, csvData);
      zip.file(jsonName, jsonData);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(content);
    a.href = url;
    a.download = activeOnly ? `${dateString}_collection.zip` : `${dateString}_all_collections.zip`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  }

  function collectionToCSV(items) {
    if (!items.length) return '';
    const keys = Object.keys(items[0]);
    const csvRows = [
      keys.join(','), // header
      ...items.map(item => keys.map(k => `"${(item[k] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ];
    return csvRows.join('\n');
  }

  async function importCollection(file) {
    // Lettura: ottiene una copia snapshot dello stato centrale
    const currentState = stateManager.getState();
    // 1. Controllo che sia un file JSON
    if (!file || !file.name.endsWith('.json') || file.type !== 'application/json') {
      return {status: 'danger', message: 'Please select a valid JSON file.'};
    }

    if (file.size > 1 * 1024 * 1024) { // 1 MB
      return {status: 'danger', message: 'File too large. Maximum allowed size is 1 MB.'};
    }

    // 2. Leggi e valida la struttura interna
    let importedData;
    try {
      const text = await file.text();
      importedData = JSON.parse(text);
    } catch (e) {
      return {status: 'danger', message: 'Invalid JSON format.'};
    }

    // 2b. Controllo struttura
    if (
      !importedData ||
      typeof importedData !== 'object' ||
      !importedData.metadata ||
      typeof importedData.metadata.title !== 'string' ||
      !Array.isArray(importedData.items)
    ) {
      return {status: 'danger', message: 'JSON structure is not valid for a collection.'};
    }

    const metadataTemplateKeys = Object.keys(COLLECTIONTEMPLATE.metadata);
    const importedMetadataKeys = Object.keys(importedData.metadata);
    if (
      importedMetadataKeys.length !== metadataTemplateKeys.length ||
      !metadataTemplateKeys.every(k => importedMetadataKeys.includes(k))
    ) {
      return { status: 'danger', message: 'Metadata structure does not match template. Import aborted.' };
    }

    const itemTemplateKeys = Object.keys(ITEMTEMPLATE);
    for (const item of importedData.items) {
      const itemKeys = Object.keys(item);
      // Controlla che le chiavi siano esattamente quelle del template
      if (
        itemKeys.length !== itemTemplateKeys.length ||
        !itemTemplateKeys.every(k => itemKeys.includes(k))
      ) {
      return { status: 'danger', message: 'Item structure does not match template. Import aborted.' };
      }
    }

    // 3. Controllo duplicato su metadata.title
    const title = importedData.metadata.title.trim();
    const duplicate = Object.values(currentState.collections).find(
      c => c.metadata?.title?.trim().toLowerCase() === title.toLowerCase()
    );

    if (duplicate) {
      return { status: 'duplicate', title, importedData, duplicate };
    } else {
      // 7. Nuova collezione
      const key = "dyncoll_" + generateUUID();
      // Modifica: aggiorna il singleton invece di usare localStorage diretto
      const newCollections = { ...currentState.collections, [key]: importedData };
      stateManager.updateState({ collections: newCollections });
      await addCollection(key);
      return { status: 'success', title, key };
    }
  }


  return { 
    getCollectionList,
    createCollection,
    setActiveCollection,
    addItem, 
    addItems,
    removeItem, 
    clearCollection,
    deleteCollection,
    isTitleDuplicate,
    exportCollection,
    importCollection,
  };
}