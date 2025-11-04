import { collectionState } from "./modules/collectionStorage.js";
import { viewsStorage } from "./modules/viewsStorage.js";
import { copy_to_clipboard } from "./helpers/helper.js";
import { init3dhop } from "./modules/initViewer.js";
import { bsAlert } from "./components/bsComponents.js";
import { confirmAction } from "./helpers/helper.js";
import { initGrid } from "./components/viewer/grid.js";
import { initLightController } from "./components/viewer/light.js";
import { initAnnotations } from "./components/viewer/annotations.js";
import { initSection } from "./components/viewer/section.js";
import { measureTool } from "./helpers/viewerMeasure.js";

const artifactId = document.getElementById('artifactId').value;
const activeUser = document.getElementById('activeUsr').value;
const role = document.getElementById('role').value;
const isLoggedUser = activeUser && activeUser !== 'unregistered' && !isNaN(Number(activeUser));

const viewerEl = {
  canvas: document.getElementById('draw-canvas'),
  btGrid: document.getElementById('btGrid'),
}

let presenter, viewsManager, lightComponent, gridComponent, annotations, measure, section;

// scene data
let sceneBB = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
let gStep, measure_unit;

let COLLECTIONITEM = undefined;
let DEFAULT_VIEWER_STATE = {
  grid : 'gridBase',
  axes : false,
  navigation : "turntable",
  homeTrackState : [15,15,0,0,0,3.0],
  trackState : [15,15,0,0,0,3.0],
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
  object: artifactId,
  user: activeUser,
  time: new Date().toISOString(),
  notes: {text:""},
  views: {},
  spots: {}
};

const toolBtnList = [].slice.call(document.querySelectorAll('.toolBtn'))
const tooltipBtnList = toolBtnList.map(tooltipBtn => new bootstrap.Tooltip(tooltipBtn,{trigger:'hover', html: true, placement:'left' }))

/////////////////////////////////////////////////////////////
//////////////// FUNCTIONS //////////////////////////////////
/////////////////////////////////////////////////////////////

