import { initMap } from "../modules/initMaps.js";
import { layerControl } from "./mapsComponent.js";
import { toggleBaseLayer,fetchAdminBoundaries,createGeoJsonLayer, calculateMaxBoundsAndZoom } from "../helpers/mapHelper.js";
import { groupBy } from "../helpers/utils.js";
import { fullImage, deleteMedia } from "../helpers/artifactHelper.js";
import { confirmAction } from "../helpers/helper.js";

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
    console.log(`bounds: ${selectedBound}, level: ${selectedLevel}`);

    if (selectedBound && selectedLevel !== null) {
      try {
        const adminData = await fetchAdminBoundaries(selectedLevel, `g.gid_${selectedLevel} = '${selectedBound}'`, true);
        if (adminData && adminData.data && adminData.data.items) {
          console.log(`Admin boundaries fetched for level ${selectedLevel}:`, adminData.data.items);
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
        // Enhanced safety checks
        const hasLayers = Object.keys(mapElement.map._layers).length > 0;
        const hasValidBounds = mapElement.map.getBounds && mapElement.map.getBounds().isValid();
        const hasValidCenter = mapElement.map.getCenter && mapElement.map.getCenter() && !isNaN(mapElement.map.getCenter().lat) && !isNaN(mapElement.map.getCenter().lng);
        
        if (hasLayers || hasValidBounds) {
          try {
            calculateMaxBoundsAndZoom(mapElement.map);
          } catch (error) {
            console.warn('Error in calculateMaxBoundsAndZoom:', error);
            // Fallback: set a default view
            mapElement.map.setView([0, 0], 2);
          }
        } else if (!hasValidCenter) {
          // Ensure a valid center if no layers/bounds
          mapElement.map.setView([0, 0], 2);
        }
      }, 500);
    });

    const maxZoomBtn = document.getElementById('maxZoomBtn');
    if (maxZoomBtn) {
      maxZoomBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Enhanced safety checks for button click
        const hasLayers = Object.keys(mapElement.map._layers).length > 0;
        const hasValidBounds = mapElement.map.getBounds && mapElement.map.getBounds().isValid();
        const hasValidCenter = mapElement.map.getCenter && mapElement.map.getCenter() && !isNaN(mapElement.map.getCenter().lat) && !isNaN(mapElement.map.getCenter().lng);
        
        if (hasLayers || hasValidBounds) {
          try {
            calculateMaxBoundsAndZoom(mapElement.map);
          } catch (error) {
            console.warn('Error in calculateMaxBoundsAndZoom:', error);
            mapElement.map.setView([0, 0], 2);
          }
        } else if (!hasValidCenter) {
          mapElement.map.setView([0, 0], 2);
        }
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

export function createMediaTab(mediaItems){
  const usr = document.getElementById('activeUsr').value;  
  const mediaTabContent = document.getElementById('media');

  const navTabs = document.createElement('ul');
  navTabs.classList.add('nav','nav-tabs','mb-3');
  navTabs.id = 'mediaTab';
  navTabs.role = 'tablist';

  const navPanes = document.createElement('div');
  navPanes.classList.add('tab-content');
  navPanes.id = 'mediaTabContent';
  mediaTabContent.append(navTabs, navPanes);

  const groupMedia = groupBy(['type'])(mediaItems);
  Object.keys(groupMedia).forEach((key, index) => {
    if (!key.trim()) return;
    let active = index === 0 ? 'active' : '';
    let show = index === 0 ? 'show' : '';
    
    const li = document.createElement('li');
    li.classList.add('nav-item');
    li.role = 'presentation';
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('nav-link');
    if (active) button.classList.add('active');
    button.role = 'tab';
    button.id = `${key}Tab`;
    button.dataset.bsTarget = `#${key}Pane`;
    button.dataset.bsToggle = 'tab';
    button.ariaControls = `${key}Pane`;
    button.ariaSelected = index == 0 ? 'true' : 'false';
    button.textContent = key;
    li.appendChild(button);
    navTabs.appendChild(li);

    const tabPane = document.createElement('div');
    tabPane.classList.add('fade', 'tab-pane');
    if (show) tabPane.classList.add('show');
    if (active) tabPane.classList.add('active');
    tabPane.id = `${key}Pane`;
    tabPane.role = 'tabpanel';
    tabPane.ariaLabelledby = `${key}Tab`;
    navPanes.appendChild(tabPane);

    if(key.toLowerCase() === 'image'){
      const imgWrap = document.createElement('div');
      imgWrap.id = 'imgDiv';
      tabPane.appendChild(imgWrap);
      groupMedia[key].forEach(item => {
        console.log(item);
        const imgCard = document.createElement('div');
        imgCard.classList.add('imgCard', 'bg-white', 'rounded', 'border', 'p-2', 'mb-3');
        imgWrap.appendChild(imgCard);

        const imgElement = document.createElement('div');
        imgElement.classList.add('imgCard-img');
        imgElement.style.backgroundImage = `url("../../archive/image/${item.path}")`;

        const textElement = document.createElement('div');
        textElement.classList.add('imgCard-text');
        textElement.textContent = item.text || 'No description available';

        const btnElement = document.createElement('div');
        btnElement.classList.add('imgCard-btn');
        const btnFullImage = document.createElement('button');
        btnFullImage.classList.add('btn', 'btn-sm', 'btn-adc-blue', 'me-1');
        btnFullImage.innerHTML = '<span class="mdi mdi-magnify-expand"></span>';
        btnFullImage.title = 'View Full Image';
        btnFullImage.onclick = () => {  fullImage(item); };
        btnElement.appendChild(btnFullImage);

        if (isNaN(usr)) {
          const editBtn = document.createElement('button');
          editBtn.type = 'button';
          editBtn.className = 'btn btn-sm btn-adc-blue me-1';
          editBtn.innerHTML = '<span class="mdi mdi-file-document-edit"></span>';
          editBtn.title = 'Edit Image Metadata';
          editBtn.addEventListener('click', function() { imageMetadataEdit(item); });
          btnElement.appendChild(editBtn);

          const deleteBtn = document.createElement('button');
          deleteBtn.type = 'button';
          deleteBtn.className = 'btn btn-sm btn-danger';
          deleteBtn.innerHTML = '<span class="mdi mdi-delete-forever"></span>';
          deleteBtn.title = 'Delete Image';
          deleteBtn.addEventListener('click', () => {
            const deleteAlert = 'Are you sure you want to delete the image? If you confirm the image will be permanently deleted from the server and it will not be possible to restore it';
            confirmAction(deleteAlert, ()=>{
              const res = deleteMedia(item.file, item.path || null);
              if(res){imgCard.remove();}
            })
          });
          btnElement.appendChild(deleteBtn);
        }

        imgCard.append(imgElement, textElement, btnElement);
      });
    }

    if(key.toLowerCase() === 'document'){
      const docWrap = document.createElement('div');
      docWrap.id = 'docDiv';
      tabPane.appendChild(docWrap);
      groupMedia[key].forEach(item => {
        console.log(item);
        
      });
    }

    if(key.toLowerCase() === 'video'){
      const videoWrap = document.createElement('div');
      videoWrap.id = 'videoDiv';
      tabPane.appendChild(videoWrap);
      groupMedia[key].forEach(item => {
        console.log(item);
      });
    }
  });
}