const L = window.L;
import mapsConfig from "../helpers/mapsConfig.js";
import { betterScale, mousePosition, myToolBar } from "../components/mapsComponent.js";
import { fetchFindPlace, addFindPlaceMarkers, fetchInstitution, addInstitutionMarkers,fetchCollection, addCollectionMarkers, getAvailableLevels, zoomEvent} from "../helpers/mapHelper.js";

const mapElementTemplate = {
  map: null,
  toolbar:null,
  btnHome: null,
  boundaries: null,
  marker: null,
  adminGroup: {},
  findPlaceGroup: null,
  institutionsGroup: null,
  collectionGroup:{},
  osm: null,
  gStreets: null,
  gSat: null,
  gTerrain: null,
  layerControl: {
    baseLayers: {},
    poi:{},
    admin: {},
  },
}

export async function initMap(id) {
  const mapElement = {...mapElementTemplate}
  if(mapElement.map){mapElement.map.remove();}
  if (L.DomUtil.get(id) !== null) {L.DomUtil.get(id)._leaflet_id = null;}

  mapElement.map = L.map(id).fitWorld().setZoom(mapsConfig.defaultZoom);
  
  betterScale(L);
  mousePosition(L);
  myToolBar(L);

  L.control.betterscale({metric:true, imperial:false}).addTo(mapElement.map);
  L.control.mousePosition({emptystring:'',prefix:'WGS84'}).addTo(mapElement.map);
  mapElement.toolbar = L.control.myToolBar().addTo(mapElement.map);

  mapElement.osm = L.tileLayer(mapsConfig.osmMap.tile, {attribution: mapsConfig.osmMap.attrib, maxZoom: mapsConfig.maxZoom}).addTo(mapElement.map);
  mapElement.gStreets = L.tileLayer(mapsConfig.googleMap.streetTile, {subdomains: mapsConfig.googleMap.gSubDomains, maxZoom: mapsConfig.maxZoom});
  mapElement.gSat = L.tileLayer(mapsConfig.googleMap.gSatTile, {subdomains: mapsConfig.googleMap.gSubDomains, maxZoom: mapsConfig.maxZoom});
  mapElement.gTerrain = L.tileLayer(mapsConfig.googleMap.gTerrainTile, {subdomains: mapsConfig.googleMap.gSubDomains, maxZoom: mapsConfig.maxZoom});

  mapElement.layerControl.baseLayers = {
    "osm":{'label':'OpenStreetMap','tile': mapElement.osm},
    "gStreets":{'label':'Google Streets','tile': mapElement.gStreets},
    "gSat":{'label':'Google Satellite','tile': mapElement.gSat},
    "gTerrain":{'label':'Google Terrain','tile': mapElement.gTerrain}
  };   

  mapElement.map.on('zoomend', () => {
    const currentZoom = mapElement.map.getZoom();
    zoomEvent(currentZoom, mapElement);
  });

  return mapElement;
}

export async function addLayers(mapElement, options={}) {
  const { layers = {}, onClickCallback = {} } = options;
  const { findplace = false, institutions = false, collections = false, admin = [] } = layers;
  const collectionItemIds = new Set();

  if (collections) {
    const data = await fetchCollection();
    const collectionsArray = data.collections ? Object.values(data.collections) : [];
    if (collectionsArray.length > 0) {
      addCollectionMarkers(mapElement, collectionsArray, onClickCallback.collections);
      collectionsArray.forEach(collection => {
        if (collection.items && Array.isArray(collection.items)) {
          collection.items.forEach(item => {
            if (item.id) {
              collectionItemIds.add(item.id);
            }
          });
        }
      });
    }
  }

  if (findplace) {
    const data = await fetchFindPlace();

    if (data && data.error === 0 && data.data?.items?.length) {
      const filteredItems = data.data.items.filter(item => 
        !collectionItemIds.has(item.id) && item.latitude && item.longitude
      );
      
      if (filteredItems.length > 0) {
        const filteredData = { ...data, data: { ...data.data, items: filteredItems }};
        addFindPlaceMarkers(mapElement, filteredData, onClickCallback.findplace);
        mapElement.layerControl.poi['findplace'] = { 'label': 'Find', 'layer': mapElement.findPlaceGroup };
      }
    }
  }

  if (institutions) {
    const data = await fetchInstitution();
    addInstitutionMarkers(mapElement, data, onClickCallback.institutions);
    mapElement.layerControl.poi['institutions'] = { 'label': 'Institutions', 'layer': mapElement.institutionsGroup };
  }

  let availableLevels = [];
  if(admin.length > 0){
    mapElement.adminGroup = {};
    const availableData = await getAvailableLevels(admin);
    availableLevels = availableData.data.levels || [];
  }

  return { mapElement, availableLevels, onClickCallback };
}

const refreshQueues = new WeakMap();
export function refreshClusters(mapElement, options = {}) {
  if (!mapElement) return Promise.resolve();

  const previous = refreshQueues.get(mapElement) || Promise.resolve();
  const next = previous
    .catch(() => {}) // evita blocchi se la precedente ha fallito
    .then(() => performRefresh(mapElement, options));

  refreshQueues.set(mapElement, next);
  return next;
}

async function performRefresh(mapElement, options = {}) {
  for (const key in mapElement.collectionGroup) {
    const grp = mapElement.collectionGroup[key];
    if (grp) {
      if (mapElement.map.hasLayer(grp)) mapElement.map.removeLayer(grp);
      if (grp.clearLayers) grp.clearLayers();
    }
  }
  mapElement.collectionGroup = {};

  const existingFindplace = mapElement.layerControl?.poi?.findplace;
  if (existingFindplace?.layer) {
    if (mapElement.map.hasLayer(existingFindplace.layer)) {
      mapElement.map.removeLayer(existingFindplace.layer);
    }
    if (existingFindplace.layer.clearLayers) {
      existingFindplace.layer.clearLayers();
    }
  }

  if (
    mapElement.findPlaceGroup &&
    mapElement.findPlaceGroup !== existingFindplace?.layer
  ) {
    if (mapElement.map.hasLayer(mapElement.findPlaceGroup)) {
      mapElement.map.removeLayer(mapElement.findPlaceGroup);
    }
    if (mapElement.findPlaceGroup.clearLayers) {
      mapElement.findPlaceGroup.clearLayers();
    }
  }
  mapElement.findPlaceGroup = null;

  if (mapElement.layerControl?.poi?.findplace) {
    delete mapElement.layerControl.poi.findplace;
  }

  const defaultOptions = {
    layers: { collections: true, findplace: true, admin: [0, 1, 2, 3, 4, 5] },
    onClickCallback: {
      collections: (item) => console.log('Default callback for collections:', item),
      findplace: (item) => console.log('Default callback for findplace:', item),
    },
  };
  const mergedOptions = { ...defaultOptions, ...options };
  const result = await addLayers(mapElement, mergedOptions);
  Object.assign(mapElement, result.mapElement);
  return result;
}