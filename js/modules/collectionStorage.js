const COLLECTION_STATE = 'collectionState';
let stateManagerInstance = null;

export async function collectionState(){
  if (!stateManagerInstance) {
    let state = getInitialState();
    
    function load() {
      const savedState = localStorage.getItem(COLLECTION_STATE);
      if (savedState) {
        try {
          state = JSON.parse(savedState);
        } catch (e) {
          state = getInitialState();
        }
      } else {
        state = getInitialState();
        localStorage.setItem(COLLECTION_STATE, JSON.stringify(state));
      }
    }

    function sync() {
      try {
        localStorage.setItem(COLLECTION_STATE, JSON.stringify(state));
      } catch (e) {
        console.error('❌ Error syncing to localStorage (quota exceeded?):', e);
      }
    }
    
    function updateState(resetObj = {}) {
      Object.keys(resetObj).forEach(key => { state[key] = resetObj[key]; });
      sync();
    }
    
    function resetState(keys = []) {
      const initial = getInitialState();
      keys.forEach(key => { state[key] = initial[key]; });
      sync();
    }
  
     function resetAll() {
      state = getInitialState();
      sync();
    }

    stateManagerInstance = {
      getState: () => ({ ...state }),
      load,
      sync,
      updateState,
      resetState,
      resetAll,
    };

    load();
  }
  return stateManagerInstance;
}

function getInitialState(){
  return {
    searchFilters: {
      feature: [],
      filter: [],
      currentFilter: {},
      activeFilter: 0,
      sortBy: 'id',
      sortDir: 'asc'
    },
    collectionList: {}, // localStorage 'collectionList' 
    collections: {}, // { [key]: collectionObject }
    activeCollectionKey: null,
    activeCollection: null, // oggetto collection attiva
    galleryItems: [], // tutti gli item della gallery
    collectStatus: {}, // { [itemId]: true/false }
    collectionFormMode: null, // 'create' | 'update'
    editingCollectionKey: null,
  };
}