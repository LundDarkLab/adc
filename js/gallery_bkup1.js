/// infinite scroll on buildGallery
let currentPage = 1;
let itemsPerPage = 10;
let isLoading = false;
let hasMoreItems = true;

// gallery 
let btnHome, btnFullscreen;
let items = [];
let filter = [];
let sort = "artifact.id DESC";

// Infinite scroll optimization
const SCROLL_THRESHOLD = 200; // Pixels from bottom to trigger load
const DEBOUNCE_DELAY = 100; // ms

function buildGallery(callback, page = 1, append = false){
  if (isLoading) return; // Avoid multiple calls
  isLoading = true;
  
  if(currentUrl() === 'index'){ checkActiveFilter() }

  ajaxSettings.url=API+"model.php";
  ajaxSettings.data={
    trigger:'buildGallery',
    filter:filter, 
    sort:sort,
    page: page,
    limit: itemsPerPage
  };
  
  $.ajax(ajaxSettings)
    .done(function(data) {
      isLoading = false;
      hasMoreItems = data.gallery.length === itemsPerPage;
      callback(data, append);
    })
    .fail(function(xhr, status, error) {
      console.error('buildGallery failed:', {
        status: status,
        error: error,
        response: xhr.responseText,
        ajaxSettings: ajaxSettings
      });
      isLoading = false;
    });
}

function gallery(data, append = false) { 
  console.log("Gallery data:", data);
  
  wrapDiv = "#wrapGallery";
  if (!append) {
    $(wrapDiv).html('');
    items = [];
    $("#end-message").remove();
  }
  $("#viewGallery > span").text(items.length + data.gallery.length + ' / ' + data.tot.length);

  data.gallery.forEach((item) => {
    items.push(item)

    var materialObject = JSON.parse(item.material);
    var materialValues = [];
    for (var key in materialObject) {
      if (materialObject.hasOwnProperty(key)) {
        materialValues.push(materialObject[key]);
      }
    }
    let div = $("<div/>",{class:'card m-1 itemCard'}).attr("data-item",item.id).appendTo(wrapDiv);
    
    // Per test: usa placeholder se l'immagine non esiste
    const imageUrl = `archive/thumb/${item.thumbnail}`;
    const placeholderUrl = `https://via.placeholder.com/300x200?text=Item+${item.id}`;
    
    let header = $("<div/>", {class:'card-header'})
    .css({
      "background-image": `url('${imageUrl}'), url('${placeholderUrl}')`,
      "background-color": "#f8f9fa",
      "background-size": "cover",
      "background-position": "center",
      "min-height": "150px"
    })
    .appendTo(div);
    
    $("<p/>",{class:'txt-adc-dark fw-bold'}).html(item.id).appendTo(header);
    let body = $("<div/>",{class:'card-body'}).appendTo(div);
    $("<h3/>",{class:'card-title txt-adc-dark fw-bold'}).text(item.category).appendTo(body);
    $("<small/>",{class:'d-block'}).html("Find place: <span class='fw-bold'>"+`${item.nation} / ${item.county}`+"</span>").appendTo(body);
    $("<small/>",{class:'d-block'}).html("Institution: <span class='fw-bold'>"+item.institution+"</span>").appendTo(body);
    $("<small/>",{class:'d-block'}).html("material: <span class='fw-bold'>"+materialValues.join(', ')+"</span>").appendTo(body);
    $("<small/>",{class:'d-block'}).html("chronology: <span class='fw-bold'>"+item.start+" / "+item.end+"</span>").appendTo(body);
    $("<small/>",{class:'d-block mt-3'}).html(cutString(item.description, 70)).appendTo(body);

    let footer = $("<div/>",{class:'card-footer'}).appendTo(div);
    $("<a/>",{class:'btn btn-sm btn-adc-blue ms-3', href:'artifact_view.php?item='+item.id}).text('View').appendTo(footer);

    let collectBtn = $("<button/>",{class:'btn btn-sm btn-adc-blue ms-3 addItemBtn', id: 'addItem'+item.id}).text('Collect').appendTo(footer);
    let uncollectBtn = $("<button/>",{class:'btn btn-sm btn-danger ms-3 removeItemBtn', id: 'removeItem'+item.id}).text('Remove').appendTo(footer).hide();

    collectBtn.on('click',function(){
      $(this).hide();
      uncollectBtn.show();
      addToCollection(item.id)
    })

    uncollectBtn.on('click',function(){
      $(this).hide();
      collectBtn.show();
      removeFromCollection(item.id)
    })
  });

  if (!append) { updateCollection(); }

  toggleLoadingSpinner(false);
  if (!hasMoreItems && data.gallery.length < itemsPerPage) {
    showEndMessage();
  }
}

