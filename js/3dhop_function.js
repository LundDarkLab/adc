import { bsModal } from "./components/bsComponents.js";
import { viewsStorage } from "./modules/viewsStorage.js";
import { init3dhop } from "./components/viewer/initViewer.js";
import { initGrid } from "./components/viewer/grid.js";
import { initLightController } from "./components/viewer/light.js";
import { initAnnotations } from "./components/viewer/annotations.js";
import { initSection } from "./components/viewer/section.js";
import { measureTool } from "./helpers/viewerMeasure.js";

const activeUser = document.getElementById('userId')?.value || null;
const isLoggedUser = activeUser && activeUser !== 'unregistered' && !Number.isNaN(Number(activeUser));

const viewerEl = {
  canvas: document.getElementById('draw-canvas'),
  btGrid: document.getElementById('btGrid'),
}

let presenter, viewsManager, lightComponent, gridComponent, measure, section;
let modelId = null; 

// scene data
let sceneBB = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
let gStep, measure_unit;

let DEFAULT_VIEWER_STATE = {
  grid : 'gridBase',
  axes : false,
  navigation : "turntable",
  homeTrackState : [15,15,0,0,0,3],
  trackState : [15,15,0,0,0,3],
  fov : 40,
  ortho : false,
  texture : true,
  transparent : false,
  specular : false,
  lighting : true,
  lightDir : [-0.17, 0.17],
  activeMeasurement : null,
  clipping : [false, false, false],
  clippingDir : [1, 1, 1],
  clippingPoint : [0.5, 0.5, 0.5],
  clippingRender : [true, true],
};

let VIEWER_STATE = {};

let VIEWER_ANNOTATIONS = {
  type: "DC_SO_ANN",
  version: "2.0",
  object: null,
  user: activeUser,
  time: new Date().toISOString(),
  notes: {text:""},
  views: {},
  spots: {}
};

const toolBtnList = Array.prototype.slice.call(document.querySelectorAll('.toolBtn'))
const tooltipBtnList = toolBtnList.map(tooltipBtn => new bootstrap.Tooltip(tooltipBtn,{trigger:'hover', html: true, placement:'left' }))

/////////////////////////////////////////////////////////////
//////////////// FUNCTIONS //////////////////////////////////
/////////////////////////////////////////////////////////////


/**
 * Inizializza il modello 3DHOP: permessi, metadati, annotazioni, listener e viewer.
 * Può essere chiamata sia con il formato completo (backend) sia con solo l'array oggetti modello (upload).
 * @param {Object|Array} modelOrObject - Oggetto modello ricevuto dal backend o array di oggetti modello.
 */
async function initModel(modelOrObject, onReady) {
  let mainData, object, isUpload = false;
  if (Array.isArray(modelOrObject)) {
    // Chiamata da uploadNxz.js: solo array oggetti modello
    object = modelOrObject;
    mainData = {
      id: null,
      status_id: 2,
      // altri campi vuoti o di default se necessario
    };
    isUpload = true;
  } else {
    // Chiamata standard: oggetto completo dal backend
    mainData = modelOrObject.model;
    object = modelOrObject.model_object;
  }
  
  // Imposta modelId dalla risposta del backend
  modelId = mainData.id ?? null;
  VIEWER_ANNOTATIONS.object = modelId;

  measure_unit = object[0].measure_unit;

  if (!isUpload) {
    handleUserPermissions(mainData);
    renderModelMetadata(mainData);
    initObjectToggleToolbar(object);
    initObjectMetadata(object);
    await syncAnnotations(modelId);
  }
  initListeners();
  startupViewer(object, onReady);
}

/**
 * Gestisce i permessi utente e la visibilità dei bottoni/moduli.
 * @param {Object} mainData - Dati principali del modello.
 */
