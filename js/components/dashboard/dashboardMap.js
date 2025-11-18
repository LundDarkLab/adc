import { initMap, addLayers } from "../../modules/initMaps.js";
import { openPopUp } from "../../components/mapsComponent.js";
import { calculateMaxBoundsAndZoom} from "../../helpers/mapHelper.js";
export async function dashboardMap(){
  const map = await initMap('mapWrap');
  await addLayers(map, { 
    layers: { findplace: true},
    onClickCallback: {findplace: (item) => openPopUp(item, true)}
  });
  calculateMaxBoundsAndZoom(map.map);
  return map;
}
function institutionPopUp(item) {
  let content = '<div class="institution-popup">';
  content += '<h5>Institution Details</h5>';
  content += '<ul>';
  for (const [key, value] of Object.entries(item)) {
    if (value !== null && value !== undefined && value !== '') {
      content += `<li><strong>${key}:</strong> ${value}</li>`;
    }
  }
  content += '</ul>';
  content += '</div>';
  return content;
}