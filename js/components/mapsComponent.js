import { initGallery } from "../modules/gallery.js";
import { collection } from "../modules/collection.js";
import { collectionState } from "../modules/collectionStorage.js";
import { toggleCollectionListBtn } from "../helpers/collectionHelper.js";

const stateManager = await collectionState();
const coll = await collection();
let galleryInstance = null;

window.collectToggle = async function(itemKey, btn) {
  try {
    const item = window.popupItems.get(itemKey);
    if (!item) {
      console.error('Item not found for key:', itemKey);
      return;
    }
    const currentState = stateManager.getState();
    const isCollected = currentState.collectStatus && currentState.collectStatus[item.id];
    
    // Usa sempre le funzioni dalla gallery SE esistono, altrimenti usa il modulo collection direttamente
    if (window.onCollect && window.onUncollect) {
      if (isCollected) {
        await window.onUncollect(btn, null);
      } else {
        await window.onCollect(item, btn, null);
      }
    } else {
      // Fallback quando la gallery non è stata ancora aperta
      if (isCollected) {
        await coll.removeItem(item.id);
      } else {
        if (!currentState.activeCollectionKey) {
          console.warn('No active collection');
          return;
        }
        await coll.addItem(currentState.activeCollectionKey, item);
      }
      // Aggiorna lo stato del bottone manualmente
      if (btn) {
        if (isCollected) {
          btn.classList.remove('btn-danger');
          btn.classList.add('btn-adc-blue');
          btn.textContent = 'Collect';
        } else {
          btn.classList.remove('btn-adc-blue');
          btn.classList.add('btn-danger');
          btn.textContent = 'Uncollect';
        }
      }
      document.dispatchEvent(new CustomEvent('collectionUpdated'));
    }
  } catch (error) {
    console.error('Errore in collectToggle:', error);
  }
};

export const domEl = {
  mapGalleryWrap: document.getElementById('mapGalleryWrap'),
  wrapGallery: document.getElementById('wrapGallery'),
  mapGalleryTitle: document.getElementById('mapGalleryText'),
  closeGalleryBtn: document.getElementById('closeGallery'),
  closeGuide: document.getElementById('closeGuide'),
  controlDiv: document.getElementById('layerSwitcher'),
  mapGuide: document.getElementById('mapGuide'),
  mapGuideBtn: document.getElementById('mapGuideBtn'),
  mapInfo: document.getElementById('mapInfo'),
  collectionDiv: document.getElementById('collectionDiv'),
  activeCollectionTitle: document.getElementById('activeCollectionTitle'),
  collectionListDropdownBtn: document.getElementById('collectionListDropdownBtn'),
  collectionListDropdown: document.getElementById('collectionListDropdown'),
  poiControl: document.getElementById('poiControl'),
  collectionsControl: document.getElementById('collectionsControl'),
  adminControl: document.getElementById('adminControl'),
  baseLayerControl: document.getElementById('baseLayerControl'),
}

