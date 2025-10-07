import { collectionState } from "./collectionStorage.js";
import { collection } from "./collection.js";
import { createGalleryItem,getCollectStatusBtn} from "../components/galleryCard.js";
import { bsAlert } from "../components/bsComponents.js";

const stateManager = await collectionState();
const coll = await collection();

export function initGallery(onShowCollection = async () => {}) { 
  const galleryEl = document.getElementById('wrapGallery');
  if (!galleryEl){ 
    console.error('Gallery element not found');
    return;
  }

  const galleryState = {
    endpoint: ENDPOINT,
    class: 'Collection',
    page: 1,
    limit: 20,
    itemsCount: 0,
    loading: false,
    allLoaded: false,
    items: [],
  };
  console.log('Initialized gallery state:', galleryState);
  

  let observer = null;

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { fetchGallery(); }
      });
    }, { threshold: 0.5 });
  }
  
async function fetchGallery() {
  const currentState = stateManager.getState();
  if (galleryState.loading || galleryState.allLoaded) return;
  galleryState.loading = true;
  galleryEl.classList.add('loading');
  
  try {
    const body = {
      class: galleryState.class,
      action: 'getGallery',
      filterArr: currentState.searchFilters.filter,  // Leggi l'array costruito da getFilter()
      page: galleryState.page,
      limit: galleryState.limit,
      sortBy: currentState.searchFilters.sortBy,
      sortDir: currentState.searchFilters.sortDir
    };
    const result = await fetchApi({url: galleryState.endpoint, body: body});     
    const data = result.data;
    if (data.length < galleryState.limit) { galleryState.allLoaded = true; }
    buildGallery(data);
    galleryState.page += 1;
  } catch (error) {
    console.error('Error fetching gallery data:', error);
  } finally {
    galleryState.loading = false;
    galleryEl.classList.remove('loading');
    if (galleryState.allLoaded) {
      const endMessage = document.createElement('div');
      endMessage.className = 'end-message';
      endMessage.textContent = 'No more items to load.';
      galleryEl.appendChild(endMessage);
    }
  }
}

  function buildGallery(data) {
    const items = data.gallery;
    console.log('Fetched items:', items);
    
    galleryState.items = galleryState.items.concat(items);
    galleryState.itemsCount += items.length;
    const tot = data.tot[0].tot || 0;

    if (items.length === 0) {
      if (observer) observer.disconnect();
      if (tot > 10 && !galleryEl.querySelector('#endGallery')) {
        const endMessage = document.createElement('div');
        endMessage.id = 'endGallery';
        endMessage.innerHTML = `<h2><i class="mdi mdi-check-circle text-success"></i> You've reached the end of the collection!</h2>`;
        galleryEl.appendChild(endMessage);
      }
      return;
    }

    items.forEach(item => {
      const itemEl = createGalleryItem(
        item,
        (item, btn) => collectItemBtnFunction(item, btn, onShowCollection),
        (btn) => uncollectItemBtnFunction(btn, onShowCollection)
      );
      galleryEl.appendChild(itemEl);
    });

    setCount(galleryState.itemsCount, tot);

    // Riavvia l'osservatore per puntare alla nuova ultima immagine
    if (observer) {
      observer.disconnect();
      const lastCard = galleryEl.querySelector('.galleryItem:last-child');
      if (lastCard) { observer.observe(lastCard); }
    }
  }

  function reset() {
    galleryState.itemsCount = 0;
    galleryState.page = 1;
    galleryState.allLoaded = false;
    galleryState.loading = false;
    galleryState.items = [];
    if (observer) observer.disconnect();
    galleryEl.innerHTML = '';
    setCount(0, 0);
  }

  async function collectItemBtnFunction(item, btn, onShowCollection) {
    const currentState = stateManager.getState();
    btn.style.display = 'none';
    const uncollectButton = btn.nextElementSibling;
    if (uncollectButton && uncollectButton.classList.contains("uncollectItemBtn")) { uncollectButton.style.display = 'inline-block'; }
    let key = currentState.activeCollectionKey;
    if (!key) {
      key = await coll.createCollection();
      const updatedState = stateManager.getState();
      updatedState.activeCollectionKey = key;
      updatedState.activeCollection = updatedState.collections[key];
      stateManager.updateState({ 
        activeCollectionKey: key,
        activeCollection: updatedState.activeCollection
      });
      bsAlert("A new collection named 'My Collection' has been created. You can edit its metadata later.", "info", 4000);
      if (typeof onShowCollection === 'function') {
        await onShowCollection();
      }
      await new Promise(resolve => setTimeout(resolve, 4100));
    }
    await coll.addItem(key, item);
    const postAddState = stateManager.getState();  // Refresh after adding
    postAddState.activeCollection = postAddState.collections[key];
    postAddState.collectStatus[item.id] = true;
    stateManager.updateState({ 
      activeCollection: postAddState.activeCollection,
      collectStatus: postAddState.collectStatus
    });
    getCollectStatusBtn();
    if (typeof onShowCollection === 'function') {
      await onShowCollection();
    }
  }
  
  async function uncollectItemBtnFunction(btn, onShowCollection) {
    const currentState = stateManager.getState();
    btn.style.display = 'none';
    const collectButton = btn.previousElementSibling;
    if (collectButton && collectButton.classList.contains("collectItemBtn")) {
      collectButton.style.display = 'inline-block';
    }
    const itemId = btn.dataset.item;
    const key = currentState.activeCollectionKey;
    if (!key) {
      bsAlert('No active collection selected!', 'danger');
      return;
    }

    await coll.removeItem(itemId);
    const postRemoveState = stateManager.getState();  // Refresh after removing
    postRemoveState.activeCollection = postRemoveState.collections[key];
    delete postRemoveState.collectStatus[itemId];
    stateManager.updateState({ 
      activeCollection: postRemoveState.activeCollection,
      collectStatus: postRemoveState.collectStatus
    });

    getCollectStatusBtn();
    const activeTab = document.querySelector('#viewCollection')?.classList.contains('active');
    if (activeTab) {
      const card = btn.closest('.galleryItem');
      if (card) card.remove();
    } else {
      if (typeof onShowCollection === 'function') await onShowCollection();
    }
  }

  fetchGallery();

  return {
    reset,
    onCollect: collectItemBtnFunction,
    onUnCollect: uncollectItemBtnFunction,
    load: fetchGallery,
    getState: () => ({ ...galleryState })
  };
}

function setCount(loaded, tot) {
  const currentState = stateManager.getState();
  const features = currentState.searchFilters.feature || {};
  
  const featureText = document.getElementById('mapGalleryText');
  const countEl = document.getElementById('countItems');
  const countTitle = document.getElementById('itemsNumber');
  
  if (featureText) { 
    featureText.textContent = `${features.name || 'The collection'} has ${tot} related artifacts`;
  }
  if (countEl) { countEl.textContent = `${loaded} / ${tot}`; }
  if (countTitle) { countTitle.textContent = tot; }
}