function handleUserPermissions(mainData) {
  const modelId = mainData.id;
  let statusAlert, statusBtnClass, statusBtnValue;
  if(mainData.status_id == 1){
    statusAlert = 'alert-danger';
    statusBtnClass = 'btn-success';
    statusBtnValue = 2;
  }else{
    statusAlert = 'alert-success';
    statusBtnClass = 'btn-warning';
    statusBtnValue = 1;
  }
  const modelStatus = document.querySelector("#model-status");
  modelStatus.classList.add(statusAlert);
  if(isLoggedUser){
    const btn = document.getElementById('modelVisibility');
    btn.classList.add(statusBtnClass);
    btn.value = statusBtnValue;
    btn.addEventListener('click', () => changeModelStatus(modelId));
  }else{
    document.querySelector("#toolBarModel")?.remove();
    const btSaveModelParam = document.getElementsByName('saveModelParam')[0];
    if(btSaveModelParam) btSaveModelParam.remove();
  }
}

/**
 * Popola la UI con i metadati del modello.
 * @param {Object} mainData - Dati principali del modello.
 */
function renderModelMetadata(mainData) {
  console.log(mainData);
  
  const isEmpty = (value) => value === null || value === undefined || value === '';
  Object.keys(mainData).forEach(key => {    
    if(!isEmpty(mainData[key])) {
      if(key == 'doi' && mainData.doi){
        const doi = document.querySelector("#model-doi");
        if(doi){
          doi.setAttribute('href', mainData.doi);
        }
        const btn = document.createElement('a');
        btn.className = 'btn btn-light';
        btn.href = mainData.doi;
        btn.target = '_blank';
        btn.title = 'view on Zenodo';
        btn.textContent = ' DOI';
        document.querySelector('#itemTool>.btn-group').appendChild(btn);
      }else{
        const el = document.querySelector("#model-"+key);
        if(el) {el.textContent = mainData[key];}
      }
    }
    else if(!isLoggedUser){
      if(key == 'doi'){ document.querySelector("#doiItem")?.remove(); }
      document.querySelector(`#model-${key}`)?.parentElement?.remove();
    }
  });
}

function initObjectToggleToolbar(data){
  if(data.length <= 1){ return; }
  const toolbar = document.getElementById('object-control');
  toolbar.classList.remove('d-none');
  const fragment = document.createDocumentFragment();
  data.forEach((obj, index) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline-secondary active';
    btn.type = 'button';
    btn.setAttribute('aria-label', `Object ${index}`);

    const img = document.createElement('img');
    const thumbUrl = obj.thumbnail ? `/archive/thumb/${obj.thumbnail}` : 'https://via.placeholder.com/150?text=No+Thumbnail';
    img.src = thumbUrl;
    img.alt = '';

    btn.appendChild(img);
    btn.addEventListener('click', () => toggleObject(obj,btn));

    fragment.appendChild(btn);
  });
  
  toolbar.innerHTML = '';
  toolbar.appendChild(fragment);
}

function toggleObject(obj, btn){  
  const instanceName = 'mesh_' + obj.id;
  const isHidden = btn.classList.contains('hidden');
  presenter.setInstanceVisibilityByName(instanceName, isHidden, isHidden);
  btn.classList.toggle('hidden');
}

function initObjectMetadata(data){
  const thumbList = document.getElementById('thumbList');
  data.forEach((obj, index) => {
    const thumbUrl = obj.thumbnail ? `/archive/thumb/${obj.thumbnail}` : 'https://via.placeholder.com/150?text=No+Thumbnail';
    const img = document.createElement('img');
    img.src = thumbUrl;
    img.alt = `Object ${index}`;
    img.classList.add('img-thumbnail', 'm-2');
    img.style.width = '150px';
    img.style.height = '150px';
    img.style.objectFit = 'cover';
    img.addEventListener('click', () => showObjectMetadata(obj));
    thumbList.appendChild(img);
  });
}

