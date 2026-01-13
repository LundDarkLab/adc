import { getSimpleBoundary } from "../../../helpers/mapHelper.js";
import { adminLevelOptions } from "../api/getArtifactSelect.js";

export async function handleBoundariesChange(map, idx){
  for (let i = idx+1 ; i <= 7; i++) {
    const sel = document.getElementById('gid_' + i + '_container');
    if (sel) { sel.classList.add('hide'); }
  }
  const parentID = parseInt(idx) - 1;
  const parent = document.getElementById('gid_'+parentID).value
  const boundary = await getSimpleBoundary(parentID, parent);
  // Validate and extract geometry
  if (!boundary || !boundary.data?.success || !boundary.data?.items?.length) {
    console.error('Invalid boundary data');
    return;
  }
  
  const item = boundary.data.items[0];
  if (!item.geom) {
    console.error('No geometry in boundary data');
    return;
  }
  
  // Parse GeoJSON and create layer to get bounds
  try {
    const geom = JSON.parse(item.geom);
    const geoJsonLayer = L.geoJSON(geom);
    const bounds = geoJsonLayer.getBounds();
    
    if (bounds.isValid()) {
      map.fitBounds(bounds);
    } else {
      console.error('Bounds are not valid');
    }
  } catch (error) {
    console.error('Error parsing geometry:', error);
  }
}

export async function levelOptions(gid, filter, selected) {
  const response = await adminLevelOptions(gid, filter, selected);
  const parent = document.getElementById('gid_' + gid);
  if (response.length === 0) { return false; }
  
  // Imposta il valore selezionato sul parent (livello corrente)
  if(selected && parent){ 
    parent.value = selected;
  }
  
  let current = parseInt(gid);
  if (current <= 6 && filter) { current = (current + 1); }
  
  const selContainer = document.getElementById(`gid_${current}_container`);
  const sel = document.getElementById(`gid_${current}`);
  
  if(sel){
    sel.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = '';
    opt.text = '-- select value --';
    if (current === 0) {
      if (!selected) { opt.selected = true; }
      opt.disabled = true;
    }
    sel.appendChild(opt);
    
    response.forEach((item, i) => {
      const opt = document.createElement('option');
      opt.value = item.gid;
      opt.text = item.name;
      sel.appendChild(opt);
    });
    
    if (current > 0) { 
      selContainer.classList.remove('hide'); 
    }
  }
  
  return true;
}