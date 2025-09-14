import { collection } from "./collection.js";
import { createGalleryItem } from "../components/galleryCard.js";

const coll = collection();

export function initGallery(client, features = {}, filter = {}) {
  const galleryEl = document.getElementById('wrapGallery');
  const collectionEl = document.getElementById('wrapCollection');
  if (!galleryEl){ 
    console.error('Gallery element not found');
    return
  };

  const state = {
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

  // Sposta la dichiarazione qui
  let observer = null;

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { fetchGallery(); }
      });
    }, { threshold: 0.5 });
  }
  
  async function fetchGallery() {
    if (state.loading || state.allLoaded) return;
    state.loading = true;
    galleryEl.classList.add('loading');
    
    try {
      const body = {
        class: state.class,
        action:'getGallery',
        filterArr: filter,
        client: client,
        page: state.page,
        limit: state.limit,
        sortBy: state.sortBy,
        sortDir: state.sortDir
      };
      const result = await fetchApi({url: state.endpoint, body: body});     
      const data = result.data;
      if (data.length < state.limit) { state.allLoaded = true; }
      buildGallery(data);
      state.page += 1;
    } catch (error) {
      console.error('Error fetching gallery data:', error);
    } finally {
      state.loading = false;
      galleryEl.classList.remove('loading');
      if (state.allLoaded) {
        const endMessage = document.createElement('div');
        endMessage.className = 'end-message';
        endMessage.textContent = 'No more items to load.';
        galleryEl.appendChild(endMessage);
      }
    }
  }

  function buildGallery(data) {
    const items = data.gallery;
    state.items = state.items.concat(items);
    state.itemsCount += items.length;
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

    setCount(state.itemsCount, tot, features);

    // Riavvia l'osservatore per puntare alla nuova ultima immagine
    if (observer) {
      observer.disconnect();
      const lastCard = galleryEl.querySelector('.galleryItem:last-child');
      if (lastCard) { observer.observe(lastCard); }
    }
  }

  function reset() {
    state.itemsCount = 0;
    state.page = 1;
    state.allLoaded = false;
    state.loading = false;
    state.items = [];
    if (observer) observer.disconnect();
    galleryEl.innerHTML = '';
    setCount(0, 0, features);
  }

  async function collectItemBtnFunction(item,btn) {
    btn.style.display = 'none';
    const uncollectButton = btn.nextElementSibling;
    if (uncollectButton && uncollectButton.classList.contains("uncollectItemBtn")) {
      uncollectButton.style.display = 'inline-block';
    }
    const collection = await coll.getActiveCollection();
    await coll.addItem(collection, item);
    const itemEl = createGalleryItem(item, 'collection', null, uncollectItemBtnFunction);
    collectionEl.appendChild(itemEl);
  }
  
  function uncollectItemBtnFunction(btn) {
    btn.style.display = 'none';
    const collectButton = btn.previousElementSibling;
    if (collectButton && collectButton.classList.contains("collectItemBtn")) {
      collectButton.style.display = 'inline-block';
    }
  }

  fetchGallery();

  return {
    reset,
    onCollect: collectItemBtnFunction,
    onUnCollect: uncollectItemBtnFunction,
    load: fetchGallery,
    getState: () => ({ ...state })
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