import { initMap } from "../modules/initMaps.js";
import { layerControl } from "./mapsComponent.js";
import { toggleBaseLayer,fetchAdminBoundaries,createGeoJsonLayer, calculateMaxBoundsAndZoom } from "../helpers/mapHelper.js";  

const L = window.L;

export function setStatusAlert(el, status,status_id){
  if(!el || !status || !status_id) return;
  el.textContent='';
  el.classList.remove('alert-danger','alert-success');
  el.textContent = `The item status is: ${status}`;
  el.classList.add(status_id === 1 ? 'alert-danger' : 'alert-success');
}

export function createAccordionItem(data){
  const artifact = data.artifact;
  const crono = data.crono;
  const storagePlace = data.storage_place;
  const findplace = data.artifact_findplace;
  const measure = data.artifact_measure;
  const metadata = data.artifact_metadata;
  const materialTech = data.artifact_material_technique;
  const fieldMap = {};

  if(Object.keys(artifact).length > 0 || data.user){
    if(isValidValue(artifact.name)) {fieldMap.name = artifact.name;}
    if(isValidValue(artifact.category_class)) {fieldMap.category_class = artifact.category_class;}
    if(isValidValue(artifact.category_specs)) {fieldMap.category_specs = artifact.category_specs;}
    if(isValidValue(artifact.type)) {fieldMap.type = artifact.type;}
    if(isValidValue(artifact.description)) {fieldMap.description = artifact.description;}
    if(isValidValue(artifact.notes)) {fieldMap.notes = artifact.notes;}
    if(isValidValue(artifact.start) !== undefined && artifact.start !== null) {fieldMap.start = parseInt(artifact.start);}
    if(isValidValue(artifact.end) !== undefined && artifact.end !== null) {fieldMap.end = parseInt(artifact.end);}
    if(isValidValue(artifact.inventory)) {fieldMap.inventory = artifact.inventory;}
    if(isValidValue(artifact.object_condition)) {fieldMap.object_condition = artifact.object_condition;}
    if(isValidValue(artifact.conservation_state)) {fieldMap.conservation_state = artifact.conservation_state;}
    if(isValidValue(artifact.is_museum_copy)) {fieldMap.is_museum_copy = artifact.is_museum_copy == 0 ? 'false' : 'true';}
    if(isValidValue(artifact.created_at)) {fieldMap.created_at = artifact.created_at.split(' ')[0];}
    if(isValidValue(artifact.last_update)) {fieldMap.last_update = artifact.last_update.split(' ')[0];}
  }

  if(Object.keys(materialTech).length > 0 || data.user){
    materialTech.forEach(item => {
      document.createElement('li');
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'ps-0', 'pt-0');
      let text = item.material;
      if(item.technique !== '' && item.technique !== undefined) { text += ` / ${item.technique}`;}
      li.textContent = text;
      document.getElementById('materialTechList').appendChild(li);
    })
  }

  if(Object.keys(crono).length > 0 || data.user){
    if(crono.start && crono.start.macro) {fieldMap.fromPeriodMacro = crono.start.macro;}
    if(crono.start && crono.start.generic) {fieldMap.fromPeriodGeneric = crono.start.generic;}
    if(crono.start && crono.start.specific) {fieldMap.fromPeriodSpecific = crono.start.specific;}
    if(crono.end && crono.end.macro) {fieldMap.toPeriodMacro = crono.end.macro;}
    if(crono.end && crono.end.generic) {fieldMap.toPeriodGeneric = crono.end.generic;}
    if(crono.end && crono.end.specific) {fieldMap.toPeriodSpecific = crono.end.specific;}
    if(crono.timeline) {fieldMap.timeline_serie = `Reference timeline: ${crono.timeline}`;}
  }

  if(Object.keys(storagePlace).length > 0 || data.user){
    console.log("storage:", storagePlace);
    if(storagePlace.id) {
      const btInstitutionFilter = document.getElementById('btInstitutionFilter');
      btInstitutionFilter.dataset.institutionId = storagePlace.id;
    }
    if(storagePlace.name) {
      fieldMap.storage_name = storagePlace.name;
      const gMapLink = 'http://maps.google.com/maps?q='+storagePlace.name.replace(/ /g,"+");
      const gMap = document.getElementById('gMapLink');
      gMap.href = gMapLink;
    }
    if(storagePlace.city) {fieldMap.storage_address = `${storagePlace.city}, ${storagePlace.address}`;}
    if(storagePlace.url) {fieldMap.storage_link = storagePlace.url;}
    if(storagePlace.logo){
      const img = document.getElementById('institutionImg');
      img.src = `img/logo/${storagePlace.logo}`;
    }
  }

  if(Object.keys(findplace).length > 0 || data.user){
    if(isValidValue(findplace.parish)) {fieldMap.fpparish = findplace.parish;}
    if(isValidValue(findplace.toponym)) {fieldMap.fptoponym = findplace.toponym;}
    if(isValidValue(findplace.notes)) {fieldMap.fpnotes = findplace.notes;}

    for (let i = 0; i <= 5; i++) {
      const el = document.getElementById('fpgid' + i);
      if (isValidValue(el) && findplace['gid' + i] !== undefined) {
        el.textContent = findplace['gid' + i];
      }
    }
    let coo = 'not defined';
    if(isValidValue(findplace.latitude) && isValidValue(findplace.longitude)){
      const lat = parseFloat(findplace.latitude).toFixed(4);
      const lon = parseFloat(findplace.longitude).toFixed(4);
      coo = `${lat} / ${lon}`;
    }
    document.getElementById("fpcoordinates").innerText = coo;
  }

  if(Object.keys(measure).length > 0 || data.user ){
    if(isValidValue(measure.length)) {fieldMap.length = measure.length;}
    if(isValidValue(measure.width)) {fieldMap.width = measure.width;}
    if(isValidValue(measure.depth)) {fieldMap.depth = measure.depth;}
    if(isValidValue(measure.diameter)) {fieldMap.diameter = measure.diameter;}
    if(isValidValue(measure.weight)) {fieldMap.weight = measure.weight;}
    if(isValidValue(measure.notes)) {fieldMap.measures_notes = measure.notes;}
  }else{
    const div = document.getElementById('measureSection');
    div.remove();
  }

  if(Object.keys(metadata).length > 0 || data.user){
    if(metadata.author) {fieldMap.artifact_author = `${metadata.author.first_name} ${metadata.author.last_name}`;}
    if(metadata.owner) {fieldMap.artifact_owner = metadata.owner.name;}
    if(metadata.license) {
      const link = document.getElementById('artifactLicenseLink');
      link.href = metadata.license.link;
      link.textContent = `${metadata.license.license} (${metadata.license.acronym})`;
    }
  }

  Object.entries(fieldMap).forEach(([key, value]) => {
    const el = document.getElementById(key);
    if(el){
      el.textContent = (value !== undefined && value !== null) ? value : 'Not defined';
    }
    
  });

}

