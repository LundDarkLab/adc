import { bsToast } from "../components/bsComponents.js";

export function collection(){
  const COLLECTIONTEMPLATE = {
    metadata:{
      type: "DC_COLL",
      version: "2.0",
      user: getUserId(),
      time: new Date().toISOString(),
      email: '',
      author: '',
      title: '',
      description: '',
    },
    items:[]
  };
  
  // per ora non serve
  // const COLLECTIONDATA = {};

  function getFromStorage(key) {
    const obj = localStorage.getItem(key);
    return obj ? JSON.parse(obj) : null;
  }

  async function getCollectionList(){
    return getFromStorage("collectionList");
  }

  async function getActiveCollection() {
    const obj = getFromStorage("collectionList");
    if (obj) {
      const activeEntry = Object.entries(obj).find(([key, value]) => value === true);
      if (activeEntry) { return activeEntry[0]; }
    }
    return null;
  }

  async function createList(){
    localStorage.setItem('collectionList', JSON.stringify({}));
  }
  
  async function addCollection(key){
    let obj = getFromStorage('collectionList');
    if(!obj){
      await createList();
      obj = getFromStorage('collectionList');
    }
    Object.keys(obj).forEach(k => { obj[k] = false; });
    obj[key] = true;
    localStorage.setItem('collectionList', JSON.stringify(obj));
    return true;
  }

  async function updateList(key,active){
    const obj = getFromStorage('collectionList');
  }

  async function retrieveCollection(key) {
    return getFromStorage(key);
  }

  async function createCollection() {
    const key = "dyncoll_"+generateUUID();
    await addCollection(key);
    const collection = structuredClone(COLLECTIONTEMPLATE);
    localStorage.setItem(key, JSON.stringify(collection));
    return key;
  }

  async function addItem(key, item){
    try {
      if(!key){ key = await createCollection(); }
      let obj = getFromStorage(key);
      if (!obj) {
        obj = structuredClone(COLLECTIONTEMPLATE);
      }
      const alreadyPresent = obj.items.some(i => i.id === item.id);
      if (!alreadyPresent) { 
        obj.items.push(item); 
        localStorage.setItem(key, JSON.stringify(obj));
        bsToast('Item added to collection!', 'success');
        return true;
      } else {
        bsToast('Item already in collection!', 'info');
        return false;
      }
    } catch (error) {
      console.error("Error adding item to collection:", error);
      bsToast('Error adding item to collection!', 'danger');
      return false;
    }
  }


  async function removeItem(id){}
  async function clearCollection(){}

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

  return { 
    getCollectionList,
    createCollection,
    getActiveCollection, 
    retrieveCollection,
    addItem, 
    removeItem, 
    clearCollection 
  };
}