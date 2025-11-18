import { bsAlert } from "../components/bsComponents.js";
import { initMap } from "../modules/initMaps.js";
import { domEl, layerControl } from "./mapsComponent.js";
import { toggleBaseLayer,fetchAdminBoundaries,createGeoJsonLayer, calculateMaxBoundsAndZoom } from "../helpers/mapHelper.js";
import { groupBy, basePath, cutString } from "../helpers/utils.js";
import { fullImage, deleteMedia } from "../helpers/artifactHelper.js";
import { confirmAction, fetchApi } from "../helpers/helper.js";

const L = window.L;
let googleChartsLoaded = false;
async function loadGoogleCharts() {
  if (googleChartsLoaded) return;
  if (typeof google === 'undefined' || !google.charts) {
    throw new Error('Google Charts library not available');
  }
  return new Promise((resolve) => {
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(() => {
      googleChartsLoaded = true;
      resolve();
    });
  });
}

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
        const adminData = await fetchAdminBoundaries(selectedLevel, `g.gid_${selectedLevel} = '${selectedBound}'`, true);
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
        mapElement.map.invalidateSize();
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

// Funzione helper per creare la sezione immagini
function createImageSection(images, usr, tabPane) {
  const imgPath = basePath() + 'archive/image/';
  tabPane.innerHTML = '';
  const imgWrap = document.createElement('div');
  imgWrap.id = 'imgDiv';
  const fragment = document.createDocumentFragment();
  images.forEach(item => {
    if (!item || !item.path) return;
    const imgCard = document.createElement('div');
    imgCard.classList.add('imgCard', 'bg-white', 'rounded', 'border', 'p-2', 'mb-3');

    const imgElement = document.createElement('div');
    imgElement.classList.add('imgCard-img');
    imgElement.style.backgroundImage = `url("${imgPath}${item.path}")`;

    const textElement = document.createElement('div');
    textElement.classList.add('imgCard-text');
    textElement.textContent = cutString(item.text, 50) || 'No description available';

    const btnElement = document.createElement('div');
    btnElement.classList.add('imgCard-btn');
    const btnFullImage = document.createElement('button');
    btnFullImage.classList.add('btn', 'btn-sm', 'btn-adc-blue', 'me-1');
    btnFullImage.innerHTML = '<span class="mdi mdi-magnify-expand"></span>';
    btnFullImage.title = 'View Full Image';
    btnFullImage.onclick = () => { fullImage(item); };
    btnElement.appendChild(btnFullImage);

    if (!isNaN(usr)) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-sm btn-adc-blue me-1';
      editBtn.innerHTML = '<span class="mdi mdi-file-document-edit"></span>';
      editBtn.title = 'Edit Image Metadata';
      editBtn.addEventListener('click', () => { imageMetadataEdit(item); });
      btnElement.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-sm btn-danger';
      deleteBtn.innerHTML = '<span class="mdi mdi-delete-forever"></span>';
      deleteBtn.title = 'Delete Image';
      deleteBtn.addEventListener('click', () => {
        const deleteAlert = 'Are you sure you want to delete the image? If you confirm the image will be permanently deleted from the server and it will not be possible to restore it';
        confirmAction(deleteAlert, () => {
          const res = deleteMedia(item.file, item.path || null);
          if (res) { imgCard.remove(); }
        });
      });
      btnElement.appendChild(deleteBtn);
    }

    imgCard.append(imgElement, textElement, btnElement);
    fragment.appendChild(imgCard);
  });
  imgWrap.appendChild(fragment);
  tabPane.appendChild(imgWrap);
}

