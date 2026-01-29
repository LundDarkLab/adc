import mapConfig from "../../../shared/components/map/mapConfig.js";
import { initMap } from "../../../shared/components/map/initMap.js";
import { addMarkerByCoordinates, fitBoundsToLevel } from "../../../shared/components/map/utils/mapHelper.js";
import { getGeomFromBounds, addBoundariesToMap } from "../../../shared/components/map/utils/mapBoundsUtils.js";
import { initZoomEndHandler } from "../../../shared/components/map/utils/mapEvents.js";


export async function initViewPageMap(findPlaceData) {
  const mapObj = await initMap('geographic',{
    scale:false, 
    mousePosition:false,
  });
    
  const { bounds, maxLevel } = getGeomFromBounds(findPlaceData);

  // Aggiungi boundaries
  mapObj.adminGroup = await addBoundariesToMap(mapObj.map, bounds);

  // Aggiungi marker se ci sono coordinate
  if (findPlaceData.latitude && findPlaceData.longitude) {
    const lat = parseFloat(findPlaceData.latitude);
    const lng = parseFloat(findPlaceData.longitude);

    mapObj.marker = addMarkerByCoordinates(mapObj.map, lat, lng, {icon:mapConfig.findplaceIco});

    if (mapObj.marker) {
      mapObj.map.setView([lat, lng], 16);
    }

  }else{
    fitBoundsToLevel(mapObj.map, mapObj.adminGroup, maxLevel);
  }

  // Inizializza zoom-based layer switching
  initZoomEndHandler(mapObj);

  return mapObj;
}