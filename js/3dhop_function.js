import { DEFAULT_VIEWER_STATE, VIEWER_ANNOTATIONS, GRID_STEP, CLIPPING_BORDER_FACTOR } from "./components/viewer/viewerConfig.js";
import { bsAlert } from "./components/bsComponents.js";
import { createViewerScene, waitForSceneReady, getFirstMeshKey, viewFrom} from "./components/viewer/viewerScene.js";
import { viewsStorage } from "./modules/viewsStorage.js";
import { init3dhop, resizeCanvasNew  as _resizeCanvas  } from "./components/viewer/initViewer.js";
import { initGrid } from "./components/viewer/viewerGrid.js";
import { initLightController } from "./components/viewer/viewerLight.js";
import { initAnnotations } from "./components/viewer/viewerAnnotations.js";
import { initSection } from "./components/viewer/viewerSection.js";
import { measureTool } from "./components/viewer/viewerMeasure.js";
import { handleUserPermissions, renderModelMetadata, initObjectToggleToolbar, initObjectMetadata } from "./components/viewer/viewerUi.js";

let VIEWER_STATE = {};
const activeUser = document.getElementById('userId')?.value || null;
VIEWER_ANNOTATIONS.user = activeUser;
const isLoggedUser = activeUser && activeUser !== 'unregistered' && !Number.isNaN(Number(activeUser));

const viewerEl = {
  canvas: document.getElementById('draw-canvas'),
  btGrid: document.getElementById('btGrid'),
}

let presenter, viewsManager, lightComponent, gridComponent, measure, section;
let modelId = null; 
let sceneBB = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
let gStep, measure_unit;

const toolBtnList = Array.prototype.slice.call(document.querySelectorAll('.toolBtn'))
toolBtnList.map(tooltipBtn => new bootstrap.Tooltip(tooltipBtn,{trigger:'hover', html: true, placement:'left' }))

/**
 * Inizializza il modello 3DHOP: permessi, metadati, annotazioni, listener e viewer.
 * Può essere chiamata sia con il formato completo (backend) sia con solo l'array oggetti modello (upload).
 * @param {Object|Array} modelOrObject - Oggetto modello ricevuto dal backend o array di oggetti modello.
 */
async function initModel(modelOrObject, onReady) {
  if(window.pageType==='artifact_view'){
    const addModelBtn = document.getElementById('addModelBtn');
    if(addModelBtn){
      addModelBtn.remove();
    }
  }
  
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
    handleUserPermissions(isLoggedUser, mainData);
    renderModelMetadata(isLoggedUser,mainData);
    initObjectToggleToolbar(object);
    initObjectMetadata(modelId, object, isLoggedUser);
    await syncAnnotations(modelId);
  }
  initListeners();
  startupViewer(object, onReady);
}


function toggleViewerState(key, applyFn, btnId, value) {
  if (value === undefined) value = !VIEWER_STATE[key];
  VIEWER_STATE[key] = value;
  applyFn(value);
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.toggle('btn-adc-blue', value);
    btn.classList.toggle('btn-outline-secondary', !value);
  }
}

