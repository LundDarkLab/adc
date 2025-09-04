export function debounce(fn, wait = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * createInfiniteLoader(loaderFn, renderFn, opts)
 * loaderFn(page, pageSize) => Promise<{ gallery: [...], tot: [...] , perPage?: number }>
 * renderFn(data, append)
 */
export function createInfiniteLoader(loaderFn, renderFn, opts = {}) {
  const container = document.querySelector(opts.containerSelector) || document.body;
  const appendTo = opts.appendToSelector ? document.querySelector(opts.appendToSelector) : null;
  const rootElement = opts.rootSelector ? document.querySelector(opts.rootSelector) : null; // se null -> viewport
  const pageSize = opts.pageSize || 10;
  const rootMargin = opts.rootMargin || '800px'; // aumentato
  const threshold = opts.threshold || 0;
  const fallbackContainer = opts.fallbackContainerSelector ? document.querySelector(opts.fallbackContainerSelector) : window;

  let page = 1;
  let isLoading = false;
  let hasMore = true;
  let observer = null;
  let sentinel = null;
  let fallbackHandler = null;
  let running = false;

  // nuova flag per ignorare il primo trigger subito dopo il primo render
  let ignoreInitialTrigger = false;

  // traccia degli items caricati fino ad ora
  let totalLoaded = 0;

async function loadNext() {
    if (isLoading || !hasMore) return null;
    isLoading = true;
    try {
        const data = await loaderFn(page, pageSize);

        // render dei dati
        renderFn(data, page > 1);

        const target = appendTo || container;
        if (sentinel && target && sentinel.parentNode === target) {
            target.appendChild(sentinel);
        }

        const returnedCount = Array.isArray(data.gallery) ? data.gallery.length : (Array.isArray(data.items) ? data.items.length : 0);
        const per = data.perPage || pageSize;

        if (page === 1) totalLoaded = returnedCount;
        else totalLoaded += returnedCount;

        const totalCount = Array.isArray(data.tot) ? data.tot.length : (typeof data.tot === 'number' ? data.tot : (data.tot && data.tot.length) || 0);

        const viewCounterEl = document.getElementById('itemsNumber');
        if (viewCounterEl) viewCounterEl.textContent = `${totalLoaded} / ${totalCount}`;

        hasMore = returnedCount === per;
        if (hasMore) page++;
        else stop();

        return data;
    } catch (err) {
        console.error('Infinite loader error:', err);
        return null;
    } finally {
        isLoading = false;
    }
}
  function ensureSentinel() {
    if (sentinel) return sentinel;
    sentinel = document.createElement('div');
    sentinel.className = 'infinite-sentinel';
    sentinel.style.display = 'block';
    sentinel.style.width = '100%';
    sentinel.style.height = '24px';         // aumento per affidabilità detect
    sentinel.style.minHeight = '24px';
    // usa opacity invece di visibility per evitare possibili ignorati da alcuni browser
    sentinel.style.opacity = '0';
    sentinel.style.pointerEvents = 'none';
    const target = appendTo || container;
    if (!target) {
      console.error('InfiniteLoader: target container not found for sentinel', { appendToSelector: opts.appendToSelector, containerSelector: opts.containerSelector });
    } else {
      target.appendChild(sentinel);
      sentinel.dataset.sent = '1';
      console.debug('InfiniteLoader: sentinel appended to', target, 'sentinel bbox:', sentinel.getBoundingClientRect());
    }
    return sentinel;
  }

function start() {
    if (running) return;
    console.debug('InfiniteLoader.start', { containerSelector: opts.containerSelector, appendToSelector: opts.appendToSelector, rootSelector: opts.rootSelector, pageSize });
    running = true;
    page = 1;
    hasMore = true;
    isLoading = false;

    // Esegue il primo caricamento
    loadNext().then(() => {
        const s = ensureSentinel();
        if (!s) {
            console.error('InfiniteLoader: cannot start, sentinel not created');
            running = false;
            return;
        }

        if ('IntersectionObserver' in window) {
            // L'observer non è più gestito da loadNext, lo gestiamo solo qui
            observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    console.debug('InfiniteLoader.entry', {
                        isIntersecting: entry.isIntersecting,
                        ratio: entry.intersectionRatio
                    });
                    if (entry.isIntersecting) {
                        // Quando il sentinel entra, chiamo loadNext e poi lo disconnetto per evitare il loop
                        observer.disconnect();
                        loadNext().then(() => {
                            if (hasMore) {
                                // Se ci sono altri dati, ri-osservo il sentinel
                                observer.observe(sentinel);
                            }
                        });
                    }
                });
            }, { root: rootElement || null, rootMargin, threshold });
            
            // Attivo l'observer solo dopo il primo caricamento
            observer.observe(s);
        } else {
            // Logica del fallback (anch'essa semplificata)
            const debounced = debounce(() => {
                const rect = s.getBoundingClientRect();
                const visible = rect.top <= ((rootElement ? rootElement.clientHeight : window.innerHeight) + parseInt(rootMargin));
                if (visible) {
                    (rootElement || fallbackContainer).removeEventListener('scroll', fallbackHandler);
                    loadNext().then(() => {
                        if (hasMore) (rootElement || fallbackContainer).addEventListener('scroll', fallbackHandler, { passive: true });
                    });
                }
            }, opts.fallbackDebounce || 150);
            fallbackHandler = debounced;
            (rootElement || fallbackContainer).addEventListener('scroll', fallbackHandler, { passive: true });
        }
    }).catch(err => {
        console.error('InfiniteLoader: initial load failed', err);
        running = false;
    });
}

  // function start() {
  //   let ignoreInitialTrigger = true;
  //   if (running) return;
  //   console.debug('InfiniteLoader.start', { containerSelector: opts.containerSelector, appendToSelector: opts.appendToSelector, rootSelector: opts.rootSelector, pageSize });
  //   running = true;
  //   page = 1;
  //   hasMore = true;
  //   isLoading = false;

  //   // Primo caricamento: loadNext() senza observer attivo
  //   loadNext().then((firstData) => {
  //     const s = ensureSentinel();
  //     if (!s) {
  //       console.error('InfiniteLoader: cannot start, sentinel not created');
  //       running = false;
  //       return;
  //     }

  //     // Funzione per attivare l'observer
  //     const attachObserver = () => {
  //       if ('IntersectionObserver' in window) {
  //         observer = new IntersectionObserver((entries) => {
  //           entries.forEach(entry => {
  //             console.debug('InfiniteLoader.entry', {
  //               isIntersecting: entry.isIntersecting,
  //               ratio: entry.intersectionRatio,
  //               targetRect: entry.boundingClientRect,
  //               rootBounds: entry.rootBounds
  //             });
  //             if (entry.isIntersecting && !ignoreInitialTrigger) {
  //               try { observer.unobserve(entry.target); } catch (e) { /* ignore */ }
  //               loadNext().then(() => {
  //                 if (hasMore && observer && sentinel) observer.observe(sentinel);
  //               });
  //             }else{
  //               ignoreInitialTrigger = false;
  //             }
  //           });
  //         }, { root: rootElement || null, rootMargin, threshold });
  //         observer.observe(s);
  //       } else {
  //         const debounced = debounce(() => {
  //           const rect = s.getBoundingClientRect();
  //           const visible = rect.top <= ((rootElement ? rootElement.clientHeight : window.innerHeight) + parseInt(rootMargin));
  //           if (visible) {
  //             (rootElement || fallbackContainer).removeEventListener('scroll', fallbackHandler);
  //             loadNext().then(() => {
  //               if (hasMore) (rootElement || fallbackContainer).addEventListener('scroll', fallbackHandler, { passive: true });
  //             });
  //           }
  //         }, opts.fallbackDebounce || 150);
  //         fallbackHandler = debounced;
  //         (rootElement || fallbackContainer).addEventListener('scroll', fallbackHandler, { passive: true });
  //       }
  //     };

  //     // Controlla se il sentinel è visibile
  //     const sentinelVisible = () => {
  //       const rect = s.getBoundingClientRect();
  //       const marginPx = parseInt(rootMargin) || 0;
  //       const rootH = rootElement ? (rootElement.clientHeight || 0) : window.innerHeight;
  //       return rect.top <= (rootH + marginPx) && rect.bottom >= -marginPx;
  //     };

  //     // Se il sentinel è già visibile, aspetta che esca dalla viewport prima di attivare l'observer
  //     if (sentinelVisible()) {
  //       console.debug('InfiniteLoader: sentinel already visible, waiting for it to leave viewport');
  //       const waitForExit = debounce(() => {
  //         if (!sentinelVisible()) {
  //           console.debug('InfiniteLoader: sentinel left viewport, attaching observer');
  //           attachObserver();
  //           if (rootElement) rootElement.removeEventListener('scroll', waitForExit);
  //           else window.removeEventListener('scroll', waitForExit);
  //         }
  //       }, 100);
  //       if (rootElement) rootElement.addEventListener('scroll', waitForExit, { passive: true });
  //       else window.addEventListener('scroll', waitForExit, { passive: true });
  //     } else {
  //       // Se il sentinel non è visibile, attiva subito l'observer
  //       console.debug('InfiniteLoader: sentinel not visible, attaching observer immediately');
  //       attachObserver();
  //     }
  //   }).catch(err => {
  //     console.error('InfiniteLoader: initial load failed', err);
  //     running = false;
  //   });
  // }

  function stop() {
    running = false;
    if (observer && sentinel) {
      observer.disconnect();
      observer = null;
    }
    if (fallbackHandler) {
      (rootElement || fallbackContainer).removeEventListener('scroll', fallbackHandler);
      fallbackHandler = null;
    }
  }

  function reset() {
    stop();
    if (sentinel && sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
    sentinel = null;
    page = 1;
    hasMore = true;
    isLoading = false;
    ignoreInitialTrigger = false;
    totalLoaded = 0; // reset del contatore
  }

  return {
    start,
    stop,
    reset,
    get isRunning() { return running; }
  };
}