export function betterScale(L){
  L.Control.BetterScale = L.Control.extend({
    options: {
      position: "bottomleft",
      maxWidth: 150,
      metric: !1,
      imperial: !0,
      updateWhenIdle: !1
    },
    onAdd: function (t) {
      this._map = t;
      var e = "leaflet-control-better-scale",
      i = L.DomUtil.create("div", e),
      n = this.options,
      s = L.DomUtil.create("div", e + "-ruler", i);
      L.DomUtil.create("div", e + "-ruler-block " + e + "-upper-first-piece", s), L.DomUtil.create("div", e + "-ruler-block " + e + "-upper-second-piece", s), L.DomUtil.create("div", e + "-ruler-block " + e + "-lower-first-piece", s), L.DomUtil.create("div", e + "-ruler-block " + e + "-lower-second-piece", s);
      return this._addScales(n, e, i), this.ScaleContainer = i, t.on(n.updateWhenIdle ? "moveend" : "move", this._update, this), t.whenReady(this._update, this), i
    },
    onRemove: function (t) {
      t.off(this.options.updateWhenIdle ? "moveend" : "move", this._update, this)
    },
    _addScales: function (t, e, i) {
      this._iScale = L.DomUtil.create("div", e + "-label-div", i), this._iScaleLabel = L.DomUtil.create("div", e + "-label", this._iScale), this._iScaleFirstNumber = L.DomUtil.create("div", e + "-label " + e + "-first-number", this._iScale), this._iScaleSecondNumber = L.DomUtil.create("div", e + "-label " + e + "-second-number", this._iScale)
    },
    _update: function () {
      var t = this._map.getBounds(),
      e = t.getCenter().lat,
      i = 6378137 * Math.PI * Math.cos(e * Math.PI / 180),
      n = i * (t.getNorthEast().lng - t.getSouthWest().lng) / 180,
      o = this._map.getSize(),
      s = this.options,
      a = 0;
      o.x > 0 && (a = n * (s.maxWidth / o.x)), this._updateScales(s, a)
    },
    _updateScales: function (t, e) {
      t.metric && e && this._updateMetric(e), t.imperial && e && this._updateImperial(e)
    },
    _updateMetric_old: function (t) {
      var e = this._getRoundNum(t);
      this._iScale.style.width = this._getScaleWidth(e / t) + "px", this._iScaleLabel.innerHTML = 1e3 > e ? e + " m" : e / 1e3 + " km"
    },
    _updateMetric: function (t) {
      var e, i, n, o, s, a = t,
      r = this._iScaleFirstNumber,
      h = this._iScaleSecondNumber,
      l = this._iScale,
      u = this._iScaleLabel;
      u.innerHTML = "0", a > 500 ? (e = a / 1000, i = this._getRoundNum(e), o = this._getRoundNum(e / 2), l.style.width = this._getScaleWidth(i / e) + "px", r.innerHTML = o, h.innerHTML = i + "km") : (n = this._getRoundNum(a), s = this._getRoundNum(a / 2), l.style.width = this._getScaleWidth(n / a) + "px", r.innerHTML = s, h.innerHTML = n + "m")
    },
    _updateImperial: function (t) {
      var e, i, n, o, s, a = 3.2808399 * t,
      r = this._iScaleFirstNumber,
      h = this._iScaleSecondNumber,
      l = this._iScale,
      u = this._iScaleLabel;
      u.innerHTML = "0", a > 2640 ? (e = a / 5280, i = this._getRoundNum(e), o = this._getRoundNum(e / 2), l.style.width = this._getScaleWidth(i / e) + "px", r.innerHTML = o, h.innerHTML = i + "mi") : (n = this._getRoundNum(a), s = this._getRoundNum(a / 2), l.style.width = this._getScaleWidth(n / a) + "px", r.innerHTML = s, h.innerHTML = n + "ft")
    },
    _getScaleWidth: function (t) {
      return Math.round(this.options.maxWidth * t) - 10
    },
    _getRoundNum: function (t) {
      if (t >= 2) {
        var e = Math.pow(10, (Math.floor(t) + "").length - 1),
        i = t / e;
        return i = i >= 10 ? 10 : i >= 5 ? 5 : i >= 3 ? 3 : i >= 2 ? 2 : 1, e * i
      }
      return (Math.round(100 * t) / 100).toFixed(1)
    }
  });
    
  L.control.betterscale = function (options) {
    return new L.Control.BetterScale(options)
  };
}