function showObjectMetadata(data){
  const fieldsList = new Set(['id', 'thumbnail', 'author', 'owner', 'license', 'license_acronym', 'license_link', 'description', 'note', 'acquisition_method', 'software', 'points', 'polygons', 'textures', 'scans', 'pictures', 'encumbrance', 'measure_unit']);

  const thumbRow = `
  <tr>
    <td colspan="2" style="padding:0">
      <img 
        src="${data.thumbnail ? `/archive/thumb/${data.thumbnail}` : 'https://via.placeholder.com/150?text=No+Thumbnail'}" 
        alt="Thumbnail" 
        class="img-thumbnail" 
        style="width:100%; height:200px; object-fit:cover; display:block;">
    </td>
  </tr>
`;

  const rows = Object.entries(data)
    .filter(([key]) => fieldsList.has(key))
    .reduce((acc, [key, value]) => {
      if (['license_acronym', 'license_link', 'thumbnail'].includes(key)) return acc; // skip, già gestiti
      if (key === 'license') {
        const link = data.license_link
          ? `<a href="${data.license_link}" target="_blank">${value} (${data.license_acronym ?? ''})</a>`
          : `${value} (${data.license_acronym ?? 'N/A'})`;
        acc.push(['license', link]);
      } else {
        acc.push([key, value]);
      }
      return acc;
    }, [])
    .map(([key, value]) => `
      <tr>
        <th scope="row" class="text-capitalize">${key.replaceAll('_', ' ')}</th>
        <td>${value ?? 'N/A'}</td>
      </tr>`)
    .join('');

  const body = `
    <table class="table table-sm table-striped">
      <tbody>
        ${thumbRow}
        ${rows}
      </tbody>
    </table>`;

  bsModal({
    title: 'Object details',
    body: body,
    size: 'modal-lg',
    buttons: [
      { text: 'Close', class: 'btn-secondary', action: 'close' },
      { text: 'View in archive', class: 'btn-primary', action: () => window.open(`model_edit.php?id=${data.id}`) }
    ]
  });
}

/**
 * Sincronizza le annotazioni tra localStorage e viewsManager.
 * @param {string|number} modelId - ID del modello.
 */
async function syncAnnotations(modelId) {
  viewsManager = await viewsStorage();
  const savedAnnotations = viewsManager.getAnnotations(modelId);
  if (savedAnnotations) {
    VIEWER_ANNOTATIONS = savedAnnotations;
  }
}

function initListeners() {
  const wrapAnnotations = document.getElementById('wrapAnnotations');
  const paradataModal = document.getElementById('paradata-modal');
  const btHome = document.getElementById('btHome');
  if(btHome) btHome.addEventListener('click', () => setViewerState(null));

  const btScreenshot = document.getElementsByClassName('btScreenshot');
  [...btScreenshot].forEach(btn => {
    btn.addEventListener('click', () => {
      screenshot();
    })
  });
  
  const btTogglePanel = document.getElementsByClassName('toggleAnnotations');
  [...btTogglePanel].forEach(btn => {
    btn.addEventListener('click', () => {
        if(wrapAnnotations) {
          wrapAnnotations.classList.toggle('d-none');
          if(!wrapAnnotations.classList.contains('d-none') && paradataModal) {
            paradataModal.classList.add('d-none');
          }
        }
      });
    });

  const btParadataToggle = document.getElementsByClassName('btParadataToggle');
  [...btParadataToggle].forEach(btn => {
    btn.addEventListener('click', async () => {
      if(paradataModal){
        paradataModal.classList.toggle('d-none');
        if(!paradataModal.classList.contains('d-none') && wrapAnnotations) {
          wrapAnnotations.classList.add('d-none');
        }
      }
    });
  });

  const btTexture = document.getElementById('btTexture');
  if(btTexture) btTexture.addEventListener('click', () => setTexture());
  
  const btTransparency = document.getElementById('btTransparency');
  if(btTransparency) btTransparency.addEventListener('click', () => setTransparency());
  
  const btSpecular = document.getElementById('btSpecular');
  if(btSpecular) btSpecular.addEventListener('click', () => setSpecular());
  
  if(viewerEl.btGrid) viewerEl.btGrid.addEventListener('click', () => gridComponent.setGrid(viewerEl.btGrid));
  
  const btAxes = document.getElementById('btAxes');
  if(btAxes) btAxes.addEventListener('click', () => setAxes());

  const btView = document.getElementsByClassName('btView');
  [...btView].forEach(btn => {
    btn.addEventListener('click', function() { viewFrom(this.value); });
  });

  const btOrtho = document.getElementById('btOrtho');
  if (btOrtho) btOrtho.addEventListener('click', () => setOrtho());
}