/* ---------- Default fetch loader for your API (POST form-style) ---------- */
/* Assumes global API variable with base url, trigger param and possible global filter/sort.
   If your code already builds AJAX settings differently, pass a custom loaderFn instead. */
export async function defaultGalleryLoaderFactory(opts = {}) {
  const apiUrl = opts.apiUrl || (typeof API !== 'undefined' ? API + 'model.php' : '/model.php');
  const trigger = opts.trigger || 'buildGallery';
  const getExtraParams = opts.getExtraParams || (() => ({}));

  return async function loader(page = 1, limit = 10) {
    const params = Object.assign({
      trigger,
      page,
      limit
    }, getExtraParams());

    const body = new URLSearchParams();
    Object.keys(params).forEach(k => {
      const val = params[k];
      if (Array.isArray(val)) {
        // invia array come param[] in modo che PHP li riceva come array in $_POST
        val.forEach(v => {
          body.append(k + '[]', (typeof v === 'object') ? JSON.stringify(v) : String(v));
        });
      } else if (val !== null && typeof val === 'object') {
        // oggetti complessi li serializziamo in JSON
        body.append(k, JSON.stringify(val));
      } else {
        body.append(k, String(val));
      }
    });
    
    const resp = await fetch(apiUrl, {
      method: 'POST',
      body
    });

    const text = await resp.text();

    if (!resp.ok) {
      // include body to help debugging server-side errors (PHP warnings/HTML)
      throw new Error(`Loader fetch failed: ${resp.status} - ${text.slice(0,1000)}`);
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      // Provide useful error message containing snippet of response
      throw new Error(`Invalid JSON response from ${apiUrl}: ${e.message}\nResponse snippet: ${text.slice(0,1000)}`);
    }
  };
}