async function initModel(model) {
  const mainData = model.model;
  const modelId = mainData.id;
  const object = model.model_object;
  const model_view = model.model_view;
  const paradata = model.model_object[0]
  measure_unit = object[0].measure_unit;

  if(isNaN(activeUser?.value) || activeUser?.value === 'unregistered') {
    const btSaveModelParam = document.getElementsByName('saveModelParam')[0];
    if(btSaveModelParam) btSaveModelParam.remove();
  }

  //fill modal metadata
  let statusAlert, statusTooltip, statusBtnClass, statusBtnValue, statusBtnTooltip;
  if(mainData.status_id == 1){
    statusAlert = 'alert-danger';
    statusTooltip = 'model not visible in the main gallery. Click the "change visibility" button or edit the model to change model visibility'
    statusBtnClass = 'btn-success'
    statusBtnValue = 2
    statusBtnTooltip = 'Mark model as complete. The Model will be visible in the main gallery'
  }else{
    statusAlert = 'alert-success';
    statusTooltip = 'model visible in the main gallery. Click the "change visibility" button or edit the model to change model visibility';
    statusBtnClass = 'btn-warning'
    statusBtnValue = 1
    statusBtnTooltip = 'Mark model as under processing. The Model will not be visible in the main gallery'
  }
  const modelStatus = document.querySelector("#model-status");
  modelStatus.classList.add(statusAlert);
  if(isLoggedUser){
    const btn = document.querySelector("button[name=modelVisibility");
    btn.classList.add(statusBtnClass);
    btn.value = statusBtnValue;
    btn.addEventListener('click', () => changeModelStatus(modelId));
  }else{
    document.querySelector("#toolBarModel").remove();
  } 

  const isEmpty = (value) => value === null || value === undefined || value === '';
  Object.keys(mainData).forEach(key => {    
    if(!isEmpty(mainData[key])) {
      if(key == 'doi' && mainData.doi){
        const doi = document.querySelector("#model-doi");
        if(doi){
          doi.setAttribute('href', mainData.doi);
          const img = document.createElement('img');
          img.src = mainData.doi_svg;
          doi.appendChild(img);
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
  
  object.forEach((element, index) => {
    // se ci sono più modelli nel canvas crea le miniature per cambiare mesh
    const thumbPath = 'archive/thumb/'+element.thumbnail;
    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'thumb';
    document.querySelector('#object-control').appendChild(thumbDiv);
    const img = document.createElement('img');
    img.className = 'img-fluid';
    img.src = thumbPath;
    thumbDiv.appendChild(img);
    const backdrop = document.createElement('div');
    backdrop.className = 'backdrop';
    thumbDiv.appendChild(backdrop);
    backdrop.style.display = 'none';
    thumbDiv.addEventListener('click', function(){
      backdrop.style.display = backdrop.style.display === 'none' ? 'block' : 'none';
      const vis = backdrop.style.display === 'none';
      presenter.setInstanceVisibilityByName('mesh_'+index, vis, true);
    });

    const row = document.createElement('div');
    row.className = 'row';
    const listWrap = document.querySelector("#listWrap");
    if (listWrap) listWrap.appendChild(row);
    const thumb = document.createElement('div');
    thumb.className = 'col-4';
    row.appendChild(thumb);
    const img2 = document.createElement('img');
    img2.className = 'img-fluid rounded';
    img2.src = thumbPath;
    thumb.appendChild(img2);
    const metadata = document.createElement('div');
    metadata.className = 'col-8';
    row.appendChild(metadata);
    const ul = document.createElement('ul');
    ul.className = 'list-group list-group-flush';
    metadata.appendChild(ul);

    const field = ['acquisition_method','status','author','owner','license_acronym','create_at','description','note','software','points','polygons','textures','scans','pictures','encumbrance','measure_unit']
    Object.keys(element).forEach(key => {
      if (field.includes(key)){
        if(element[key]){
          const li = document.createElement('li');
          li.className = 'list-group-item';
          ul.appendChild(li);
          const span1 = document.createElement('span');
          span1.textContent = key;
          li.appendChild(span1);
          const span2 = document.createElement('span');
          span2.textContent = element[key];
          li.appendChild(span2);
        }
      }
    })
    if(isLoggedUser){
      const navBarObj = document.createElement('nav');
      navBarObj.className = "my-3 pb-2 border-bottom";
      metadata.appendChild(navBarObj);
      const a = document.createElement('a');
      a.href = 'object_edit.php?model='+mainData.id+'&item='+element.id;
      a.className = 'btn btn-sm btn-adc-dark';
      a.textContent = 'edit';
      navBarObj.appendChild(a);
      if(object.length > 1){
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-danger float-end';
        button.textContent = 'delete object';
        navBarObj.appendChild(button);
      }
    }
  });

  // retrieve collection data from LocalStorage
  const stateManager = await collectionState();
  const currentState = stateManager.getState();
  stateManager.sync();
  const activeCollection = currentState.activeCollection;
  
  if (activeCollection && activeCollection.items) {
    COLLECTIONITEM = activeCollection.items.find(item => item.id == artifactId);
  }
  
  // Load annotations from viewsStorage
  viewsManager = await viewsStorage();
  const savedAnnotations = viewsManager.getAnnotations(artifactId);
  
  if (savedAnnotations) {
    VIEWER_ANNOTATIONS = savedAnnotations;
  } else if (COLLECTIONITEM && COLLECTIONITEM.annotations) {
    VIEWER_ANNOTATIONS = COLLECTIONITEM.annotations;
    viewsManager.setAnnotations(artifactId, VIEWER_ANNOTATIONS);
  }
  
  initListeners();
  startupViewer(object);
}

function initListeners() {
  const btHome = document.getElementById('btHome');
  if(btHome) btHome.addEventListener('click', () => setViewerState(null));

  const btScreenshot = document.getElementById("btScreenshot");
  if(btScreenshot) btScreenshot.addEventListener('click', () => screenshot());

  const btParadataToggle = document.getElementsByClassName('btParadataToggle');
  [...btParadataToggle].forEach(btn => {
    btn.addEventListener('click', async () => {
      const paradataModal = document.getElementById('paradata-modal');
      paradataModal.classList.toggle('d-none');
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

function startupViewer(object) {
  presenter = new Presenter("draw-canvas");
  init3dhop(isLoggedUser);
  const myScene = {
    meshes: { 
      "sphere": { url: "archive/models/sphere.ply" },  
      "cube": { url: "archive/models/cube.ply" },
    },
    modelInstances: {},
    spots: {},
    trackball: {},
    space: {
      centerMode: "scene",
      radiusMode: "scene",
      cameraNearFar: [0.01, 10.0],
      cameraFOV: DEFAULT_VIEWER_STATE.fov,
    },
    config: {
      pickedpointColor: [1.0, 0.0, 1.0],
      measurementColor: [0.5, 1.0, 0.5],
      showClippingPlanes: true,
      showClippingBorder: true,
      clippingBorderSize: 0.1,
      clippingBorderColor: [0.0, 1.0, 1.0]
    }
  };

  if(DEFAULT_VIEWER_STATE.navigation == "turntable"){
    myScene.trackball = {
      type: TurntablePanTrackball,
      trackOptions: {
        startPhi: DEFAULT_VIEWER_STATE.trackState[0],
        startTheta: DEFAULT_VIEWER_STATE.trackState[1],
        startPanX: DEFAULT_VIEWER_STATE.trackState[2],
        startPanY: DEFAULT_VIEWER_STATE.trackState[3],
        startPanZ: DEFAULT_VIEWER_STATE.trackState[4],
        startDistance: DEFAULT_VIEWER_STATE.trackState[5],
        minMaxPhi: [-180, 180],
        minMaxTheta: [-90.0, 90.0],
        minMaxDist: [0.1, 5.0]
      }
    };
  } else if(DEFAULT_VIEWER_STATE.navigation == "sphere"){
    myScene.trackball = {
      type: SphereTrackball,
      trackOptions: {
        startMatrix: [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0],
        startPanX: 0.0,
        startPanY: 0.0,
        startPanZ: 0.0,
        startDistance: 2.0,
        minMaxDist: [0.2, 4.0],
      }
    };
  }

  object.forEach((element, index) => {
    myScene.meshes['mesh_'+index] = {
      url: 'archive/models/' + element.object 
    };
    myScene.modelInstances['mesh_'+index] = {
      mesh: 'mesh_'+index, 
      tags: ['Group'], 
      color: [0.5, 0.5, 0.5], 
      backfaceColor: [0.5, 0.5, 0.5, 3.0], 
      specularColor: [0.0, 0.0, 0.0, 256.0]
    };
  });

  if(measure_unit === "mm")
    myScene.config.clippingBorderSize = 0.5;
  if(measure_unit === "m")
    myScene.config.clippingBorderSize = 0.0005;

  presenter.setScene(myScene);

  DEFAULT_VIEWER_STATE.homeTrackState = presenter.getTrackballPosition();
  DEFAULT_VIEWER_STATE.trackState = DEFAULT_VIEWER_STATE.homeTrackState.slice();
  presenter._onEndMeasurement = onEndMeasure;
  presenter.setClippingPointXYZ(0.5, 0.5, 0.5);

  switch (measure_unit) {
    case 'mm': gStep = 10.0; break;
    case 'm': gStep = 0.01; break;
    default: gStep = 1.0; break;
  }

  VIEWER_STATE = structuredClone(DEFAULT_VIEWER_STATE);
  VIEWER_STATE.trackState = VIEWER_STATE.homeTrackState.slice();

  lightComponent = initLightController(presenter, VIEWER_STATE);
  gridComponent = initGrid(presenter, sceneBB, gStep, VIEWER_STATE, measure_unit);
  measure = measureTool(presenter, VIEWER_STATE, viewerEl, measure_unit);
  presenter._onEndPickingPoint = measure.onEndPick;
  annotations = initAnnotations( presenter, VIEWER_STATE, viewerEl, VIEWER_ANNOTATIONS, artifactId, measure_unit, measure, setViewerState, storeAnnotations );
  section = initSection(presenter, VIEWER_STATE,DEFAULT_VIEWER_STATE);
  
  
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

function changeModelStatus(model) {
  const status = document.querySelector("button[name=modelVisibility").value;
  const dati = {trigger:'changeModelStatus', dati:{id:model, status:status}};
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
  if(section && section.setSections) {
    const hasActiveSections = VIEWER_STATE.clipping && (VIEWER_STATE.clipping[0] || VIEWER_STATE.clipping[1] || VIEWER_STATE.clipping[2]);
    
    if(hasActiveSections) {
      const sectionsBox = document.getElementById('sections-box');
      if(sectionsBox && sectionsBox.classList.contains('d-none')) {
        sectionsBox.classList.remove('d-none');
      }
      
      const btSection = document.getElementById('btSection');
      if(btSection && !btSection.checked) {
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
  
  const spec = value ? [0.3, 0.3, 0.3, 256.0] : [0.0, 0.0, 0.0, 256.0];
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
  
  if (COLLECTIONITEM) {
    COLLECTIONITEM.annotations = VIEWER_ANNOTATIONS;
    storeCollectionData();
  }
}

async function storeViewsData() {
  const viewsManager = await viewsStorage();
  viewsManager.setAnnotations(artifactId, VIEWER_ANNOTATIONS);
}

async function storeCollectionData() {
  const stateManager = await collectionState();
  const currentState = stateManager.getState();
  stateManager.sync();
}

function screenshot() {
  return presenter.saveScreenshot();
}

function viewFrom(direction) {
  const distance = DEFAULT_VIEWER_STATE.homeTrackState[5];
  switch(direction) {
    case "default":
      presenter.animateToTrackballPosition(DEFAULT_VIEWER_STATE.homeTrackState);
      break;
    case "front":
      presenter.animateToTrackballPosition([0.0, 0.0, 0.0, 0.0, 0.0, distance]);
      break;
    case "back":
      presenter.animateToTrackballPosition([180.0, 0.0, 0.0, 0.0, 0.0, distance]);
      break;			
    case "top":
      presenter.animateToTrackballPosition([0.0, 90.0, 0.0, 0.0, 0.0, distance]);
      break;
    case "bottom":
      presenter.animateToTrackballPosition([0.0, -90.0, 0.0, 0.0, 0.0, distance]);
      break;
    case "left":
      presenter.animateToTrackballPosition([270.0, 0.0, 0.0, 0.0, 0.0, distance]);
      break;
    case "right":
      presenter.animateToTrackballPosition([90.0, 0.0, 0.0, 0.0, 0.0, distance]);
      break;			
  }
};

function addAxes() {
  const rad = (1.0 / presenter.sceneRadiusInv)/2.0;
  let linesBuffer, point, tpoint;
  
  // X axis (red)
  point = [rad, 0.0, 0.0, 1.0]
  tpoint = SglMat4.mul4(presenter._scene.modelInstances["mesh_0"].transform.matrix, point);
  linesBuffer = [];
  linesBuffer.push([0, 0, 0]);
  linesBuffer.push([tpoint[0], tpoint[1], tpoint[2]]);	
  const axisX = presenter.createEntity("XXaxis", "lines", linesBuffer);
  axisX.color = [1.0, 0.2, 0.2, 1.0];
  axisX.zOff = 0.0;
  
  // Y axis (green)
  point = [0.0, rad, 0.0, 1.0]
  tpoint = SglMat4.mul4(presenter._scene.modelInstances["mesh_0"].transform.matrix, point);
  linesBuffer = [];
  linesBuffer.push([0, 0, 0]);
  linesBuffer.push([tpoint[0], tpoint[1], tpoint[2]]);	
  const axisY = presenter.createEntity("YYaxis", "lines", linesBuffer);
  axisY.color = [0.2, 1.0, 0.2, 1.0];
  axisY.zOff = 0.0;

  // Z axis (blue)
  point = [0.0, 0.0, rad, 1.0]
  tpoint = SglMat4.mul4(presenter._scene.modelInstances["mesh_0"].transform.matrix, point);	
  linesBuffer = [];
  linesBuffer.push([0, 0, 0]);
  linesBuffer.push([tpoint[0], tpoint[1], tpoint[2]]);	
  const axisZ = presenter.createEntity("ZZaxis", "lines", linesBuffer);
  axisZ.color = [0.2, 0.2, 1.0, 1.0];
  axisZ.zOff = 0.0;	
  
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
  if (typeof presenter._scene.entities === 'undefined') return;
  if (typeof presenter._scene.entities["gridBB"] === 'undefined') return;
  const tt=[0.0,0.0,0.0];
  tt[0] = (trackState[2] / presenter.sceneRadiusInv) + presenter.sceneCenter[0];
  tt[1] = (trackState[3] / presenter.sceneRadiusInv) + presenter.sceneCenter[1];
  tt[2] = (trackState[4] / presenter.sceneRadiusInv) + presenter.sceneCenter[2];
  const mrX = SglMat4.rotationAngleAxis(sglDegToRad(-trackState[1]), [1.0, 0.0, 0.0]);
  const mrY = SglMat4.rotationAngleAxis(sglDegToRad(trackState[0]), [0.0, 1.0, 0.0]);
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

export { initModel, startupViewer, resizeCanvas };