/**
 * Inizializza il viewer 3DHOP e chiama la callback quando la scena è pronta.
 * @param {Array} object - Array di oggetti modello.
 * @param {Function} [onReady] - Callback opzionale da chiamare quando la scena è pronta.
 */
function startupViewer(object, onReady) {
  presenter = new Presenter("draw-canvas");
  init3dhop(isLoggedUser);
  const myScene = createViewerScene(object);
  presenter.setScene(myScene);
    
  setupViewerState();
  setupViewerComponents();
  applyInitialViewerState();

  // Attendi che la scena sia pronta
  if (typeof onReady === "function") {
    waitForSceneReady(presenter, onReady);
  }
}

/**
 * Polling per sapere quando la scena è pronta.
 * @param {Presenter} presenter - L'istanza del presenter.
 * @param {Function} callback - Funzione da chiamare quando la scena è pronta.
 */
function waitForSceneReady(presenter, callback) {
  const check = () => {
    if (presenter._isSceneReady?.()) {
      callback();
    } else {
      setTimeout(check, 50);
    }
  };
  check();
}

/**
 * Crea la scena 3DHOP con meshes, istanze e configurazione trackball.
 * @param {Array} object - Array di oggetti modello.
 * @returns {Object} - Oggetto scena per 3DHOP.
 */
function createViewerScene(object) {
  const meshes = {
    "sphere": { url: "archive/models/sphere.ply" },
    "cube": { url: "archive/models/cube.ply" }
  };
  const modelInstances = {};
  object.forEach((element) => {
    meshes['mesh_' + element.id] = { url: 'archive/models/' + element.object };
    modelInstances['mesh_' + element.id] = {
      mesh: 'mesh_' + element.id,
      tags: ['Group'],
      color: [0.5, 0.5, 0.5],
      backfaceColor: [0.5, 0.5, 0.5, 3],
      specularColor: [0, 0, 0, 256]
    };
  });
  let clippingBorderSize = 0.1;
  if (measure_unit === "mm") clippingBorderSize = 0.5;
  if (measure_unit === "m") clippingBorderSize = 0.0005;

  const trackball = getTrackballConfig();

  return {
    meshes,
    modelInstances,
    spots: {},
    trackball,
    space: {
      centerMode: "scene",
      radiusMode: "scene",
      cameraNearFar: [0.01, 10],
      cameraFOV: DEFAULT_VIEWER_STATE.fov,
    },
    config: {
      pickedpointColor: [1, 0, 1],
      measurementColor: [0.5, 1, 0.5],
      showClippingPlanes: true,
      showClippingBorder: true,
      clippingBorderSize,
      clippingBorderColor: [0, 1, 1]
    }
  };
}

/**
 * Restituisce la configurazione della trackball in base allo stato di navigazione.
 * @returns {Object} - Configurazione trackball.
 */
