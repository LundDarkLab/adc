const L = window.L;
import mapConfig from "./mapConfig.js";
import { betterScale } from "./components/scale.js";
import { mousePosition } from "./components/mousePosition.js";
import { myToolBar } from "./components/customToolbarMap.js";
import { initZoomEndHandler } from "./utils/mapEvents.js";

function createMapElement() {
  return {
    map: null,
    toolbar: null,
    btnHome: null,
    boundaries: null,
    marker: null,
    adminGroup: {},
    findPlaceGroup: null,
    institutionsGroup: null,
    collectionGroup: {},
    osm: null,
    gStreets: null,
    gSat: null,
    gTerrain: null,
    layerControl: {
      baseLayers: {},
      poi: {},
      admin: {},
    },
  };
}

export async function initMap(id, options = {}) {
  const config = {
    scale: true,
    mousePosition: true,
    toolbar: true,
    ...options
  };
  const mapElement = createMapElement();
  
  // Pulisci istanza precedente se esiste
  const existingMap = L.DomUtil.get(id);
  if (existingMap?._leaflet_id) {
    existingMap._leaflet_id = null;
  }

  // mapElement.map = L.map(id).fitWorld().setZoom(mapConfig.defaultZoom);
  mapElement.map = L.map(id).setView([45.0, 10.0], mapConfig.defaultZoom);

  if(config.scale) {
    betterScale(L);
    L.control.betterScale({ metric: true, imperial: false }).addTo(mapElement.map);
  }
  if(config.mousePosition) {
    mousePosition(L);
    L.control.mousePosition({ emptyString: '', prefix: 'WGS84' }).addTo(mapElement.map);
  }
  if(config.toolbar) {
    myToolBar(L);
    mapElement.toolbar = L.control.myToolBar().addTo(mapElement.map);
  }

  // Usa mapConfig invece di mapsConfig
  mapElement.osm = L.tileLayer(mapConfig.osmMap.tile, {
    attribution: mapConfig.osmMap.attrib,
    maxZoom: mapConfig.maxZoom
  }).addTo(mapElement.map);

  mapElement.gStreets = L.tileLayer(mapConfig.googleMap.streetTile, {
    subdomains: mapConfig.googleMap.gSubDomains,
    maxZoom: mapConfig.maxZoom
  });

  mapElement.gSat = L.tileLayer(mapConfig.googleMap.gSatTile, {
    subdomains: mapConfig.googleMap.gSubDomains,
    maxZoom: mapConfig.maxZoom
  });

  mapElement.gTerrain = L.tileLayer(mapConfig.googleMap.gTerrainTile, {
    subdomains: mapConfig.googleMap.gSubDomains,
    maxZoom: mapConfig.maxZoom
  });

  mapElement.layerControl.baseLayers = {
    "osm": { label: 'OpenStreetMap', tile: mapElement.osm },
    "gStreets": { label: 'Google Streets', tile: mapElement.gStreets },
    "gSat": { label: 'Google Satellite', tile: mapElement.gSat },
    "gTerrain": { label: 'Google Terrain', tile: mapElement.gTerrain }
  };

  setTimeout(() => {
    mapElement.map.invalidateSize();
  }, 100);

  return mapElement;
}