const setTexture = (v) => toggleViewerState('texture', (v) => presenter.setInstanceSolidColor('Group', !v, true), 'btTexture', v);
const setTransparency = (v) => toggleViewerState('transparent', (v) => presenter.setInstanceTransparency('Group', v, true), 'btTransparency', v);
const setOrtho = (v) => toggleViewerState('ortho', (v) => v ? presenter.setCameraOrthographic() : presenter.setCameraPerspective(), 'btOrtho', v);
const setAxes = (v) => toggleViewerState('axes', (v) => v ? addAxes() : removeAxes(), 'btAxes', v);
function addAxes() {
  const rad = (1 / presenter.sceneRadiusInv)/2;
  let linesBuffer, point, tpoint;

  const meshKey = getFirstMeshKey(presenter);
  
  // X axis (red)
  point = [rad, 0, 0, 1]
  tpoint = SglMat4.mul4(presenter._scene.modelInstances[meshKey].transform.matrix, point);
  linesBuffer = [[0, 0, 0],[tpoint[0], tpoint[1], tpoint[2]]];
  const axisX = presenter.createEntity("XXaxis", "lines", linesBuffer);
  axisX.color = [1, 0.2, 0.2, 1];
  axisX.zOff = 0;
  
  // Y axis (green)
  point = [0, rad, 0, 1]
  tpoint = SglMat4.mul4(presenter._scene.modelInstances[meshKey].transform.matrix, point);
  linesBuffer = [[0, 0, 0],[tpoint[0], tpoint[1], tpoint[2]]];
  const axisY = presenter.createEntity("YYaxis", "lines", linesBuffer);
  axisY.color = [0.2, 1, 0.2, 1];
  axisY.zOff = 0;

  // Z axis (blue)
  point = [0, 0, rad, 1]
  tpoint = SglMat4.mul4(presenter._scene.modelInstances[meshKey].transform.matrix, point);	
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

const setSpecular = (value) => {
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

/**
 * Sincronizza le annotazioni tra localStorage e viewsManager.
 * @param {string|number} modelId - ID del modello.
 */
async function syncAnnotations(modelId) {
  try {
    viewsManager = await viewsStorage();
    const savedAnnotations = viewsManager.getAnnotations(modelId);
    if (savedAnnotations) {
      Object.assign(VIEWER_ANNOTATIONS, structuredClone(savedAnnotations));
    }
  } catch (error) {
    console.error('Failed to sync annotations:', error);
  }
}

function initListeners() {
  const wrapAnnotations = document.getElementById('wrapAnnotations');
  const paradataModal = document.getElementById('paradata-modal');

  const togglePanels = (show, hide) => {
    if (!show) return;
    show.classList.toggle('d-none');
    if (!show.classList.contains('d-none') && hide) {
      hide.classList.add('d-none');
    }
  };

  document.getElementById('btHome')?.addEventListener('click', () => setViewerState(null));
  document.getElementById('btTexture')?.addEventListener('click', () => setTexture());
  document.getElementById('btTransparency')?.addEventListener('click', () => setTransparency());
  document.getElementById('btSpecular')?.addEventListener('click', () => setSpecular());
  document.getElementById('btAxes')?.addEventListener('click', () => setAxes());
  document.getElementById('btOrtho')?.addEventListener('click', () => setOrtho());
  viewerEl.btGrid?.addEventListener('click', () => gridComponent.setGrid(viewerEl.btGrid));

  [...document.getElementsByClassName('btScreenshot')].forEach(btn => btn.addEventListener('click', () => screenshot()));
  [...document.getElementsByClassName('toggleAnnotations')].forEach(btn => btn.addEventListener('click', () => togglePanels(wrapAnnotations, paradataModal)));
  [...document.getElementsByClassName('btParadataToggle')].forEach(btn => btn.addEventListener('click', () => togglePanels(paradataModal, wrapAnnotations)));
  [...document.getElementsByClassName('btView')].forEach(btn => btn.addEventListener('click', function() { viewFrom(presenter, this.value); }));
}


/**
 * Inizializza il viewer 3DHOP e chiama la callback quando la scena è pronta.
 * @param {Array} object - Array di oggetti modello.
 * @param {Function} [onReady] - Callback opzionale da chiamare quando la scena è pronta.
 */

function startupViewer(object, onReady) {
  presenter = new Presenter("draw-canvas");
  // La libreria 3DHOP (es. trackball.recenter) si aspetta `presenter` come variabile
  // globale: nel refactor a moduli ES non lo è, quindi lo esponiamo esplicitamente.
  window.presenter = presenter;
  window._presenter = presenter; // debug: accessible from browser console
  init3dhop(isLoggedUser);
  
  // ResizeObserver on #model: fires when the container actually changes size,
  // regardless of the cause (orientation, btWidescreen, window resize).
  // This removes all timing guesswork for resizeCanvas().
  const containerEl = document.getElementById('model') ?? document.getElementById('mainContent');
  if (containerEl) {
    new ResizeObserver(() => resizeCanvas()).observe(containerEl);
  }

  presenter.setScene(createViewerScene(object, measure_unit));
  setupViewerState();

  waitForSceneReady(presenter, () => {
    setupViewerComponents();
    applyInitialViewerState();
    if (typeof onReady === "function") onReady();
  });
}


/**
 * Imposta lo stato iniziale del viewer e aggiorna variabili globali.
 */
function setupViewerState() {
  DEFAULT_VIEWER_STATE.homeTrackState = presenter.getTrackballPosition();
  DEFAULT_VIEWER_STATE.trackState = DEFAULT_VIEWER_STATE.homeTrackState.slice();
  presenter.setClippingPointXYZ(0.5, 0.5, 0.5);
  gStep = GRID_STEP[measure_unit] ?? GRID_STEP.cm;
  Object.assign(VIEWER_STATE, structuredClone(DEFAULT_VIEWER_STATE)); 
  VIEWER_STATE.trackState = VIEWER_STATE.homeTrackState.slice();
}

/**
 * Inizializza i componenti viewer: luce, griglia, misure, annotazioni, sezioni.
*/
function setupViewerComponents() {
  // Spessore del bordo del piano di taglio relativo al raggio reale della scena
  // (la scena qui è già pronta, quindi sceneRadiusInv è disponibile).
  presenter._scene.config.clippingBorderSize = (1 / presenter.sceneRadiusInv) * CLIPPING_BORDER_FACTOR;

  lightComponent = initLightController(presenter, VIEWER_STATE);
  gridComponent = initGrid(presenter, sceneBB, gStep, VIEWER_STATE, measure_unit);
  measure = measureTool(presenter, VIEWER_STATE, viewerEl, measure_unit);
  presenter._onEndMeasurement = measure.onEndMeasure;
  presenter._onEndPickingPoint = measure.onEndPick;
  const viewerContext = {
      presenter,
      viewerState: VIEWER_STATE,
      viewerEl,
      measureTool: measure,
      firstMesh: getFirstMeshKey(presenter),
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

  // La libreria 3DHOP (trackball_*.js) chiama una funzione GLOBALE `onTrackballUpdate`
  // a ogni movimento della trackball: `if(typeof onTrackballUpdate != "undefined") onTrackballUpdate(...)`.
  // Dopo il refactor a moduli ES la funzione è module-scoped, quindi la libreria la vedeva
  // come "undefined" e non la chiamava mai → updateGrid() non girava → la griglia gridBB
  // restava all'origine invece di seguire sceneCenter (shift visibile sui modelli RealityCapture
  // con coordinate lontane dall'origine). Va esposta su window, non come export del modulo.
  window.onTrackballUpdate = onTrackballUpdate;
  presenter.ui._onCanvasScroll = event => event.preventDefault();

  // Doppio click per ricentrare la vista sul punto cliccato.
  // Il recenter nativo di 3DHOP è dentro onClick con una finestra di soli 250ms
  // tra due click: con la velocità di doppio-click di sistema (~500ms) non scatta
  // quasi mai. Lo agganciamo all'evento nativo dblclick (inoltrato come
  // onDoubleClick dalla UI di SpiderGL), che rispetta il timing del sistema.
  presenter.onDoubleClick = function (button, x, y, e) {
    if (!this.trackball.recenter) return;
    this._pickingRefresh(x, y);
    const ppoint = this._drawScenePickingXYZ();
    if (ppoint != null) {
      this.ui.animateRate = 30;
      this.trackball.recenter(ppoint);
      this.repaint();
    }
  };
}

////// VIEWERSTATE MANAGEMENT //////////////////////////////////////
function applyViewerState() {
  gridComponent.setGrid(viewerEl.btGrid, VIEWER_STATE.grid);
  lightComponent.setLighting(VIEWER_STATE.lighting, VIEWER_STATE.lightDir);
  presenter.animateToTrackballPosition(VIEWER_STATE.trackState);
  setAxes(VIEWER_STATE.axes);
  setTexture(VIEWER_STATE.texture);
  setTransparency(VIEWER_STATE.transparent);
  setSpecular(VIEWER_STATE.specular);
  setOrtho(VIEWER_STATE.ortho);
}

function defaultViewerState() {
  // homeTrackState è stato aggiornato a runtime in setupViewerState — il clone è intenzionale per evitare modifiche accidentali all'oggetto originale
  Object.assign(VIEWER_STATE, structuredClone(DEFAULT_VIEWER_STATE));
  VIEWER_STATE.trackState = VIEWER_STATE.homeTrackState.slice();
  applyViewerState();
}

function setViewerState(viewerState) {
  if (!viewerState) { defaultViewerState(); return; }
  Object.keys(viewerState).forEach(key => {
    VIEWER_STATE[key] = Array.isArray(viewerState[key]) ? viewerState[key].slice() : viewerState[key];
  });
  applyViewerState();

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

const screenshotState = { blob: null };
function screenshot(callback) {
  presenter.saveScreenshot();
  // Attendi che il dataURL venga generato (dopo il repaint)
  setTimeout(async () => {
    const dataUrl = presenter.screenshotData;
    if (!dataUrl) {
      bsAlert("Screenshot data not available.", "danger");
      return;
    }
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      screenshotState.blob = blob;
      const thumbPreview = document.getElementById('thumbPreview');
      if (thumbPreview) thumbPreview.innerHTML = `<img src="${dataUrl}" class="img-fluid rounded"/>`;
      if (typeof callback === 'function') callback(blob);
    } catch (error) {
      console.error("Errore nella conversione dell'immagine:", error);
      bsAlert("Failed to generate thumbnail image.", "danger");
    }
  }, 200);
}

function onTrackballUpdate(trackState) {
  VIEWER_STATE.trackState = trackState;
  gridComponent.updateGrid(trackState);	
}

const resizeCanvas = () => _resizeCanvas(presenter, viewerEl);

export { presenter, initModel, screenshotState, resizeCanvas };