function getTrackballConfig() {
  if (DEFAULT_VIEWER_STATE.navigation === "turntable") {
    return {
      type: TurntablePanTrackball,
      trackOptions: {
        startPhi: DEFAULT_VIEWER_STATE.trackState[0],
        startTheta: DEFAULT_VIEWER_STATE.trackState[1],
        startPanX: DEFAULT_VIEWER_STATE.trackState[2],
        startPanY: DEFAULT_VIEWER_STATE.trackState[3],
        startPanZ: DEFAULT_VIEWER_STATE.trackState[4],
        startDistance: DEFAULT_VIEWER_STATE.trackState[5],
        minMaxPhi: [-180, 180],
        minMaxTheta: [-90, 90],
        minMaxDist: [0.1, 5]
      }
    };
  } else if (DEFAULT_VIEWER_STATE.navigation === "sphere") {
    return {
      type: SphereTrackball,
      trackOptions: {
        startMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        startPanX: 0,
        startPanY: 0,
        startPanZ: 0,
        startDistance: 2,
        minMaxDist: [0.2, 4],
      }
    };
  }
  return {};
}

/**
 * Imposta lo stato iniziale del viewer e aggiorna variabili globali.
 */
function setupViewerState() {
  DEFAULT_VIEWER_STATE.homeTrackState = presenter.getTrackballPosition();
  DEFAULT_VIEWER_STATE.trackState = DEFAULT_VIEWER_STATE.homeTrackState.slice();
  presenter._onEndMeasurement = onEndMeasure;
  presenter.setClippingPointXYZ(0.5, 0.5, 0.5);

  switch (measure_unit) {
    case 'mm': gStep = 10; break;
    case 'm': gStep = 0.01; break;
    default: gStep = 1; break;
  }

  VIEWER_STATE = structuredClone(DEFAULT_VIEWER_STATE);
  VIEWER_STATE.trackState = VIEWER_STATE.homeTrackState.slice();
}

/**
 * Inizializza i componenti viewer: luce, griglia, misure, annotazioni, sezioni.
 */
function setupViewerComponents() {
  lightComponent = initLightController(presenter, VIEWER_STATE);
  gridComponent = initGrid(presenter, sceneBB, gStep, VIEWER_STATE, measure_unit);
  measure = measureTool(presenter, VIEWER_STATE, viewerEl, measure_unit);
  presenter._onEndPickingPoint = measure.onEndPick;
  const viewerContext = {
      presenter,
      viewerState: VIEWER_STATE,
      viewerEl,
      measureTool: measure,
      setViewerState
    };
  const annotationsContext = {
      viewerAnnotations: VIEWER_ANNOTATIONS,
      modelId,
      measure_unit,
      storeAnnotations
    }

  initAnnotations(viewerContext, annotationsContext);
  section = initSection(presenter, VIEWER_STATE, DEFAULT_VIEWER_STATE);
}

/**
 * Applica lo stato iniziale al viewer e aggiorna UI e rendering.
 */
function applyInitialViewerState() {
  gridComponent.startupGrid(VIEWER_STATE.grid);
  lightComponent.setLighting(VIEWER_STATE.lighting, VIEWER_STATE.lightDir);
  presenter.animateToTrackballPosition(VIEWER_STATE.trackState);
  setAxes(VIEWER_STATE.axes);
  setTexture(VIEWER_STATE.texture);
  setTransparency(VIEWER_STATE.transparent);
  setSpecular(VIEWER_STATE.specular);
  setOrtho(VIEWER_STATE.ortho);

  presenter._onTrackballUpdate = onTrackballUpdate;
  presenter.ui._onCanvasScroll = event => event.preventDefault();
}

function changeModelStatus(modelId) {
  const status = document.querySelector("button[name=modelVisibility").value;
  const dati = {trigger:'changeModelStatus', dati:{id:modelId, status:status}};
  fetch(API+"model.php", {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams(dati)
  })
  .then(res => res.json())
  .then(data => {
    if (data.res==1) {
      document.querySelector("#toastDivError .errorOutput").textContent = data.msg;
      document.querySelector("#toastDivError").classList.remove("d-none");
    }else {
      document.querySelector(".toastTitle").textContent = data.msg;
      document.querySelector("#toastDivSuccess").classList.remove("d-none");
      setTimeout(() => location.reload(), 3000);
    }
    document.querySelector("#toastDivContent").classList.remove('d-none');
  });
}