export function mousePosition(L){
  L.Control.MousePosition = L.Control.extend({
    options: {
      position: 'bottomleft',
      separator: ' : ',
      emptyString: 'Unavailable',
      lngFirst: false,
      numDigits: 5,
      lngFormatter: undefined,
      latFormatter: undefined,
      prefix: ""
    },

    onAdd: function (map) {
      this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
      L.DomEvent.disableClickPropagation(this._container);
      map.on('mousemove', this._onMouseMove, this);
      this._container.innerHTML=this.options.emptyString;
      return this._container;
    },

    onRemove: function (map) {
      map.off('mousemove', this._onMouseMove)
    },

    _onMouseMove: function (e) {
      var lng = this.options.lngFormatter ? this.options.lngFormatter(e.latlng.lng) : L.Util.formatNum(e.latlng.lng, this.options.numDigits);
      var lat = this.options.latFormatter ? this.options.latFormatter(e.latlng.lat) : L.Util.formatNum(e.latlng.lat, this.options.numDigits);
      var value = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
      var prefixAndValue = this.options.prefix + ' ' + value;
      this._container.innerHTML = prefixAndValue;
    }
  });

  L.Map.mergeOptions({
    positionControl: false
  });

  L.Map.addInitHook(function () {
    if (this.options.positionControl) {
        this.positionControl = new L.Control.MousePosition();
        this.addControl(this.positionControl);
    }
  });

  L.control.mousePosition = function (options) {
    return new L.Control.MousePosition(options);
  };
}

export function myToolBar(L){
  L.Control.MyToolBar = L.Control.extend({
    options: { position: 'topleft'},
    onAdd: function (map) {
      const container = L.DomUtil.create('div', 'extentControl leaflet-bar leaflet-control leaflet-touch');
      const btnHome = document.createElement('a');
      btnHome.href = '#';
      btnHome.title = 'max zoom';
      btnHome.id = 'maxZoomBtn';
      btnHome.setAttribute('data-bs-toggle', 'tooltip');
      btnHome.setAttribute('data-bs-placement', 'right');
      container.appendChild(btnHome);
      
      const icon = document.createElement('i');
      icon.className = 'mdi mdi-home';
      btnHome.appendChild(icon);
      return container;
    }
  });

  L.control.myToolBar = function (options) {
    return new L.Control.MyToolBar(options);
  };
}

export function layerControl(mapElement, options={}) {  
  // Pulisci i contenitori prima di ricreare i controlli per evitare duplicazioni
  if (domEl.baseLayerControl) domEl.baseLayerControl.innerHTML = '';
  if (domEl.poiControl) domEl.poiControl.innerHTML = '';
  if (domEl.collectionsControl) domEl.collectionsControl.innerHTML = '';
  if (domEl.adminControl) domEl.adminControl.innerHTML = '';

  //Base Layers
  if(options.baseLayers === true){
    for (const el of Object.entries(mapElement.layerControl.baseLayers)) {
      const div = document.createElement('div');
      div.className = 'form-check';
      const input = document.createElement('input');
      input.className = 'form-check-input';
      input.type = 'radio';
      input.name = 'baseLayer';
      input.id = `baseLayer-${el[0]}`;
      input.value = el[0];
      input.checked = el[1].tile === mapElement.osm;
      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.htmlFor = input.id;
      label.textContent = el[1].label;
      div.appendChild(input);
      div.appendChild(label);
      domEl.baseLayerControl.appendChild(div);
    }
  }
  
  //Poi Layers
  if(options.poi && options.poi !== 'undfined'){
    const includePoi = options.poi || Object.entries(mapElement.layerControl.poi);
    for (const el of includePoi) {
      const obj = mapElement.layerControl.poi[el];    
      if(obj && obj.layer){
        const div = document.createElement('div');
        div.className = 'form-check';
        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'checkbox';
        input.name = 'poi';
        input.id = `${el}-checkBox`;
        input.value = el;
        input.checked = true;
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = input.id;
        label.textContent = `${obj.label} (${obj.layer.getLayers().length})`;
        div.appendChild(input);
        div.appendChild(label);
        domEl.poiControl.appendChild(div);
      }
    }
  }

  if (mapElement.collectionGroup && Object.keys(mapElement.collectionGroup).length > 0) {
    Object.entries(mapElement.collectionGroup).forEach(([collectionName, collectionLayer]) => {
      const currentState = stateManager.getState();
      const collections = currentState.collections || {};
      const collection = Object.values(collections).find(coll => coll.metadata.title === collectionName);
      
      const div = document.createElement('div');
      div.className = 'form-check';
      const input = document.createElement('input');
      input.className = 'form-check-input';
      input.type = 'checkbox';
      input.name = 'collection';
      input.id = `${collectionName}-checkBox`;
      input.value = collectionName;
      input.checked = true;
      if (collection?.metadata?.color?.primary) {
        const color = collection.metadata.color.primary;
        // Applica subito se è checked
        if (input.checked) {
          input.style.backgroundColor = color;
          input.style.borderColor = color;
          input.style.accentColor = color;
        }
        // input.addEventListener('change', function() {
        //   if (this.checked) {
        //     this.style.backgroundColor = color;
        //     this.style.borderColor = color;
        //     this.style.accentColor = color;
        //   }
        // });
      }
      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.htmlFor = input.id;
      label.textContent = `${collectionName} (${collectionLayer.getLayers().length})`;
      div.appendChild(input);
      div.appendChild(label);
      domEl.collectionsControl.appendChild(div);
      domEl.collectionsControl.classList.remove('d-none');
    });
  }

  if(options.admin && options.admin !== 'undfined'){
    const includeAdmin = options.admin || Object.entries(mapElement.layerControl.admin);
    
    for (const key of includeAdmin) {
      const div = document.createElement('div');
      div.className = 'form-check';
      const input = document.createElement('input');
      input.className = 'form-check-input';
      input.type = 'checkbox';
      input.name = 'admin';
      input.id = `admin-level-${key.level}`;
      input.value = key.level;
      input.checked = false;
      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.htmlFor = input.id;
      label.textContent = `${key.name} (${key.count})`;
      div.appendChild(input);
      div.appendChild(label);
      domEl.adminControl.appendChild(div);
    }
  }
}