// Funzione helper per creare la sezione documenti
function createDocumentSection(documents, usr, tabPane) {
  const docPath = basePath() + 'archive/document/';
  
  tabPane.innerHTML = '';
  const docWrap = document.createElement('div');
  docWrap.id = 'docDiv';
  const ul = document.createElement('ul');
  ul.id = 'docList';
  const fragment = document.createDocumentFragment();
  documents.forEach(item => {
    if (!item) return;
    const li = document.createElement('li');
    const docItem = document.createElement('div');
    docItem.classList.add('docItem');

    // Sezione path
    if (item.path && item.path.trim()) {
      const divLabel = document.createElement('div');
      const divLink = document.createElement('div');
      divLabel.classList.add('divLabel');
      divLink.classList.add('divLink');

      const labelSpan = document.createElement('span');
      const valueSpan = document.createElement('a');
      labelSpan.textContent = 'download file:';
      valueSpan.textContent = item.path;
      valueSpan.href = docPath + item.path;
      valueSpan.target = '_blank';

      divLabel.appendChild(labelSpan);
      divLink.appendChild(valueSpan);

      const sectionDiv = document.createElement('div');
      sectionDiv.classList.add('docSection');
      sectionDiv.appendChild(divLabel);
      sectionDiv.appendChild(divLink);
      docItem.appendChild(sectionDiv);
    }

    // Sezione url
    if (item.url && item.url.trim()) {
      const divLabel = document.createElement('div');
      const divLink = document.createElement('div');
      divLabel.classList.add('divLabel');
      divLink.classList.add('divLink');

      const labelSpan = document.createElement('span');
      const valueLink = document.createElement('a');
      labelSpan.textContent = 'external resource:';
      valueLink.href = item.url;
      valueLink.textContent = item.url;
      valueLink.target = '_blank';

      divLabel.appendChild(labelSpan);
      divLink.appendChild(valueLink);

      const sectionDiv = document.createElement('div');
      sectionDiv.classList.add('docSection');
      sectionDiv.appendChild(divLabel);
      sectionDiv.appendChild(divLink);
      docItem.appendChild(sectionDiv);
    }

    // Sezione text
    if (item.text && item.text.trim()) {
      const divLabel = document.createElement('div');
      const divLink = document.createElement('div');
      divLabel.classList.add('divLabel');
      divLink.classList.add('divLink');

      const labelSpan = document.createElement('span');
      const valueSpan = document.createElement('span');
      labelSpan.textContent = 'notes:';
      valueSpan.textContent = item.text;

      divLabel.appendChild(labelSpan);
      divLink.appendChild(valueSpan);

      const sectionDiv = document.createElement('div');
      sectionDiv.classList.add('docSection');
      sectionDiv.appendChild(divLabel);
      sectionDiv.appendChild(divLink);
      docItem.appendChild(sectionDiv);
    }

    // toolbar
    if (!isNaN(usr)) {
      const btnElement = document.createElement('div');
      btnElement.classList.add('document-btn');

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-sm btn-adc-blue me-1';
      editBtn.innerHTML = '<span class="mdi mdi-file-document-edit"></span>';
      editBtn.title = 'Edit Document Metadata';
      editBtn.addEventListener('click', () => { documentMetadataEdit(item); });
      btnElement.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-sm btn-danger';
      deleteBtn.innerHTML = '<span class="mdi mdi-delete-forever"></span>';
      deleteBtn.title = 'Delete Document';
      deleteBtn.addEventListener('click', () => {
        const deleteAlert = 'Are you sure you want to delete the document? If you confirm the document will be permanently deleted from the server and it will not be possible to restore it';
        confirmAction(deleteAlert, () => {
          const res = deleteMedia(item.id);
          if (res) { li.remove(); }
        });
      });
      btnElement.appendChild(deleteBtn);

      docItem.appendChild(btnElement);
    }

    li.appendChild(docItem);
    fragment.appendChild(li);
  });
  ul.appendChild(fragment);
  docWrap.appendChild(ul);
  tabPane.appendChild(docWrap);
}

// Funzione helper per creare la sezione video
function createVideoSection(videos, usr, tabPane) {
  tabPane.innerHTML = '';
  const videoWrap = document.createElement('div');
  videoWrap.id = 'videoDiv';
  const fragment = document.createDocumentFragment();
  videos.forEach(item => {
    if (!item || !item.url || !item.url.includes('youtube.com/watch?v=')) return;
    const videoCard = document.createElement('div');
    videoCard.classList.add('videoCard', 'bg-white', 'rounded', 'border', 'p-2', 'mb-3', 'embed-responsive', 'embed-responsive-16by9');

    const iframe = document.createElement('iframe');
    iframe.classList.add('embed-responsive-item', 'videoCard-video');
    iframe.src = item.url.replace('watch?v=', 'embed/');
    iframe.allowFullscreen = true;
    videoCard.appendChild(iframe);

    const videoText = document.createElement('div');
    videoText.classList.add('videoCard-text');
    videoText.textContent = item.text || 'No description available';
    videoCard.appendChild(videoText);

    if (!isNaN(usr)) {
      const btnElement = document.createElement('div');
      btnElement.classList.add('video-btn');

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-sm btn-adc-blue me-1';
      editBtn.innerHTML = '<span class="mdi mdi-file-document-edit"></span>';
      editBtn.title = 'Edit Video Metadata';
      editBtn.addEventListener('click', () => { documentMetadataEdit(item); });
      btnElement.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-sm btn-danger';
      deleteBtn.innerHTML = '<span class="mdi mdi-delete-forever"></span>';
      deleteBtn.title = 'Delete Video';
      deleteBtn.addEventListener('click', () => {
        const deleteAlert = 'Are you sure you want to delete the video? If you confirm the video will be permanently deleted from the server and it will not be possible to restore it';
        confirmAction(deleteAlert, () => {
          const res = deleteMedia(item.id);
          if (res) { videoCard.remove(); }
        });
      });
      btnElement.appendChild(deleteBtn);

      videoCard.appendChild(btnElement);
    }

    fragment.appendChild(videoCard);
  });
  videoWrap.appendChild(fragment);
  tabPane.appendChild(videoWrap);
}