/* ---------- Renderers (plain DOM) ---------- */
export function galleryRendererFactory(opts = {}) {
  const wrapSelector = opts.wrapSelector || '#wrapGallery';
  const viewCounterSelector = opts.viewCounterSelector || '#viewGallery > span';
  const items = [];
  const itemsPerPage = opts.pageSize || 10;

  function cutStringLocal(s, n) {
    if (!s) return '';
    return (s.length > n) ? s.slice(0, n) + '…' : s;
  }

  function render(data, append = false) {
    console.log(data);
    
    const wrap = document.querySelector(wrapSelector);
    if (!wrap) return;
    if (!append) {
      wrap.innerHTML = '';
      items.length = 0;
      const endMessage = document.getElementById('end-message');
      if (endMessage) endMessage.remove();
    }

    if (viewCounterSelector) {
      const cntEl = document.querySelector(viewCounterSelector);
      if (cntEl) cntEl.textContent = (items.length + (data.gallery ? data.gallery.length : 0)) + ' / ' + (data.tot ? data.tot.length : '');
    }

    (data.gallery || []).forEach(item => {
      items.push(item);
      const card = document.createElement('div');
      card.className = 'card m-1 itemCard';
      card.dataset.item = item.id;

      const header = document.createElement('div');
      header.className = 'card-header';
      const imageUrl = `archive/thumb/${item.thumbnail}`;
      const placeholderUrl = `https://via.placeholder.com/300x200?text=Item+${item.id}`;
      header.style.backgroundImage = `url('${imageUrl}'), url('${placeholderUrl}')`;
      header.style.backgroundSize = 'cover';
      header.style.backgroundPosition = 'center';
      header.innerHTML = `<p class="txt-adc-dark fw-bold">${item.id}</p>`;

      const body = document.createElement('div');
      body.className = 'card-body';
      body.innerHTML = `
        <h3 class="card-title txt-adc-dark fw-bold">${item.category}</h3>
        <small class="d-block">Find place: <span class="fw-bold">${item.nation} / ${item.county}</span></small>
        <small class="d-block">Institution: <span class="fw-bold">${item.institution}</span></small>
        <small class="d-block">material: <span class="fw-bold">${(item.material ? JSON.parse(item.material) : '')}</span></small>
        <small class="d-block">chronology: <span class="fw-bold">${item.start} / ${item.end}</span></small>
        <small class="d-block mt-3">${cutStringLocal(item.description, 70)}</small>
      `;

      const footer = document.createElement('div');
      footer.className = 'card-footer';
      footer.innerHTML = `
        <a class="btn btn-sm btn-adc-blue ms-3" href="artifact_view.php?item=${item.id}">View</a>
        <button class="btn btn-sm btn-adc-blue ms-3 addItemBtn" id="addItem${item.id}">Collect</button>
        <button class="btn btn-sm btn-danger ms-3 removeItemBtn" id="removeItem${item.id}" style="display:none">Remove</button>
      `;

      footer.querySelector(`#addItem${item.id}`).addEventListener('click', (ev) => {
        ev.currentTarget.style.display = 'none';
        const removeBtn = footer.querySelector(`#removeItem${item.id}`);
        if (removeBtn) removeBtn.style.display = '';
        // addToCollection is global in current app
        if (typeof addToCollection === 'function') addToCollection(item.id);
      });
      footer.querySelector(`#removeItem${item.id}`).addEventListener('click', (ev) => {
        ev.currentTarget.style.display = 'none';
        const addBtn = footer.querySelector(`#addItem${item.id}`);
        if (addBtn) addBtn.style.display = '';
        if (typeof removeFromCollection === 'function') removeFromCollection(item.id);
      });

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(footer);
      wrap.appendChild(card);
    });

    // show end message if no more
    if ((data.gallery || []).length < itemsPerPage) {
      if (!document.getElementById('end-message')) {
        const end = document.createElement('div');
        end.id = 'end-message';
        end.className = 'text-center my-4 text-muted w-100 fs-2';
        end.innerHTML = `<i class="mdi mdi-check-circle text-success"></i><p>You've reached the end of the collection!</p>`;
        wrap.appendChild(end);
      }
    }
  }

  // aggiungo metodo clear sul renderer per resettare stato interno e DOM
  render.clear = function() {
    const wrap = document.querySelector(wrapSelector);
    if (wrap) wrap.innerHTML = '';
    items.length = 0;
    const end = document.getElementById('end-message');
    if (end) end.remove();
    const cntEl = document.querySelector(viewCounterSelector);
    if (cntEl) cntEl.textContent = '0 / 0';
  };

  return render;
}

