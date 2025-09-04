export function initGallery(client, features = {}, filter = {}) {
  const galleryEl = document.getElementById('wrapGallery');
  if (!galleryEl){ 
    console.error('Gallery element not found');
    return
  };

  const state = {
    endpoint: "/api/endpoint_private.php",
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

  function collectItemBtnFunction(btn) {
    btn.style.display = 'none';
    const uncollectButton = btn.nextElementSibling;
    if (uncollectButton && uncollectButton.classList.contains("uncollectItemBtn")) {
      uncollectButton.style.display = 'inline-block';
    }
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
    load: fetchGallery,
    getState: () => ({ ...state })
  };
}

export function initCollection(filter) {
  const collectionEl = document.getElementById('wrapCollection');
  if (!filter) {
    console.error('Filter is required to initialize the collection.');
    return;
  }
  if (!Array.isArray(filter)) {
    console.error('Filter must be an array.');
    return;
  }

  if (!collectionEl) {
    console.error('Collection element not found');
    return;
  }

  if(Object.keys(filter).length === 0){
    document.getElementById('noCollection').innerHTML = `
    <div class="bg-light border rounded py-3">
      <div id="emptyCollection" class="text-center mb-5">
        <h2>Your collection is empty!</h2>
      </div>
      <div class="container px-4">
        <div class="row">
          <div class="col text-center">
            <p class="txt-adc-dark">The Dynamic Collection you create resides in the LocalStorage area on your browser, and is not memorized in the server or shared with others.</p>
            <p class="txt-adc-dark">You may download the Collection as a json file, and you can share it with colleagues and students ay you see fit.</p>
          </div>
        </div>
      </div>
      <div class="text-center mt-3">
        <button id="uploadJson" class="btn btn-adc-blue text-white">Upload your collection</button>
      </div>
    </div>
    `;
    return;
  }

  const state = {
    items: [], // Era: items: [...items] - ma 'items' non esisteva
    itemsCount: 0 // Era: items.length - ma 'items' non esisteva
  };

  function buildCollection() {
    collectionEl.innerHTML = '';
    console.log('collection initialized with: '+filter);
    
    // if (state.items.length === 0) {
    //   collectionEl.innerHTML = '<div class="text-center p-4"><h3>No items in collection</h3></div>';
    //   updateCollectionCount(0);
    //   return;
    // }

    // state.items.forEach(item => {
    //   const itemEl = createGalleryItem(item, 'collection', null, null, removeFromCollection);
    //   collectionEl.appendChild(itemEl);
    // });
    
    // updateCollectionCount(state.items.length);
  }

  function removeFromCollection(btn) {
    const itemId = parseInt(btn.dataset.item);
    
    // Rimuovi dall'array
    state.items = state.items.filter(item => item.id !== itemId);
    state.itemsCount = state.items.length;
    
    // Aggiorna localStorage
    const collectionData = {
      items: state.items,
      createdAt: Date.now(),
      totalCount: state.items.length
    };
    localStorage.setItem('userCollection', JSON.stringify(collectionData));
    
    // Rimuovi dal DOM
    btn.closest('.galleryItem').remove();
    
    // Aggiorna contatore
    updateCollectionCount(state.items.length);
    
    // Se vuoto, mostra messaggio
    if (state.items.length === 0) {
      collectionEl.innerHTML = '<div class="text-center p-4"><h3>No items in collection</h3></div>';
    }
  }

  function updateCollectionCount(count) {
    const countEl = document.getElementById('collectionCount');
    if (countEl) {
      countEl.textContent = count;
    }
  }

  function reset() {
    state.items = [];
    state.itemsCount = 0;
    localStorage.removeItem('userCollection');
    buildCollection();
  }

  function addItems(newItems) {
    state.items = [...state.items, ...newItems];
    state.itemsCount = state.items.length;
    buildCollection();
  }

  function setItems(newItems) {
    state.items = newItems;
    state.itemsCount = newItems.length;
    buildCollection();
  }

  buildCollection();

  return {
    reset,
    addItems,
    setItems,
    removeFromCollection,
    getState: () => ({ ...state })
  };
}

function createGalleryItem(item, client, onCollect, onUncollect, onRemove = null) {
  const itemEl = document.createElement('div');
  itemEl.className = 'galleryItem';
  itemEl.dataset.item = item.id;

  const header = document.createElement('div');
  header.className = 'card-header galleryCardHeader border-bottom';
  const imageUrl = `archive/thumb/${item.thumbnail}`;
  const placeholderUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-image" viewBox="0 0 16 16"><path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/><path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z"/></svg>';
  
  const thumbnail = document.createElement('img');
  thumbnail.className = 'cardImage';
  thumbnail.loading = "lazy";
  thumbnail.src = imageUrl;
  thumbnail.alt = item.name;
  thumbnail.onerror = function() {
    this.onerror = null;
    this.src = placeholderUrl;
    this.className = 'cardPlaceholder cardImage';
  };
  
  const headerTxt = document.createElement('p');
  headerTxt.className = 'txt-adc-dark fw-bold headerTxt';
  headerTxt.textContent = item.id;
  
  header.appendChild(thumbnail);
  header.appendChild(headerTxt);

  const body = document.createElement('div');
  body.className = 'card-body';
  body.innerHTML = `
    <h3 class="card-title txt-adc-dark fw-bold">${item.category}</h3>
    <p class="m-0 mb-1">${item.nation} / ${item.county}</p>
    <p class="m-0 mb-1">${item.institution}</p>
    <p class="m-0 mb-1">${item.start} / ${item.end}</p>
  `;
  
  if(client === 'index' || client === 'collection'){
    let cutLen;
    if (screen.width < 577) { cutLen = 20; } 
    else if (screen.width < 1081) { cutLen = 50; }
    else if (screen.width < 1370) { cutLen = 80; } 
    else { cutLen = 100; }
    
    function cutString(str, len) { 
      return str.length > len ? str.slice(0, len) + '…' : str; 
    }
    body.innerHTML += `<p class="m-0 mb-1">${cutString(item.description, cutLen)}</p>`;
  }

  const footer = document.createElement('div');
  footer.className = 'card-footer d-flex justify-content-start align-items-center gap-2 border-top';

  const viewBtn = document.createElement('a');
  viewBtn.href = `artifact_view.php?item=${item.id}`;
  viewBtn.className = 'btn btn-sm btn-adc-blue text-white';
  viewBtn.textContent = 'View';

  footer.appendChild(viewBtn);

  // Pulsanti diversi per gallery e collection
  if (client === 'index') {
    const collectItemBtn = document.createElement('button');
    collectItemBtn.className = 'btn btn-sm btn-adc-blue text-white collectItemBtn';
    collectItemBtn.dataset.item = item.id;
    collectItemBtn.textContent = 'Collect';

    const uncollectItemBtn = document.createElement('button');
    uncollectItemBtn.className = 'btn btn-sm btn-danger text-white uncollectItemBtn';
    uncollectItemBtn.dataset.item = item.id;
    uncollectItemBtn.textContent = 'Uncollect';
    uncollectItemBtn.style.display = 'none';

    collectItemBtn.addEventListener('click', (event) => {
      event.preventDefault();
      onCollect(event.currentTarget);
    });
    
    uncollectItemBtn.addEventListener('click', (event) => {
      event.preventDefault();
      onUncollect(event.currentTarget);
    });

    footer.append(collectItemBtn, uncollectItemBtn);
    
  } else if (client === 'collection' && onRemove) {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-danger text-white';
    removeBtn.dataset.item = item.id;
    removeBtn.textContent = 'Remove';
    
    removeBtn.addEventListener('click', (event) => {
      event.preventDefault();
      onRemove(event.currentTarget);
    });
    
    footer.appendChild(removeBtn);
  }

  itemEl.append(header, body, footer);
  return itemEl;
}

function setCount(loaded, tot, features = {}) {
  const featureText = document.getElementById('mapGalleryText');
  const countEl = document.getElementById('countItems');
  const countTitle = document.getElementById('itemsNumber');
  if (featureText) { featureText.textContent = `${features.name} has ${tot} related artifacts`; }
  if (countEl) {countEl.textContent = `${loaded} / ${tot}`};
  if (countTitle) {countTitle.textContent = tot};
}