import { bsAlert, bsConfirm } from "../components/bsComponents.js";
import { getCollectStatusBtn } from "../components/galleryCard.js";
import { showCollection, state, toggleCollectionListBtn} from '../index.js';
import { getDateString, sanitizeString } from "../helpers/utils.js";

export function collection(){

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
  
  function getFromStorage(key) {
    const obj = localStorage.getItem(key);
    return obj ? JSON.parse(obj) : null;
  }

  function getCollectionList() {
    let obj = state.collectionList;
    if (!obj || Object.keys(obj).length === 0) {
      obj = getFromStorage("collectionList") || {};
      state.collectionList = obj;
    }
    Object.keys(obj).forEach(key => {
      if (!(key in state.collectionList)) {
        state.collectionList[key] = obj[key];
      }
    });
    
    const list = [];
    Object.keys(obj).forEach(key => {
      let collection = state.collections && state.collections[key];
      if (!collection) {
        collection = getFromStorage(key);
        if (collection) {
          if (!state.collections) {state.collections = {};}
          state.collections[key] = collection;
        }
      }
      if (collection && collection.metadata) {
        list.push({
          key,
          title: collection.metadata.title || 'Untitled Collection'
        });
      }
    });
    return list;
  }

  async function setActiveCollection(key){
    let obj = state.collectionList;
    if (!obj || Object.keys(obj).length === 0) {
      await createList();
      state.collectionList = obj;
    }
    Object.keys(obj).forEach(k => { obj[k] = false; });
    obj[key] = true;
    state.collectionList = obj;
    state.activeCollectionKey = key;
    const collection = state.collections[key] || getFromStorage(key);
    state.activeCollection = collection;
    getCollectStatusBtn();
    localStorage.setItem('collectionList', JSON.stringify(obj));
    return true;
  }

  async function getActiveCollection() {
    return state.activeCollectionKey;
  }

  async function createList(){
    localStorage.setItem('collectionList', JSON.stringify({}));
  }
  
  // add or update collection in the collectionList storage and set it active
  async function addCollection(key){
    let obj = state.collectionList;
     if (!obj || Object.keys(obj).length === 0) {
      obj = getFromStorage('collectionList');
      if (!obj || Object.keys(obj).length === 0) {
        await createList();
        obj = {};
      }
    }
    Object.keys(obj).forEach(k => { obj[k] = false; });
    obj[key] = true;
    state.collectionList = obj;
    state.activeCollectionKey = key;
    localStorage.setItem('collectionList', JSON.stringify(obj));
    return true;
  }

  async function retrieveCollection(key) {
    const collection = state.collections[key] || getFromStorage(key);
    if (collection) {
      state.activeCollection = collection;
      state.collections[key] = collection;
      state.collectStatus = {};
      collection.items.forEach(item => {
        state.collectStatus[item.id] = true;
      });
    }
    return collection;
  }

  async function createCollection(metadata = null) {
    const key = "dyncoll_" + generateUUID();
    const collection = structuredClone(COLLECTIONTEMPLATE);
    if (metadata && typeof metadata === 'object') {
      collection.metadata = { ...collection.metadata, ...metadata };
    }
    localStorage.setItem(key, JSON.stringify(collection));
    state.collections[key] = collection;
    await addCollection(key);
    await setActiveCollection(key);
    await toggleCollectionListBtn();
    await showCollection();
    return key;
  }

  async function clearCollection(){    
    const key = state.activeCollectionKey;
    if (!key){
      bsAlert('No active collection to clear!', 'warning'); 
      return false;
    }
    let collection = state.collections[key] || getFromStorage(key);
    if (!collection) return false;
    collection.items = [];
    localStorage.setItem(key, JSON.stringify(collection));
    setCounter(key);

    state.collections[key] = collection;
    if (key === state.activeCollectionKey) {
      // state.collectionItems = [];
      state.activeCollection = collection;
      state.collectStatus = {};
    }

    const collectionEl = document.getElementById('wrapCollection');
    if (collectionEl) { collectionEl.innerHTML = ''; }
    bsAlert('Collection cleared!', 'success');
    return true;
  }

  async function deleteCollection(all = false){
    if (all) {
      const list = getCollectionList();
      list.forEach(col => {
        localStorage.removeItem(col.key);
        delete state.collections[col.key];
        delete state.collectionList[col.key];
      });
      localStorage.removeItem('collectionList');
      state.activeCollectionKey = null;
      state.activeCollection = null;
      // state.collectionItems = [];
      setCounter(null);
      bsAlert('All collections deleted!', 'success');
      return true;
    }
    const key = await getActiveCollection();
    if (!key){
      bsAlert('No active collection to delete!', 'warning'); 
      return false;
    }
    localStorage.removeItem(key);
    delete state.collections[key];
    delete state.collectionList[key];

    const keys = Object.keys(state.collectionList);
    if (keys.length > 0) {
      Object.keys(state.collectionList).forEach(k => { state.collectionList[k] = false; });
      state.collectionList[keys[0]] = true;
      state.activeCollectionKey = keys[0];
      if (!state.collections[keys[0]]) {
        const newColl = getFromStorage(keys[0]);
        if (newColl) state.collections[keys[0]] = newColl;
      }
      state.activeCollection = state.collections[keys[0]];
      getCollectStatusBtn();
      setCounter(keys[0]);
    } else {
      state.activeCollectionKey = null;
      state.activeCollection = null;
      setCounter(null);
    }
    localStorage.setItem('collectionList', JSON.stringify(state.collectionList));
    bsAlert('Collection deleted!', 'success');
    return true;
  }

  async function addItem(key, item){
    let obj = state.collections[key] || getFromStorage(key);
    if (!obj) {
      bsAlert('Collection not found!', 'danger');
      return false;
    }
    const alreadyPresent = obj.items.some(i => i.id === item.id);
    if (!alreadyPresent) { 
      obj.items.push(item); 
      localStorage.setItem(key, JSON.stringify(obj));
      setCounter(key);
      bsAlert('Item added to collection!', 'success');
      state.collections[key] = obj;
      state.activeCollection = obj;
      state.collectStatus[item.id] = true;
      getCollectStatusBtn();
      showCollection();
      return true;
    }
    bsAlert('Item already in collection!', 'info');
    return false;
  }

  async function removeItem(itemId){
    const key = state.activeCollectionKey;
    if (!key) return false;
    let obj = state.collections[key] || getFromStorage(key);
    if (!obj) return false;
    const initialLength = obj.items.length;
    obj.items = obj.items.filter(item => String(item.id) !== String(itemId));
    localStorage.setItem(key, JSON.stringify(obj));
    setCounter(key);

    state.collections[key] = obj;
    state.activeCollection = obj;
    delete state.collectStatus[itemId];

    if (obj.items.length < initialLength) {
      getCollectStatusBtn();
      bsAlert('Item removed from collection!', 'success');
      return true;
    } else {
      bsAlert('Item not found in collection!', 'info');
      return false;
    }
  }

  function setCounter(key){
    const counterElem = document.getElementById('countCollection');
    if (!counterElem) return;
    if (!key) {
      counterElem.innerText = '0';
      return;
    }
    const collection = state.collections[key] || getFromStorage(key);
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

  function generateUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    // Fallback UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async function exportCollection(activeOnly = true) {
    const zip = new JSZip();
    const dateString = getDateString().slice(0,3).join('');

    let readme = '';
    try {
      const response = await fetch('/assets/readme/exported_collection.md');
      readme = await response.text();
    } catch (error) {
      console.error("Failed to load /assets/readme/exported_collection.md template:", error);
    } 
    zip.file("README.md", readme);

    let license = '';
    try {
      const response = await fetch('/assets/license/CC_BY_4.0.txt');
      license = await response.text();
    } catch (error) {
      console.error("Failed to load /assets/license/CC_BY_4.0.txt template:", error);
    }
    zip.file("LICENSE.txt", license);

    let collectionsToExport = [];
    if (activeOnly) {
      if (state.activeCollection) {
        collectionsToExport = [state.activeCollection];
      }
    } else {
      collectionsToExport = Object.values(state.collections);
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
    const duplicate = Object.values(state.collections).find(
      c => c.metadata?.title?.trim().toLowerCase() === title.toLowerCase()
    );

    if (duplicate) {
      return { status: 'duplicate', title, importedData, duplicate };
    } else {
      // 7. Nuova collezione
      const key = "dyncoll_" + generateUUID();
      localStorage.setItem(key, JSON.stringify(importedData));
      state.collections[key] = importedData;
      await addCollection(key);
      return { status: 'success', title, key };
    }
  }


  return { 
    getCollectionList,
    createCollection,
    setActiveCollection,
    getActiveCollection, 
    retrieveCollection,
    addItem, 
    removeItem, 
    clearCollection,
    deleteCollection,
    isTitleDuplicate,
    exportCollection,
    importCollection,
  };
}