export function openGallery(feature, layer) {
  layer.on('click', async function() {
    await showGalleryForProps(feature.properties);
  });
}

export async function showGalleryForProps(props) {
  
  if (!props) return;
  let filter = [];
  if (props.feature === 'institution' && props.id) {
    filter = [`inst.id = ${props.id}`];
  } else if (props.feature === 'admin' && props.level !== undefined && props.gid !== undefined) {
    filter = [`af.gid_${props.level} = '${props.gid}'`];
  } else {
    console.warn('Proprietà non valide per la galleria:', props);
    return;
  }
  
  await buildGallery(filter, props);

  if (domEl.closeGalleryBtn && !domEl.closeGalleryBtn.hasListener) {
    domEl.closeGalleryBtn.addEventListener('click', () => {
      toggleGalleryWrap(false);
    });
    domEl.closeGalleryBtn.hasListener = true;
  }
}

async function buildGallery(filter, props) {
  if (!props) return;
  
  // Resetta la gallery se esiste già
  if (galleryInstance && galleryInstance.reset) {
    galleryInstance.reset();
  }
  
  const stateManager = await collectionState();
  const currentState = stateManager.getState();
  stateManager.updateState({
    searchFilters: {
      ...currentState.searchFilters,
      filter: filter,
      feature: { name: props.name }
    }
  });

  // Ricrea sempre la galleryInstance
  galleryInstance = initGallery();
  domEl.mapGalleryWrap.galleryInstance = galleryInstance;
  
  window.onCollect = galleryInstance.onCollect;
  window.onUncollect = galleryInstance.onUnCollect;

  toggleGalleryWrap(true);  
}

function toggleGalleryWrap(show) {
  if (domEl.mapGalleryWrap) {
    if (show) {
      domEl.mapGalleryWrap.classList.add('show');
    } else {
      domEl.mapGalleryWrap.classList.remove('show');
      if (domEl.mapGalleryWrap.galleryInstance) {
        domEl.mapGalleryWrap.galleryInstance.reset();
        // domEl.mapGalleryWrap.galleryInstance = null;
      }
      if (domEl.wrapGallery) domEl.wrapGallery.innerHTML = '';
      if (domEl.mapGalleryTitle) domEl.mapGalleryTitle.innerHTML = '';
    }
  } else {
    console.error('Elemento mapGalleryWrap non trovato');
  }
}