/* mapGallery renderer can be implemented similarly */
export function mapGalleryRendererFactory(opts = {}) {
  const wrapSelector = opts.wrapSelector || '#mapGalleryContent';
  return function renderMapGallery(data, append = false) {
    console.log(data);
    const wrap = document.querySelector(wrapSelector);
    if (!wrap) return;
    if (!append) wrap.innerHTML = '';

    (data.gallery || []).forEach(item => {
      const div = document.createElement('div');
      div.className = 'mapGalleryItem';
      div.id = 'mapGalleryItem' + item.id;
      div.dataset.item = item.id;
      div.style.backgroundImage = `url('archive/thumb/${item.thumbnail}'), url('https://via.placeholder.com/300x200?text=Item+${item.id}')`;
      div.style.backgroundSize = 'cover';
      div.style.backgroundPosition = 'center';
      wrap.appendChild(div);
    });
  };
}
// OLD VERSION!!!!!!
// /// infinite scroll on buildGallery 
// let currentPage = 1;
// let itemsPerPage = 10;
// let isLoading = false;
// let hasMoreItems = true;

// // gallery 
// let btnHome, btnFullscreen;
// let items = [];
// let filter = [];
// let sort = "artifact.id DESC";

// // Infinite scroll optimization
// const SCROLL_THRESHOLD = 200; // Pixels from bottom to trigger load
// const DEBOUNCE_DELAY = 100; // ms

