import mapConfig from "../mapConfig.js";
import { getGeoJson } from "../api/boundsApi.js";
import { addGeoJSONToGroup, createLayerGroup } from "./mapHelper.js";

export function getOrderedBounds(data) {
  const bounds = Object.fromEntries(
    Object.entries(data)
      .filter(([key, value]) => key.startsWith('bounds_') && value !== null)
      .sort(([a], [b]) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]))
      .map(([key, value]) => [key.split('_')[1], value])
  );
  return bounds;
}

// Ottieni il livello massimo dai bounds ordinati
export function getMaxLevel(bounds) {
  return Object.keys(bounds).length > 0 ? Math.max(...Object.keys(bounds).map(k => parseInt(k))) : -1;
}

export async function fetchBoundariesGeoJSON(bounds) {
  const geoJSONData = {};
  
  for (const [level, gid] of Object.entries(bounds)) {
    try {
      const response = await getGeoJson(gid, parseInt(level));
      // Corretto: accedi a items[0].geom
      if (response?.data?.items?.[0]?.geom) {
        const geom = JSON.parse(response.data.items[0].geom);
        geoJSONData[level] = geom;
      }
    } catch (error) {
      console.error(`Error fetching boundary for level ${level}, GID ${gid}:`, error);
    }
  }
  
  return geoJSONData;
}

export function getGeomFromBounds(data) {
  const bounds = getOrderedBounds(data);
  const maxLevel = getMaxLevel(bounds);
  
  return { bounds, maxLevel };
}

export async function addBoundariesToMap(map, bounds, options = {}) {
  if (Object.keys(bounds).length === 0) {
    console.warn('No boundaries to add');
    return null;
  }

  const boundariesGroup = createLayerGroup(map, 'boundaries');
  const geoJSONData = await fetchBoundariesGeoJSON(bounds);
  
  const layers = {};
  for (const [level, geojson] of Object.entries(geoJSONData)) {
    const style = mapConfig.boundaryStyles[level] || mapConfig.boundaryStyles[0];
    
    const layer = addGeoJSONToGroup(boundariesGroup, geojson, {
      style: style,
      onEachFeature: (feature, layer) => {
        if (feature.properties?.name) {
          const popupContent = `<strong>${feature.properties.name}</strong><br>Level: ${level}`;
          layer.bindPopup(popupContent);
        }
      }
    });
    
    layers[level] = layer;
  }
  
  return { group: boundariesGroup, layers };
}