export function openPopUp(properties, smallPopUp = false) {
  const currentState = stateManager.getState();
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>image-remove</title><path fill="rgb(220,53,69)" d="M13.3 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V13.3C20.4 13.1 19.7 13 19 13C17.9 13 16.8 13.3 15.9 13.9L14.5 12L11 16.5L8.5 13.5L5 18H13.1C13 18.3 13 18.7 13 19C13 19.7 13.1 20.4 13.3 21M20.4 19L22.5 21.1L21.1 22.5L19 20.4L16.9 22.5L15.5 21.1L17.6 19L15.5 16.9L16.9 15.5L19 17.6L21.1 15.5L22.5 16.9L20.4 19Z" /></svg>`;
  const fallbackImg = "data:image/svg+xml;utf8," + encodeURIComponent(svg);

  let popupContent = "<div class='card popUpCard'>";
  popupContent += `<div class="card-header mapCardHeader">`;
  popupContent += `<img src="archive/thumb/${properties.thumbnail}" alt="${properties.thumbnail}" loading="lazy" class="cardImage" onerror="this.onerror=null; this.src='${fallbackImg}'"/>`;
  popupContent += `<p class="txt-adc-dark fw-bold headerTxt w-50 ">${properties.id}</p>`;
  popupContent += "</div>";

  popupContent += `<div class="card-body">`;
  popupContent += `<h3 class="card-title txt-adc-dark fw-bold">${properties.category}</h3>`;
  popupContent += `<p class="m-0 mb-1">${properties.nation} / ${properties.county}</p>`;
  popupContent += `<p class="m-0 mb-1">${properties.institution}</p>`;
  popupContent += `<p class="m-0 mb-1">${properties.start} / ${properties.end}</p>`;
  popupContent += `<p class="txt-adc-dark">${properties.description}</p>`;
  popupContent += "</div>";

  const isCollected = currentState.collectStatus && currentState.collectStatus[properties.id];
  const buttonClass = isCollected ? 'btn-danger' : 'btn-adc-blue';
  const buttonText = isCollected ? 'Uncollect' : 'Collect';

  const itemKey = `item_${properties.id}`;
  window.popupItems = window.popupItems || new Map();
  window.popupItems.set(itemKey, properties);
  
  popupContent += `<div class="card-footer d-flex justify-content-start align-items-center gap-2 border-top">`;
  popupContent += `<a href="artifact_view.php?item=${properties.id}" class="btn btn-sm btn-adc-blue text-white">View</a>`;
  if(!smallPopUp){
    popupContent += `<button class="btn btn-sm ${buttonClass} text-white collectItemBtn" onclick="collectToggle('${itemKey}', this)" style="display: inline-block;">${buttonText}</button>`;
  }
  popupContent += "</div>";

  popupContent += "</div>";
  return popupContent;
}

export function collectionControl(collections, currentCollection) {
  console.log(collections, currentCollection);
  
  if (collections && Object.values(collections).length > 0) {
    if (!domEl.collectionDiv) {
      console.error('Elemento collectionDiv non trovato');
      return;
    }
    domEl.collectionDiv.classList.remove('d-none');
    const currentCollectionData = collections[currentCollection];    
    const currentTitle = currentCollectionData?.metadata?.title || 'Titolo non trovato';
    domEl.activeCollectionTitle.innerHTML = `Active collection: <strong>${currentTitle}</strong>`;
    
    if(Object.values(collections).length > 1){
      domEl.collectionListDropdown.innerHTML = '';
      
      Object.values(collections).forEach(item => {
        toggleCollectionListBtn(stateManager, undefined, coll.setActiveCollection)
      });
      domEl.collectionListDropdownBtn.classList.remove('invisible');
    } else {
      domEl.collectionListDropdownBtn.classList.add('invisible');
    }
    
  }else{
    domEl.collectionDiv.classList.remove('d-none');
    console.log('no collections');
    
    domEl.activeCollectionTitle.textContent = 'No available collection';
  }
}

