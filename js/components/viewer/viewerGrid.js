export function initGrid(presenter, sceneBB, gStep, viewerState){

  // Calcola un passo della griglia adattivo alla dimensione della scena,
  // arrotondato a un valore "tondo" (1, 2, 5 ×10ⁿ) così da avere sempre
  // ~targetCells celle lungo il diametro e celle di misura leggibile.
  // Indipendente dall'unità dichiarata: si basa sul raggio reale della scena.
  function niceGridStep(targetCells = 16){
    const rad = 1 / presenter.sceneRadiusInv;
    const rawStep = (rad * 2) / targetCells;        // diametro / numero celle
    if (!isFinite(rawStep) || rawStep <= 0) return gStep || 1;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;                      // mantissa in [1,10)
    let nice;
    if (norm < 1.5) nice = 1;
    else if (norm < 3.5) nice = 2;
    else if (norm < 7.5) nice = 5;
    else nice = 10;
    console.log(`niceGridStep: rad=${rad.toFixed(3)}, rawStep=${rawStep.toFixed(3)}, mag=${mag}, norm=${norm.toFixed(3)}, nice=${nice}, final=${(nice*mag).toFixed(3)}`);
    return nice * mag;
  }

  function startupGrid(grid, attempt = 0){
    // `basev` (vertici base lato CPU del Nexus) può non popolarsi mai per certi
    // modelli (es. Nexus non scalati). Aspettiamo al massimo ~1.5s, poi procediamo
    // comunque: computeSceneBB ha il fallback sulla sfera della scena (header Nexus).
    const MAX_ATTEMPTS = 30; // 30 × 50ms
    let basevReady = true;
    for(let inst in presenter._scene.modelInstances){
      let vv = presenter._scene.meshes[presenter._scene.modelInstances[inst].mesh].renderable.mesh.basev;
      if (vv === undefined) { basevReady = false; break; }
    }
    if (!basevReady && attempt < MAX_ATTEMPTS) {
      setTimeout(() => startupGrid(grid, attempt + 1), 50);
      return;
    }
    switch (grid) {
      case 'gridBase': addBaseGrid(); break;
      case 'gridBox': addBoxGrid(); break;
      case 'gridBB': addBBGrid(); break;
    }
  }

  // Accumula nel sceneBB condiviso il bounding box dei vertici base di un'istanza.
  function accumulateInstanceBB(instance, vv) {
    const matrix = presenter._scene.modelInstances[instance].transform.matrix;
    for(let vi=1; vi<(vv.length / 3); vi++){
      const point = [vv[(vi*3)+0], vv[(vi*3)+1], vv[(vi*3)+2], 1];
      const tpoint = SglMat4.mul4(matrix, point);
      if(tpoint[0] > sceneBB[0]) sceneBB[0] = tpoint[0];
      if(tpoint[1] > sceneBB[1]) sceneBB[1] = tpoint[1];
      if(tpoint[2] > sceneBB[2]) sceneBB[2] = tpoint[2];
      if(tpoint[0] < sceneBB[3]) sceneBB[3] = tpoint[0];
      if(tpoint[1] < sceneBB[4]) sceneBB[4] = tpoint[1];
      if(tpoint[2] < sceneBB[5]) sceneBB[5] = tpoint[2];
    }
  }

  function computeSceneBB() {
    // sceneBB è condiviso a livello di modulo: va RESETTATO a ogni ricostruzione,
    // altrimenti accumula bounds stantii e non si ripulisce mai.
    sceneBB[0] = sceneBB[1] = sceneBB[2] = -Number.MAX_VALUE;
    sceneBB[3] = sceneBB[4] = sceneBB[5] =  Number.MAX_VALUE;

    // sceneRadiusInv/sceneCenter sono calcolati solo dentro il draw: forziamo
    // l'aggiornamento per avere il fallback (e niceGridStep) sempre coerenti.
    if (typeof presenter._setSceneCenterRadius === 'function') presenter._setSceneCenterRadius();

    let anyVerts = false;
    for(let inst in presenter._scene.modelInstances){
      const mname = presenter._scene.modelInstances[inst].mesh;
      const vv = presenter._scene.meshes[mname].renderable.mesh.basev;
      if (vv !== undefined) { accumulateInstanceBB(inst, vv); anyVerts = true; }
    }

    // Fallback: nessun basev disponibile → deriva il BB dalla sfera della scena
    // (datasetCenter/datasetRadius dell'header Nexus, sempre validi a scene-ready).
    // La sfera è CIRCOSCRITTA, quindi più grande del modello: usata cruda farebbe
    // "galleggiare" il modello (pavimento al fondo sfera) e un box troppo largo.
    // La stringiamo al cubo inscritto (semi-lato R/√3) per approssimare l'estensione
    // reale di un modello compatto: pavimento più in alto, box più aderente.
    if (!anyVerts) {
      const c = presenter.sceneCenter;
      const SPHERE_TO_BBOX = 1 / Math.sqrt(3); // ~0.577 — tunable
      const r = (1 / presenter.sceneRadiusInv) * SPHERE_TO_BBOX;
      sceneBB[0] = c[0] + r; sceneBB[1] = c[1] + r; sceneBB[2] = c[2] + r;
      sceneBB[3] = c[0] - r; sceneBB[4] = c[1] - r; sceneBB[5] = c[2] - r;
    }
  }
   
  function addBaseGrid() {
    computeSceneBB();
    let linesBuffer, gridBase;
    const rad = 1 / presenter.sceneRadiusInv;
    const XC = (sceneBB[0] + sceneBB[3]) / 2;
    const YC = sceneBB[4];
    const ZC = (sceneBB[2] + sceneBB[5]) / 2;
  
    const gStep = niceGridStep();
    const numDivMaj = Math.floor(rad/gStep);
  
    // major
    linesBuffer = [];
    for (let gg = -numDivMaj; gg <= numDivMaj; gg+=1){
      linesBuffer.push(
        [XC + (gg*gStep), YC, ZC + (-gStep*numDivMaj)],
        [XC + (gg*gStep), YC, ZC + ( gStep*numDivMaj)],
        [XC + (-gStep*numDivMaj), YC, ZC + (gg*gStep)],
        [XC + ( gStep*numDivMaj), YC, ZC + (gg*gStep)]
      );
    }
    gridBase = presenter.createEntity("gridBase", "lines", linesBuffer);
    gridBase.color = [0.9, 0.9, 0.9, 1];
    gridBase.zOff = 0;
    presenter.repaint();
  }
  
  function addBoxGrid() {
    computeSceneBB();
  
    let Xsteps,Ysteps,Zsteps, gridBox;
    const gStep = niceGridStep();
    const XC = (sceneBB[0] + sceneBB[3]) / 2;
    const YC = (sceneBB[1] + sceneBB[4]) / 2;
    const ZC = (sceneBB[2] + sceneBB[5]) / 2;
    
    Xsteps = Math.trunc(Math.ceil((sceneBB[0]-sceneBB[3])/gStep)+1);
    Ysteps = Math.trunc(Math.ceil((sceneBB[1]-sceneBB[4])/gStep)+1);
    Zsteps = Math.trunc(Math.ceil((sceneBB[2]-sceneBB[5])/gStep)+1);	
    
    const boxG = [0, 0, 0, 0, 0, 0];
    boxG[0] = XC + ((Xsteps/2) * gStep);
    boxG[1] = YC + ((Ysteps/2) * gStep);
    boxG[2] = ZC + ((Zsteps/2) * gStep);
    boxG[3] = XC - ((Xsteps/2) * gStep);
    boxG[4] = YC - ((Ysteps/2) * gStep);
    boxG[5] = ZC - ((Zsteps/2) * gStep);
  
    let linesBuffer = [];	
    //--------------------X
    for (let ii=0; ii<=Ysteps; ii+=1){
      linesBuffer.push(
        [boxG[3], boxG[4]+(gStep*ii), boxG[2]],
        [boxG[3], boxG[4]+(gStep*ii), boxG[5]],
        [boxG[0], boxG[4]+(gStep*ii), boxG[2]],
        [boxG[0], boxG[4]+(gStep*ii), boxG[5]]
      );
    }
    for (let ii=0; ii<=Zsteps; ii+=1){
      linesBuffer.push(
        [boxG[3], boxG[1], boxG[5]+(gStep*ii)],
        [boxG[3], boxG[4], boxG[5]+(gStep*ii)],
        [boxG[0], boxG[1], boxG[5]+(gStep*ii)],
        [boxG[0], boxG[4], boxG[5]+(gStep*ii)]
      );
    }
    //--------------------Y
    for (let ii = 0; ii <= Xsteps; ii+=1){
        linesBuffer.push([boxG[3]+(gStep*ii), boxG[4], boxG[2]], [boxG[3]+(gStep*ii), boxG[4], boxG[5]], [boxG[3]+(gStep*ii), boxG[1], boxG[2]], [boxG[3]+(gStep*ii), boxG[1], boxG[5]]);
    }
    for (let ii = 0; ii <= Zsteps; ii+=1){
        linesBuffer.push(
          [boxG[0], boxG[4], boxG[5]+(gStep*ii)],
          [boxG[3], boxG[4], boxG[5]+(gStep*ii)],
          [boxG[0], boxG[1], boxG[5]+(gStep*ii)],
          [boxG[3], boxG[1], boxG[5]+(gStep*ii)]
        );
    }
    //--------------------Z
    for (let ii = 0; ii <= Xsteps; ii+=1){
        linesBuffer.push([boxG[3]+(gStep*ii), boxG[1], boxG[5]], [boxG[3]+(gStep*ii), boxG[4], boxG[5]], [boxG[3]+(gStep*ii), boxG[1], boxG[2]], [boxG[3]+(gStep*ii), boxG[4], boxG[2]]);
    }
    for (let ii = 0; ii <= Ysteps; ii+=1){
        linesBuffer.push([boxG[0], boxG[4]+(gStep*ii), boxG[5]], [boxG[3], boxG[4]+(gStep*ii), boxG[5]], [boxG[0], boxG[4]+(gStep*ii), boxG[2]], [boxG[3], boxG[4]+(gStep*ii), boxG[2]]);
    }
  
    gridBox = presenter.createEntity("gridBox", "lines", linesBuffer);
    gridBox.color = [0.8, 0.8, 0.8, 0.5];
    gridBox.zOff = 0;
    gridBox.useTransparency = true;		
    presenter.repaint();
  }
  
  function addBBGrid() {
    // sceneRadiusInv è calcolato solo dentro il draw: forziamo l'aggiornamento
    // per evitare la griglia sub-pixel se costruita prima del primo frame.
    if (typeof presenter._setSceneCenterRadius === 'function') presenter._setSceneCenterRadius();
    const rad = (1 / presenter.sceneRadiusInv) * 1;
    const XC = 0;
    const YC = 0;
    const ZC = 0;
  
    const gStep = niceGridStep();
    const numDiv = Math.floor(rad / gStep);
    const linesBuffer = [];
    let gridBB;
    
    for (let gg = -numDiv; gg <= numDiv; gg+=1){
      linesBuffer.push([XC + (gg*gStep), YC + (-gStep*numDiv), ZC], [XC + (gg*gStep), YC + ( gStep*numDiv), ZC], [XC + (-gStep*numDiv), YC + (gg*gStep), ZC], [XC + ( gStep*numDiv), YC + (gg*gStep), ZC]);
    }
    gridBB = presenter.createEntity("gridBB", "lines", linesBuffer);
    gridBB.color = [0.7, 0.7, 0.7, 0.5];
    gridBB.zOff = 0.5;
    gridBB.useTransparency = true;		
    presenter.repaint();
  }
  
  function setGrid(btn, value){
    presenter.deleteEntity('gridBase');
    presenter.deleteEntity('gridBox');
    presenter.deleteEntity('gridBB'); 
    btn.classList.remove("btn-adc-blue", "btn-secondary");
  
    if(value === undefined){
      switch (viewerState.grid) {  // usa viewerState passato come parametro
        case 'none': viewerState.grid = 'gridBase'; break;      
        case 'gridBase': viewerState.grid = 'gridBox'; break;
        case 'gridBox': viewerState.grid = 'gridBB'; break;
        case 'gridBB': viewerState.grid = 'none'; break;
      }
    }else{
      viewerState.grid = value;  // usa viewerState passato come parametro
    }

    switch (viewerState.grid) {  // usa viewerState passato come parametro
      case 'none':
        btn.classList.add("btn-secondary");
        break;
      case 'gridBase':
        addBaseGrid();
        btn.classList.add("btn-adc-blue");
        break;
      case 'gridBox':
        addBoxGrid();
        btn.classList.add("btn-adc-blue");
        break;
      case 'gridBB':
        addBBGrid();
        btn.classList.add("btn-adc-blue");
        break;
    }    
    presenter.repaint();
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


  return{
    startupGrid,
    setGrid,
    updateGrid
  }
}