// function buildGallery(callback, page = 1, append = false){
//   if (isLoading) return; // Avoid multiple calls
//   isLoading = true;
  
//   if(currentUrl() === 'index'){ checkActiveFilter() }

//   ajaxSettings.url=API+"model.php";
//   ajaxSettings.data={
//     trigger:'buildGallery',
//     filter:filter, 
//     sort:sort,
//     page: page,
//     limit: itemsPerPage
//   };
  
//   $.ajax(ajaxSettings)
//     .done(function(data) {
//       isLoading = false;
//       hasMoreItems = data.gallery.length === itemsPerPage;
//       callback(data, append);
//     })
//     .fail(function(xhr, status, error) {
//       console.error('buildGallery failed:', {
//         status: status,
//         error: error,
//         response: xhr.responseText,
//         ajaxSettings: ajaxSettings
//       });
//       isLoading = false;
//     });
// }

// function gallery(data, append = false) { 
//   console.log("Gallery data:", data);
  
//   wrapDiv = "#wrapGallery";
//   if (!append) {
//     $(wrapDiv).html('');
//     items = [];
//     $("#end-message").remove();
//   }
//   $("#viewGallery > span").text(items.length + data.gallery.length + ' / ' + data.tot.length);

//   data.gallery.forEach((item) => {
//     items.push(item)

//     var materialObject = JSON.parse(item.material);
//     var materialValues = [];
//     for (var key in materialObject) {
//       if (materialObject.hasOwnProperty(key)) {
//         materialValues.push(materialObject[key]);
//       }
//     }
//     let div = $("<div/>",{class:'card m-1 itemCard'}).attr("data-item",item.id).appendTo(wrapDiv);
    
//     // Per test: usa placeholder se l'immagine non esiste
//     const imageUrl = `archive/thumb/${item.thumbnail}`;
//     const placeholderUrl = `https://via.placeholder.com/300x200?text=Item+${item.id}`;
    
//     let header = $("<div/>", {class:'card-header'})
//     .css({
//       "background-image": `url('${imageUrl}'), url('${placeholderUrl}')`,
//       "background-color": "#f8f9fa",
//       "background-size": "cover",
//       "background-position": "center",
//       "min-height": "150px"
//     })
//     .appendTo(div);
    
//     $("<p/>",{class:'txt-adc-dark fw-bold'}).html(item.id).appendTo(header);
//     let body = $("<div/>",{class:'card-body'}).appendTo(div);
//     $("<h3/>",{class:'card-title txt-adc-dark fw-bold'}).text(item.category).appendTo(body);
//     $("<small/>",{class:'d-block'}).html("Find place: <span class='fw-bold'>"+`${item.nation} / ${item.county}`+"</span>").appendTo(body);
//     $("<small/>",{class:'d-block'}).html("Institution: <span class='fw-bold'>"+item.institution+"</span>").appendTo(body);
//     $("<small/>",{class:'d-block'}).html("material: <span class='fw-bold'>"+materialValues.join(', ')+"</span>").appendTo(body);
//     $("<small/>",{class:'d-block'}).html("chronology: <span class='fw-bold'>"+item.start+" / "+item.end+"</span>").appendTo(body);
//     $("<small/>",{class:'d-block mt-3'}).html(cutString(item.description, 70)).appendTo(body);

//     let footer = $("<div/>",{class:'card-footer'}).appendTo(div);
//     $("<a/>",{class:'btn btn-sm btn-adc-blue ms-3', href:'artifact_view.php?item='+item.id}).text('View').appendTo(footer);

//     let collectBtn = $("<button/>",{class:'btn btn-sm btn-adc-blue ms-3 addItemBtn', id: 'addItem'+item.id}).text('Collect').appendTo(footer);
//     let uncollectBtn = $("<button/>",{class:'btn btn-sm btn-danger ms-3 removeItemBtn', id: 'removeItem'+item.id}).text('Remove').appendTo(footer).hide();

