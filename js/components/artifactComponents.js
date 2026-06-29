import { bsAlert } from "../components/bsComponents.js";
import { initMap } from "../modules/initMaps.js";
import { layerControl } from "./mapsComponent.js";
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

function fillArtifactFields(artifact, fieldMap, hasUser) {
  if (!Object.keys(artifact).length && !hasUser) return;
  ['name', 'category_class', 'category_specs', 'type', 'description', 'notes', 'inventory', 'object_condition', 'conservation_state']
    .forEach(k => { if (isValidValue(artifact[k])) fieldMap[k] = artifact[k]; });
  if (isValidValue(artifact.start)) fieldMap.start = parseInt(artifact.start);
  if (isValidValue(artifact.end)) fieldMap.end = parseInt(artifact.end);
  if (isValidValue(artifact.is_museum_copy)) fieldMap.is_museum_copy = artifact.is_museum_copy == 0 ? 'false' : 'true';
  if (isValidValue(artifact.created_at)) fieldMap.created_at = artifact.created_at.split(' ')[0];
  if (isValidValue(artifact.last_update)) fieldMap.last_update = artifact.last_update.split(' ')[0];
}

function fillMaterialTech(materialTech, hasUser) {
  if (!Object.keys(materialTech).length && !hasUser) return;
  const list = document.getElementById('materialTechList');
  materialTech.forEach(item => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'ps-0', 'pt-0');
    li.textContent = item.technique?.trim() ? `${item.material} / ${item.technique}` : item.material;
    list.appendChild(li);
  });
}

function fillCronoFields(crono, fieldMap, hasUser) {
  if (!Object.keys(crono).length && !hasUser) return;
  if (crono.start?.macro) fieldMap.fromPeriodMacro = crono.start.macro;
  if (crono.start?.generic) fieldMap.fromPeriodGeneric = crono.start.generic;
  if (crono.start?.specific) fieldMap.fromPeriodSpecific = crono.start.specific;
  if (crono.end?.macro) fieldMap.toPeriodMacro = crono.end.macro;
  if (crono.end?.generic) fieldMap.toPeriodGeneric = crono.end.generic;
  if (crono.end?.specific) fieldMap.toPeriodSpecific = crono.end.specific;
  if (crono.timeline) fieldMap.timeline_serie = `Reference timeline: ${crono.timeline}`;
}

function fillStoragePlaceFields(storagePlace, fieldMap, hasUser) {
  if (!Object.keys(storagePlace).length && !hasUser) return;
  if (storagePlace.id) document.getElementById('btInstitutionFilter').dataset.institutionId = storagePlace.id;
  if (storagePlace.name) {
    fieldMap.storage_name = storagePlace.name;
    document.getElementById('gMapLink').href = 'http://maps.google.com/maps?q=' + storagePlace.name.replaceAll(' ', '+');
  }
  if (storagePlace.city) fieldMap.storage_address = `${storagePlace.city}, ${storagePlace.address}`;
  if (storagePlace.url) fieldMap.storage_link = storagePlace.url;
  if (storagePlace.logo) document.getElementById('institutionImg').src = `img/logo/${storagePlace.logo}`;
}

function fillFindplaceFields(findplace, fieldMap, hasUser) {
  if (!Object.keys(findplace).length && !hasUser) return;
  if (isValidValue(findplace.parish)) fieldMap.fpparish = findplace.parish;
  if (isValidValue(findplace.toponym)) fieldMap.fptoponym = findplace.toponym;
  if (isValidValue(findplace.notes)) fieldMap.fpnotes = findplace.notes;
  for (let i = 0; i <= 5; i++) {
    const el = document.getElementById('fpgid' + i);
    if (isValidValue(el) && findplace['gid' + i] !== undefined) el.textContent = findplace['gid' + i];
  }
  let coo = 'not defined';
  if (isValidValue(findplace.latitude) && isValidValue(findplace.longitude)) {
    coo = `${parseFloat(findplace.latitude).toFixed(4)} / ${parseFloat(findplace.longitude).toFixed(4)}`;
  }
  document.getElementById('fpcoordinates').innerText = coo;
}

function fillMeasureFields(measure, fieldMap, hasUser) {
  if (!Object.keys(measure).length && !hasUser) {
    document.getElementById('measureSection')?.remove();
    return;
  }
  ['length', 'width', 'depth', 'diameter', 'weight'].forEach(k => {
    if (isValidValue(measure[k])) fieldMap[k] = measure[k];
  });
  if (isValidValue(measure.notes)) fieldMap.measures_notes = measure.notes;
}

function fillMetadataFields(metadata, fieldMap, hasUser) {
  if (!Object.keys(metadata).length && !hasUser) return;
  if (metadata.author) fieldMap.artifact_author = `${metadata.author.first_name} ${metadata.author.last_name}`;
  if (metadata.owner) fieldMap.artifact_owner = metadata.owner.name;
  if (metadata.license) {
    const link = document.getElementById('artifactLicenseLink');
    link.href = metadata.license.link;
    link.textContent = `${metadata.license.license} (${metadata.license.acronym})`;
  }
}

