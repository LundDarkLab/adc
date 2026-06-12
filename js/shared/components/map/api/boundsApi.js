import { fetchApi } from "../../../utils/fetch.js";

export function getGeoJson(gid, level){
  const body = { 
    class: 'Geom', 
    action: 'getSimpleBoundary', 
    gid: gid,
    level: level
  };
  try {
    return fetchApi({ body });
  } catch (error) {
    console.error(`Error fetching GeoJSON for GID ${gid}:`, error);
  }
}