//     collectBtn.on('click',function(){
//       $(this).hide();
//       uncollectBtn.show();
//       addToCollection(item.id)
//     })

//     uncollectBtn.on('click',function(){
//       $(this).hide();
//       collectBtn.show();
//       removeFromCollection(item.id)
//     })
//   });

//   if (!append) { updateCollection(); }

//   toggleLoadingSpinner(false);
//   if (!hasMoreItems && data.gallery.length < itemsPerPage) {
//     showEndMessage();
//   }
// }

// function mapGallery(data, append = false) { 
//   console.log("Map Gallery data:", data);
//   document.getElementById("itemsNumber").textContent = data.tot.length;
//   const wrapDiv = document.getElementById("mapGalleryContent");
//   const endMessage = document.getElementById("end-message");
//   if (!append) {
//     if (wrapDiv) wrapDiv.innerHTML = '';
//     items = [];
//     if (endMessage) endMessage.remove();
//   }
//   data.gallery.forEach((item) => {
//     let div = document.createElement("div");
//     div.className = "mapGalleryItem";
//     div.id = "mapGalleryItem" + item.id;
//     div.dataset.item = item.id;
//     div.textContent = "Item " + item.id;

//     // Per test: usa placeholder se l'immagine non esiste
//     const imageUrl = `archive/thumb/${item.thumbnail}`;
//     const placeholderUrl = `https://via.placeholder.com/300x200?text=Item+${item.id}`;

//     div.style.backgroundImage = `url('${imageUrl}'), url('${placeholderUrl}')`;
//     div.style.backgroundSize = "cover";
//     div.style.backgroundPosition = "center";
//     div.style.minHeight = "150px";

//     wrapDiv.appendChild(div);
//   });
// }

// function resetPagination() {
//   currentPage = 1;
//   hasMoreItems = true;
//   isLoading = false;
// }

// function loadNextPage(callback) {
//   if (!hasMoreItems || isLoading) return;
  
//   currentPage++;
//   buildGallery(callback, currentPage, true);
// }

// function toggleLoadingSpinner(show) {
//   if (show) {
//     if ($("#infinite-loader").length === 0) {
//       $("<div/>", {
//         id: 'infinite-loader',
//         class: 'text-center my-4'
//       }).html(`
//         <div class="spinner-border text-primary" role="status">
//           <span class="visually-hidden">Loading...</span>
//         </div>
//         <p class="mt-2">Loading more items...</p>
//       `).appendTo("#wrapGallery");
//     }
//   } else {
//     $("#infinite-loader").remove();
//   }
// }

// function showEndMessage() {
//   if ($("#end-message").length === 0) {
//     $("<div/>", {
//       id: 'end-message',
//       class: 'text-center my-4 text-muted w-100 fs-2'
//     }).html(`
//       <i class="mdi mdi-check-circle text-success"></i>
//       <p>You've reached the end of the collection!</p>
//     `).appendTo("#wrapGallery");
//   }
// }

// function reloadGallery(callback) {
//   resetPagination();
//   buildGallery(callback, 1, false);
// }

// function handleInfiniteScroll(callback, scrollTop, windowHeight, documentHeight) {
//   if (scrollTop + windowHeight >= documentHeight - SCROLL_THRESHOLD) {
//     if (hasMoreItems && !isLoading) {
//       loadNextPage(callback);
//     }
//   }
// }

// // infinite scroll helper
// async function infiniteScroll(sentinel, loadMoreCallback, opts = {}) {
//   const rootMargin = opts.rootMargin || '200px';
//   const debounceMs = opts.debounce || 200;

//   // IntersectionObserver
//   if ('IntersectionObserver' in window) {
//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           loadMoreCallback();
//         }
//       });
//     }, { root: null, rootMargin, threshold: 0 });
//     observer.observe(sentinel);
//     sentinel._infiniteObserver = observer;
//     return observer;
//   }

//   // Fallback: debounce su scroll
//   const handler = debounce(() => {
//     const rect = sentinel.getBoundingClientRect();
//     if (rect.top - window.innerHeight <= parseInt(rootMargin)) {
//       loadMoreCallback();
//     }
//   }, debounceMs);

//   window.addEventListener('scroll', handler);
//   sentinel._infiniteFallback = handler;
//   return {
//     disconnect() { window.removeEventListener('scroll', handler); }
//   };
// }