export function createMediaTab(mediaItems) {
  if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
    console.warn('No media items provided or invalid data.');
    return;
  }

  const usr = document.getElementById('activeUsr').value;
  const groupMedia = groupBy(['type'])(mediaItems);

  Object.keys(groupMedia).forEach((key) => {
    if (!key.trim()) return;
    const tabPane = document.getElementById(`nav-${key.toLowerCase()}`);
    if (!tabPane) {
      console.warn(`Tab pane for ${key} not found.`);
      return;
    }

    try {
      if (key.toLowerCase() === 'image' && groupMedia[key].length > 0) {
        createImageSection(groupMedia[key], usr, tabPane);
      }

      if (key.toLowerCase() === 'document' && groupMedia[key].length > 0) {
        createDocumentSection(groupMedia[key], usr, tabPane);
      }

      if (key.toLowerCase() === 'video' && groupMedia[key].length > 0) {
        createVideoSection(groupMedia[key], usr, tabPane);
      }
    } catch (error) {
      console.error(`Error processing media type ${key}:`, error);
    }
  });
}

export async function lineChart(id,type, container){
  await loadGoogleCharts();
  let statData = [['chronology', 'tot']]
  const body = { class: 'Stats', action: 'typeChronologicalDistribution', id: id }
  try {
    const result = await fetchApi({ url: ENDPOINT, body });
    if(result.error === 1 || !result ) { throw new Error("Error fetching statistics data");}
    if(!result.data || result.data.length === 0) {
      container.classList.add('noData');
      container.innerHTML = '<h4>No statistical data available for this artifact type</h4>';
      return false;
    }
    container.classList.remove('noData');
    container.innerHTML='';
    
    result.data.forEach((v) => { statData.push([v.crono, v.tot]) })
    google.charts.setOnLoadCallback(function(){
      var data = google.visualization.arrayToDataTable(statData);
      var options = {
        title: type + ' Chronological distribution',
        curveType: 'function',
        legend: { position: 'bottom' },
        pointsVisible: true
      };
      var chart = new google.visualization.LineChart(document.getElementById('lineChart'));
      chart.draw(data, options);
    });
    return true;
  } catch (error) {
    bsAlert(`Error fetching Artifact statistics: ${error}`, 'danger');
    return false;
  }
}

export async function columnChart(id, type, container){
  await loadGoogleCharts();
  let statData = [['chronology', 'tot', { role: 'style' }]]
  const body = { class: 'Stats', action: 'institutionDistribution', filter:[`a.category_class = ${id}`] }
  try {
    const result = await fetchApi({ url: ENDPOINT, body });
    if(result.error === 1 || !result ) { throw new Error("Error fetching statistics data");}
    if(!result.data || result.data.length === 0) {
      container.classList.add('noData');
      container.innerHTML = '<h4>No statistical data available for this artifact type</h4>';
      return false;
    }
    container.classList.remove('noData');
    container.innerHTML='';
    result.data.forEach((v) => { statData.push([v.name, v.tot, 'color: '+v.color]) });
    google.charts.setOnLoadCallback(function(){
      var data = google.visualization.arrayToDataTable(statData);
      var options = {
        title: 'Number of '+type + ' by Institution',
        legend: { position: 'none' },
        // bar:{groupWidth:"95%" }
      };
      var chart = new google.visualization.ColumnChart(document.getElementById('columnChart'));
      chart.draw(data, options);
    });
  } catch (error) {
    bsAlert(`Error fetching Artifact statistics: ${error}`, 'danger');
    return false;
  }
}

export async function artifactList(payload={}){
  try {
    payload.class = 'Artifact';
    payload.action = 'artifactList';
    const response = await fetchApi({ url: ENDPOINT, body: payload });
    if (response.error === 1) throw new Error("Error fetching Artifact list");
    return response.data;
  } catch (error) {
    bsAlert(`Error fetching Artifact list: ${error}`, 'danger');
    return false;
  }
}