////// VIEWERSTATE MANAGEMENT //////////////////////////////////////

function defaultViewerState() {
  Object.keys(DEFAULT_VIEWER_STATE).forEach(key => {
    if (Array.isArray(DEFAULT_VIEWER_STATE[key])) {
      VIEWER_STATE[key] = DEFAULT_VIEWER_STATE[key].slice();
    } else {
      VIEWER_STATE[key] = DEFAULT_VIEWER_STATE[key];
    }
  });
  VIEWER_STATE.trackState = VIEWER_STATE.homeTrackState.slice();

  if (gridComponent) {gridComponent.setGrid(viewerEl.btGrid, VIEWER_STATE.grid);}
  if (lightComponent) {lightComponent.setLighting(VIEWER_STATE.lighting, VIEWER_STATE.lightDir);}
  if (presenter) {
    presenter.animateToTrackballPosition(VIEWER_STATE.trackState);
    setAxes(VIEWER_STATE.axes);
    setTexture(VIEWER_STATE.texture);
    setTransparency(VIEWER_STATE.transparent);
    setSpecular(VIEWER_STATE.specular);
    setOrtho(VIEWER_STATE.ortho);
  }
}

function setViewerState(viewerState) {
  if(!viewerState){
    defaultViewerState();
    return;
  }
  
  Object.keys(viewerState).forEach(key => {
    if (Array.isArray(viewerState[key])) {
      VIEWER_STATE[key] = viewerState[key].slice();
    } else {
      VIEWER_STATE[key] = viewerState[key];
    }
  });
  gridComponent.setGrid(viewerEl.btGrid, VIEWER_STATE.grid);
  presenter.animateToTrackballPosition(VIEWER_STATE.trackState);
  setAxes(VIEWER_STATE.axes);
  lightComponent.setLighting(VIEWER_STATE.lighting, VIEWER_STATE.lightDir);
  setTexture(VIEWER_STATE.texture);
  setTransparency(VIEWER_STATE.transparent);
  setSpecular(VIEWER_STATE.specular);
  setOrtho(VIEWER_STATE.ortho);
  if (section?.setSections) {
    const hasActiveSections = VIEWER_STATE.clipping && (VIEWER_STATE.clipping[0] || VIEWER_STATE.clipping[1] || VIEWER_STATE.clipping[2]);
    
    if (hasActiveSections) {
      const sectionsBox = document.getElementById('sections-box');
      if (sectionsBox?.classList.contains('d-none')) {
        sectionsBox.classList.remove('d-none');
      }
      
      const btSection = document.getElementById('btSection');
      if (btSection && !btSection.checked) {
        btSection.checked = true;
      }
    }
    
    section.setSections();
  }

  if(VIEWER_STATE.activeMeasurement){
    switch(VIEWER_STATE.activeMeasurement.type){
      case "distance":
        break;
      case "pick":
        break;
      case "angle":
        break;
    }
  }
}
///////////////// SET VIEWERSTATUS VALUE AND APPLY CHANGES //////////////////////

function setTexture(value) {
  if(value === undefined) value = !VIEWER_STATE.texture;
  VIEWER_STATE.texture = value;
  
  presenter.setInstanceSolidColor('Group', !value, true);
  
  const btn = document.getElementById('btTexture');
  if(btn){
    btn.classList.remove("btn-outline-secondary", "btn-adc-blue");
    btn.classList.add(value ? "btn-adc-blue" : "btn-outline-secondary");
  }
}

function setTransparency(value){
  if(value === undefined) value = !VIEWER_STATE.transparent;
  VIEWER_STATE.transparent = value;
  
  presenter.setInstanceTransparency('Group', value, true);
  
  const btn = document.getElementById('btTransparency');
  if(btn){
    btn.classList.remove("btn-outline-secondary", "btn-adc-blue");
    btn.classList.add(value ? "btn-adc-blue" : "btn-outline-secondary");
  }
}