let mapElement = null;
export async function artifactMap(data) {
  try {
    if (mapElement && mapElement.map) {
      try { 
        mapElement.map.off(); 
        mapElement.map.remove(); 
      } catch (e) { 
        console.warn('Error removing previous map:', e); 
      }
      mapElement = null;
    }
    mapElement = await initMap('geographic');
    await Promise.all([
      layerControl(mapElement, { baseLayers: true})
    ]);

    document.getElementsByName('baseLayer').forEach(input => {
      input.addEventListener('change', (event) => toggleBaseLayer(event, mapElement));
    });

    let selectedBound = null;
    let selectedLevel = null;
    for (let i = 5 ; i >= 0; i--) {
      const boundsKey = `bounds_${i}`;
      if (isValidValue(data.artifact_findplace[boundsKey])) {
        selectedBound = data.artifact_findplace[boundsKey];
        selectedLevel = i;
        break;
      }
    }
    if (selectedBound && selectedLevel !== null) {
      try {
        const adminData = await fetchAdminBoundaries(selectedLevel, `g.gid_${selectedLevel} = '${selectedBound}'`);
        if (adminData && adminData.data && adminData.data.items) {
          const adminLayer = createGeoJsonLayer(adminData.data.items, {
            level: selectedLevel,
            style: { color: 'red', weight: 2, fillOpacity: 0.1 },
            simplify: false
          });
          if (adminLayer) {
            adminLayer.addTo(mapElement.map);
            mapElement.artifactAdminLayer = adminLayer;
          }
        }
      } catch (error) {
        console.warn('Error loading admin boundary:', error);
      }
    }

    if (isValidValue(data.artifact_findplace.latitude) && isValidValue(data.artifact_findplace.longitude)) {
      const findplaceIcon = L.icon({
        iconUrl: 'img/ico/findPlace.png',
        iconSize:     [40, 40],
        iconAnchor:   [15, 15],
        popupAnchor:  [0, -15]
      });
      const lat = parseFloat(data.artifact_findplace.latitude);
      const lon = parseFloat(data.artifact_findplace.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        const marker = L.marker([lat, lon], {icon:findplaceIcon});
        marker.addTo(mapElement.map);
      }
    }

    mapElement.map.whenReady(() => {
      setTimeout(() => {
        calculateMaxBoundsAndZoom(mapElement.map);
      }, 500);
    });

    const maxZoomBtn = document.getElementById('maxZoomBtn');
    if (maxZoomBtn) {
      maxZoomBtn.addEventListener('click', (e) => {
        e.preventDefault();
        calculateMaxBoundsAndZoom(mapElement.map);
      });
    }

    return mapElement;
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

function isValidValue(value) {
  if (value === null || value === undefined) return false;
  const strValue = value.toString().toLowerCase().trim();
  return strValue !== '' && strValue !== 'not defined';
}