function mapGallery(data, append = false) { 
  console.log("Map Gallery data:", data);
  document.getElementById("itemsNumber").textContent = data.tot.length;
  const wrapDiv = document.getElementById("mapGalleryContent");
  const endMessage = document.getElementById("end-message");
  if (!append) {
    if (wrapDiv) wrapDiv.innerHTML = '';
    items = [];
    if (endMessage) endMessage.remove();
  }
  data.gallery.forEach((item) => {
    let div = document.createElement("div");
    div.className = "mapGalleryItem";
    div.id = "mapGalleryItem" + item.id;
    div.dataset.item = item.id;
    div.textContent = "Item " + item.id;

    // Per test: usa placeholder se l'immagine non esiste
    const imageUrl = `archive/thumb/${item.thumbnail}`;
    const placeholderUrl = `https://via.placeholder.com/300x200?text=Item+${item.id}`;

    div.style.backgroundImage = `url('${imageUrl}'), url('${placeholderUrl}')`;
    div.style.backgroundSize = "cover";
    div.style.backgroundPosition = "center";
    div.style.minHeight = "150px";

    wrapDiv.appendChild(div);
  });
}

function resetPagination() {
  currentPage = 1;
  hasMoreItems = true;
  isLoading = false;
}

function loadNextPage(callback) {
  if (!hasMoreItems || isLoading) return;
  
  currentPage++;
  buildGallery(callback, currentPage, true);
}

function toggleLoadingSpinner(show) {
  if (show) {
    if ($("#infinite-loader").length === 0) {
      $("<div/>", {
        id: 'infinite-loader',
        class: 'text-center my-4'
      }).html(`
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading more items...</p>
      `).appendTo("#wrapGallery");
    }
  } else {
    $("#infinite-loader").remove();
  }
}

function showEndMessage() {
  if ($("#end-message").length === 0) {
    $("<div/>", {
      id: 'end-message',
      class: 'text-center my-4 text-muted w-100 fs-2'
    }).html(`
      <i class="mdi mdi-check-circle text-success"></i>
      <p>You've reached the end of the collection!</p>
    `).appendTo("#wrapGallery");
  }
}

function reloadGallery(callback) {
  resetPagination();
  buildGallery(callback, 1, false);
}

function handleInfiniteScroll(callback, scrollTop, windowHeight, documentHeight) {
  if (scrollTop + windowHeight >= documentHeight - SCROLL_THRESHOLD) {
    if (hasMoreItems && !isLoading) {
      loadNextPage(callback);
    }
  }
}

// infinite scroll helper
async function infiniteScroll(sentinel, loadMoreCallback, opts = {}) {
  const rootMargin = opts.rootMargin || '200px';
  const debounceMs = opts.debounce || 200;

  // IntersectionObserver
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadMoreCallback();
        }
      });
    }, { root: null, rootMargin, threshold: 0 });
    observer.observe(sentinel);
    sentinel._infiniteObserver = observer;
    return observer;
  }

  // Fallback: debounce su scroll
  const handler = debounce(() => {
    const rect = sentinel.getBoundingClientRect();
    if (rect.top - window.innerHeight <= parseInt(rootMargin)) {
      loadMoreCallback();
    }
  }, debounceMs);

  window.addEventListener('scroll', handler);
  sentinel._infiniteFallback = handler;
  return {
    disconnect() { window.removeEventListener('scroll', handler); }
  };
}