function setSpecular(value){
  if(value === undefined) value = !VIEWER_STATE.specular;
  VIEWER_STATE.specular = value;
  
  const spec = value ? [0.3, 0.3, 0.3, 256] : [0, 0, 0, 256];
  for(let inst in presenter._scene.modelInstances){
    presenter._scene.modelInstances[inst].specularColor = spec;
  }
  presenter.repaint();
  
  const btn = document.getElementById('btSpecular');
  if(btn){
    btn.classList.remove("btn-outline-secondary", "btn-adc-blue");
    btn.classList.add(value ? "btn-adc-blue" : "btn-outline-secondary");
  }
}

function setOrtho(value){
  if(value === undefined) value = !VIEWER_STATE.ortho;
  VIEWER_STATE.ortho = value;
  
  if(value) {
    presenter.setCameraOrthographic();
  } else {
    presenter.setCameraPerspective();
  }
  
  const btn = document.getElementById('btOrtho');
  if(btn){
    btn.classList.remove("btn-outline-secondary", "btn-adc-blue");
    btn.classList.add(value ? "btn-adc-blue" : "btn-outline-secondary");
  }
}

function setAxes(value){
  if(value === undefined) value = !VIEWER_STATE.axes;
  VIEWER_STATE.axes = value;
  
  if(value) addAxes();
  else removeAxes();
  
  const btn = document.getElementById('btAxes');
  if(btn){
    btn.classList.remove("btn-outline-secondary", "btn-adc-blue");
    btn.classList.add(value ? "btn-adc-blue" : "btn-outline-secondary");
  }
}

//////////////////////////////// STORAGE //////////////////////////////////////

function storeAnnotations() {
  VIEWER_ANNOTATIONS.time = new Date().toISOString();
  storeViewsData();
}

async function storeViewsData() {
  const viewsManager = await viewsStorage();
  viewsManager.setAnnotations(modelId, VIEWER_ANNOTATIONS);
}

export let thumbnailBlob = null;
function screenshot(callback) {
  presenter.saveScreenshot();
  // Attendi che il dataURL venga generato (dopo il repaint)
  setTimeout(async () => {
    const dataUrl = presenter.screenshotData;
    if (dataUrl) {
      // Mostra la preview
      const thumbPreview = document.getElementById('thumbPreview');
      thumbPreview.innerHTML = `<img src="${dataUrl}" class="img-fluid rounded"/>`;
      // Converte il dataURL in Blob per il FormData
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      thumbnailBlob = blob;
      if (typeof callback === 'function') callback(blob);
    }
  }, 200); // 200ms di delay per sicurezza
}

function viewFrom(direction) {
  const distance = DEFAULT_VIEWER_STATE.homeTrackState[5];
  switch(direction) {
    case "default":
      presenter.animateToTrackballPosition(DEFAULT_VIEWER_STATE.homeTrackState);
      break;
    case "front":
      presenter.animateToTrackballPosition([0, 0, 0, 0, 0, distance]);
      break;
    case "back":
      presenter.animateToTrackballPosition([180, 0, 0, 0, 0, distance]);
      break;			
    case "top":
      presenter.animateToTrackballPosition([0, 90, 0, 0, 0, distance]);
      break;
    case "bottom":
      presenter.animateToTrackballPosition([0, -90, 0, 0, 0, distance]);
      break;
    case "left":
      presenter.animateToTrackballPosition([270, 0, 0, 0, 0, distance]);
      break;
    case "right":
      presenter.animateToTrackballPosition([90, 0, 0, 0, 0, distance]);
      break;			
  }
};