export function createAccordionItem(data) {
  const hasUser = !!data.user;
  const fieldMap = {};
  fillArtifactFields(data.artifact, fieldMap, hasUser);
  fillMaterialTech(data.artifact_material_technique, hasUser);
  fillCronoFields(data.crono, fieldMap, hasUser);
  fillStoragePlaceFields(data.storage_place, fieldMap, hasUser);
  fillFindplaceFields(data.artifact_findplace, fieldMap, hasUser);
  fillMeasureFields(data.artifact_measure, fieldMap, hasUser);
  fillMetadataFields(data.artifact_metadata, fieldMap, hasUser);
  Object.entries(fieldMap).forEach(([key, value]) => {
    const el = document.getElementById(key);
    if (el) el.textContent = value ?? 'Not defined';
  });
}

async function loadAdminBoundaryLayer(data, mapElement) {
  let selectedBound = null;
  let selectedLevel = null;
  for (let i = 5; i >= 0; i--) {
    if (isValidValue(data.artifact_findplace[`bounds_${i}`])) {
      selectedBound = data.artifact_findplace[`bounds_${i}`];
      selectedLevel = i;
      break;
    }
  }
  if (!selectedBound || selectedLevel === null) return;
  try {
    const adminData = await fetchAdminBoundaries(selectedLevel, `g.gid_${selectedLevel} = '${selectedBound}'`, true);
    if (!adminData?.data?.items) return;
    const adminLayer = createGeoJsonLayer(adminData.data.items, {
      level: selectedLevel,
      style: { color: 'red', weight: 2, fillOpacity: 0.1 },
      simplify: false
    });
    if (adminLayer) {
      adminLayer.addTo(mapElement.map);
      mapElement.artifactAdminLayer = adminLayer;
    }
  } catch (error) {
    console.warn('Error loading admin boundary:', error);
  }
}

function addFindplaceMarker(data, mapElement) {
  const { latitude, longitude } = data.artifact_findplace;
  if (!isValidValue(latitude) || !isValidValue(longitude)) return;
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  if (isNaN(lat) || isNaN(lon)) return;
  const findplaceIcon = L.icon({
    iconUrl: 'img/ico/findPlace.png',
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
  L.marker([lat, lon], { icon: findplaceIcon }).addTo(mapElement.map);
}

let mapElement = null;
export async function artifactMap(data) {
  try {
    if (mapElement?.map) {
      try { mapElement.map.off(); mapElement.map.remove(); } catch (e) { console.warn('Error removing previous map:', e); }
      mapElement = null;
    }
    mapElement = await initMap('geographic');
    layerControl(mapElement, { baseLayers: true });
    document.getElementsByName('baseLayer').forEach(input => {
      input.addEventListener('change', (event) => toggleBaseLayer(event, mapElement));
    });

    await loadAdminBoundaryLayer(data, mapElement);
    addFindplaceMarker(data, mapElement);

    mapElement.map.whenReady(mapReady);
    const maxZoomBtn = document.getElementById('maxZoomBtn');
    if (maxZoomBtn) maxZoomBtn.addEventListener('click', maxZoomListener);

    return mapElement;
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

function mapReady(){
  setTimeout(() => {
    mapElement.map.invalidateSize();
    // Enhanced safety checks
    const hasLayers = Object.keys(mapElement.map._layers).length > 0;
    const hasValidBounds = mapElement.map.getBounds?.().isValid();
    const hasValidCenter = mapElement.map.getCenter?.() && !isNaN(mapElement.map.getCenter().lat) && !isNaN(mapElement.map.getCenter().lng);
  
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
}

function maxZoomListener(e){
  e.preventDefault();
  // Enhanced safety checks for button click
  const hasLayers = Object.keys(mapElement.map._layers).length > 0;
  const hasValidBounds = mapElement.map.getBounds?.().isValid();
  const hasValidCenter = mapElement.map.getCenter?.() && !isNaN(mapElement.map.getCenter().lat) && !isNaN(mapElement.map.getCenter().lng);
  
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
    if (!item?.path) return;
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
        confirmAction(deleteAlert, async () => {
          const res = await deleteMedia(item.file, item.path || null);
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
    if (item.path?.trim()) {
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
    if (item.url?.trim()) {
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
    if (item.text?.trim()) {
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
        confirmAction(deleteAlert, async () => {
          const res = await deleteMedia(item.id);
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
    if (!item?.url?.includes('youtube.com/watch?v=')) return;
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
        confirmAction(deleteAlert, async () => {
          const res = await deleteMedia(item.id);
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
      let data = google.visualization.arrayToDataTable(statData);
      let options = {
        title: type + ' Chronological distribution',
        curveType: 'function',
        legend: { position: 'bottom' },
        pointsVisible: true
      };
      let chart = new google.visualization.LineChart(document.getElementById('lineChart'));
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
      let data = google.visualization.arrayToDataTable(statData);
      let options = {
        title: 'Number of '+type + ' by Institution',
        legend: { position: 'none' },
      };
      let chart = new google.visualization.ColumnChart(document.getElementById('columnChart'));
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