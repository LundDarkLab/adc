import { collection } from "./collection.js";
import { createGalleryItem,getCollectStatusBtn} from "../components/galleryCard.js";
import { showCollection, state } from "../index.js";

const coll = collection();

export function initGallery(client, features = {}, filter = {}) {
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
    sortBy: 'artifact.id',
    sortDir: 'DESC',
    loading: false,
    allLoaded: false,
    items: [],
  };

  let observer = null;

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { fetchGallery(); }
      });
    }, { threshold: 0.5 });
  }
  
  async function fetchGallery() {
    if (galleryState.loading || galleryState.allLoaded) return;
    galleryState.loading = true;
    galleryEl.classList.add('loading');
    
    try {
      const body = {
        class: galleryState.class,
        action:'getGallery',
        filterArr: filter,
        client: client,
        page: galleryState.page,
        limit: galleryState.limit,
        sortBy: galleryState.sortBy,
        sortDir: galleryState.sortDir
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
      const itemEl = createGalleryItem(item, client, collectItemBtnFunction, uncollectItemBtnFunction);
      galleryEl.appendChild(itemEl);
    });

    setCount(galleryState.itemsCount, tot, features);

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
    setCount(0, 0, features);
  }

  async function collectItemBtnFunction(item, btn) {
    btn.style.display = 'none';
    const uncollectButton = btn.nextElementSibling;
    if (uncollectButton && uncollectButton.classList.contains("uncollectItemBtn")) {
      uncollectButton.style.display = 'inline-block';
    }
    const key = state.activeCollectionKey;
    if (!key) {
      bsAlert('No active collection selected!', 'danger');
      return;
    }
    await coll.addItem(key, item);
    state.collectStatus[item.id] = true;
    getCollectStatusBtn();
    await showCollection()
  }
  
  async function uncollectItemBtnFunction(btn) {
    btn.style.display = 'none';
    const collectButton = btn.previousElementSibling;
    if (collectButton && collectButton.classList.contains("collectItemBtn")) {
      collectButton.style.display = 'inline-block';
    }
    const itemId = btn.dataset.item;
    const key = state.activeCollectionKey;
    if (!key) {
      bsAlert('No active collection selected!', 'danger');
      return;
    }
    await coll.removeItem(itemId);
    delete state.collectStatus[itemId];
    getCollectStatusBtn();
    await showCollection();
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

function setCount(loaded, tot, features = {}) {
  const featureText = document.getElementById('mapGalleryText');
  const countEl = document.getElementById('countItems');
  const countTitle = document.getElementById('itemsNumber');
  if (featureText) { featureText.textContent = `${features.name} has ${tot} related artifacts`; }
  if (countEl) {countEl.textContent = `${loaded} / ${tot}`};
  if (countTitle) {countTitle.textContent = tot};
}