function addAxes() {
  const rad = (1 / presenter.sceneRadiusInv)/2;
  let linesBuffer, point, tpoint;
  
  // X axis (red)
  point = [rad, 0, 0, 1]
  tpoint = SglMat4.mul4(presenter._scene.modelInstances["mesh_0"].transform.matrix, point);
  linesBuffer = [[0, 0, 0],[tpoint[0], tpoint[1], tpoint[2]]];
  const axisX = presenter.createEntity("XXaxis", "lines", linesBuffer);
  axisX.color = [1, 0.2, 0.2, 1];
  axisX.zOff = 0;
  
  // Y axis (green)
  point = [0, rad, 0, 1]
  tpoint = SglMat4.mul4(presenter._scene.modelInstances["mesh_0"].transform.matrix, point);
  linesBuffer = [[0, 0, 0],[tpoint[0], tpoint[1], tpoint[2]]];
  const axisY = presenter.createEntity("YYaxis", "lines", linesBuffer);
  axisY.color = [0.2, 1, 0.2, 1];
  axisY.zOff = 0;

  // Z axis (blue)
  point = [0, 0, rad, 1]
  tpoint = SglMat4.mul4(presenter._scene.modelInstances["mesh_0"].transform.matrix, point);	
  linesBuffer = [[0, 0, 0],[tpoint[0], tpoint[1], tpoint[2]]];
  const axisZ = presenter.createEntity("ZZaxis", "lines", linesBuffer);
  axisZ.color = [0.2, 0.2, 1, 1];
  axisZ.zOff = 0;	
  
  presenter.repaint();
}

function removeAxes() {
  presenter.deleteEntity("XXaxis");
  presenter.deleteEntity("YYaxis");
  presenter.deleteEntity("ZZaxis");
}

function onTrackballUpdate(trackState) {
  VIEWER_STATE.trackState = trackState;
  updateGrid(trackState);	
}

function updateGrid(trackState) {
  if (presenter._scene.entities === undefined) return;
  if (presenter._scene.entities["gridBB"] === undefined) return;
  const tt=[0,0,0];
  tt[0] = (trackState[2] / presenter.sceneRadiusInv) + presenter.sceneCenter[0];
  tt[1] = (trackState[3] / presenter.sceneRadiusInv) + presenter.sceneCenter[1];
  tt[2] = (trackState[4] / presenter.sceneRadiusInv) + presenter.sceneCenter[2];
  const mrX = SglMat4.rotationAngleAxis(sglDegToRad(-trackState[1]), [1, 0, 0]);
  const mrY = SglMat4.rotationAngleAxis(sglDegToRad(trackState[0]), [0, 1, 0]);
  const mrT = SglMat4.translation(tt);
  const matrix = SglMat4.mul(SglMat4.mul(mrT, mrY), mrX);
  presenter._scene.entities["gridBB"].transform.matrix = matrix;
}

function onEndMeasure(measure, p0, p1) {
  const clampTo = (measure_unit == "m")? 3 : 2;
  document.querySelector('#measure-output').innerHTML = measure.toFixed(clampTo) + measure_unit;
  VIEWER_STATE.activeMeasurement = {
    type: "distance",
    value: measure,
    p0: p0.slice(),
    p1: p1.slice()
  };
}


function resizeCanvas() {
  if(!presenter) return;
  if(!presenter._resizable) return;

  requestAnimationFrame(() => {
    const mainContent = document.getElementById('mainContent');
    const hopEl = document.getElementById('3dhop');
    const canvas = viewerEl.canvas;
    
    // Calcola la larghezza disponibile considerando il gap del grid (10px)
    const availableWidth = mainContent.offsetWidth - 10;
    const height = hopEl.offsetHeight;

    let width;
    if (mainContent.classList.contains('expanded')) {
      width = availableWidth;
    } else {
      width = (availableWidth / 3) * 2;
    }
    
    hopEl.style.width = width + 'px';
    hopEl.style.height = height + 'px';
    
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);

    presenter.ui.postDrawEvent();
  });
}

export { presenter, initModel, resizeCanvas };