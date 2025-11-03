export function measureTool(presenter, viewerState, viewerEl, measure_unit) {
  // Variabili di stato locali al modulo
  let angleStage = 0;
  let anglePoints = [[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]];
  let distanceStage = 0;
  let distancePoints = [[0.0,0.0,0.0],[0.0,0.0,0.0]];
  let pickStage = 0;
  let pickPoints = [0.0,0.0,0.0];

  // Callbacks
  function onEndPick(point) {
    const coords = `[${point[0].toFixed(getDecimalPlaces(measure_unit))}, ${point[1].toFixed(getDecimalPlaces(measure_unit))}, ${point[2].toFixed(getDecimalPlaces(measure_unit))}]`;
    document.querySelector('#measure-output').innerHTML = coords;
  }

  function onDistancePick(point) {
    if(distanceStage == 2) distanceStage = 0;
    distancePoints[distanceStage] = [point[0], point[1], point[2]];
    distanceStage++;
    displayDistance();
    presenter._pickValid = false;
    if(distanceStage == 2) { computeDistance(); }
  }

  function onPickpointPick(point) {
    if(pickStage == 1) { pickStage = 0; } // reset for new measure
    pickPoints[pickStage] = [point[0], point[1], point[2]];
    presenter._pickValid = false;
    computePickpoint();
  }

  function onAnglePick(point) {
    if(angleStage == 3) angleStage = 0; // reset for new measure
    anglePoints[angleStage] = [point[0], point[1], point[2]];
    angleStage++;
    displayAngle();
    presenter._pickValid = false;
    if(angleStage == 3) {
      computeAngle();
    }
  }

  // Compute functions
  function computePickpoint() { 
    const opoint = [pickPoints[0][0], pickPoints[0][1], pickPoints[0][2], 1.0];	
    const tpoint = SglMat4.mul4(SglMat4.inverse(presenter._scene.modelInstances["mesh_0"].transform.matrix), opoint);
    const clampTo = getDecimalPlaces(measure_unit);
    const x = tpoint[0].toFixed(clampTo);
    const y = tpoint[1].toFixed(clampTo);
    const z = tpoint[2].toFixed(clampTo);
    document.querySelector('#measure-output').innerHTML = "[ "+x+" , "+y+" , "+z+" ]";
    
    // sets active measurement in the viewer state
    viewerState.activeMeasurement = {
      type: "pick",
      p0: pickPoints[0].slice()
    };
    displayPickpoint();
  }

  function computeDistance() {
    var distance = SglVec3.length(SglVec3.sub(distancePoints[0], distancePoints[1]));
    const clampTo = getDecimalPlaces(measure_unit);
    document.querySelector('#measure-output').innerHTML = distance.toFixed(clampTo) + measure_unit;
    
    viewerState.activeMeasurement = {
      type: "distance",
      value: distance,
      p0: distancePoints[0].slice(),
      p1: distancePoints[1].slice()
    };
    displayDistance();
  }

  function computeAngle() {
    const v0 = SglVec3.sub(anglePoints[0], anglePoints[1]);
    const v1 = SglVec3.sub(anglePoints[2], anglePoints[1]);
    const dot = SglVec3.dot(SglVec3.normalize(v0), SglVec3.normalize(v1));
    const angle = Math.acos(dot) * 180.0 / Math.PI;
    document.querySelector('#measure-output').innerHTML = angle.toFixed(2) + "°";
    
    viewerState.activeMeasurement = {
      type: "angle",
      p0: anglePoints[0].slice(),
      p1: anglePoints[1].slice(),
      p2: anglePoints[2].slice()
    };
    displayAngle();
  }

  // Display functions
  function displayPickpoint() {
    const pointsBuffer = [];
    const linesBuffer = [];
    
    pointsBuffer.push(pickPoints[0]);
    const pickpointP = presenter.createEntity("pickpointP", "points", pointsBuffer);
    pickpointP.color = [0.8, 0.3, 0.7, 1.0];
    pickpointP.pointSize = 10;
    pickpointP.useSeethrough = true;

    linesBuffer.push(SglVec3.add(pickPoints[0], [ 5.0, 0.0, 0.0]));
    linesBuffer.push(SglVec3.add(pickPoints[0], [-5.0, 0.0, 0.0]));  
    linesBuffer.push(SglVec3.add(pickPoints[0], [ 0.0, 5.0, 0.0]));
    linesBuffer.push(SglVec3.add(pickPoints[0], [ 0.0,-5.0, 0.0]));
    linesBuffer.push(SglVec3.add(pickPoints[0], [ 0.0, 0.0, 5.0]));
    linesBuffer.push(SglVec3.add(pickPoints[0], [ 0.0, 0.0,-5.0]));
    const pickpointL = presenter.createEntity("pickpointL", "lines", linesBuffer);
    pickpointL.color = [0.8, 0.3, 0.7, 1.0];
    pickpointL.zOff = 0.0;

    presenter.repaint();
  }

  function displayDistance(){
    const pointsBuffer = [];
    for(let ii=0; ii<distanceStage; ii++){ pointsBuffer.push(distancePoints[ii]); }
    const angleP = presenter.createEntity("distanceP", "points", pointsBuffer);
    angleP.color = [0.5, 1.0, 0.5, 1.0];
    angleP.pointSize = 10;
    angleP.useSeethrough = true;

    if(distanceStage == 2){
      const distance = SglVec3.length(SglVec3.sub(distancePoints[0], distancePoints[1]));

      // Spessore basato sulla scena con limiti min/max
      const sceneSize = 1.0 / presenter.sceneRadiusInv;
      const minThickness = sceneSize * 0.001;  // 0.2% della scena
      const maxThickness = sceneSize * 0.005;   // 1% della scena
      const thickness = Math.max(minThickness, Math.min(maxThickness, distance/30.0));
      
      const triBuffer = tube(distancePoints[0], distancePoints[1], thickness);
      const distanceBar = presenter.createEntity("distanceL", "triangleStrip", triBuffer);
      distanceBar.color = [0.5, 1.0, 0.5, 1.0];
      distanceBar.useTransparency = false;
      distanceBar.useSeethrough = true;
      distanceBar.zOff = 0.0;
      presenter.repaint();
    }
  }

  function displayAngle(){
	  const pointsBuffer = [];
	  for(let ii=0; ii<angleStage; ii++){
		  pointsBuffer.push(anglePoints[ii]);
	  }
	  const angleP = presenter.createEntity("angleP", "points", pointsBuffer);
	  angleP.color = [0.2, 0.3, 0.9, 1.0];
    angleP.pointSize = 8;
    angleP.useSeethrough = true;

    const linesBuffer = [];
    for(let ii=0; ii<angleStage-1; ii++){
		  linesBuffer.push(anglePoints[ii]);
		  linesBuffer.push(anglePoints[ii+1]);
	  }
	  const angleL = presenter.createEntity("angleL", "lines", linesBuffer);
	  angleL.color = [0.2, 0.3, 0.9, 1.0];
    angleL.useSeethrough = true;
    angleL.zOff = 0.001;

    if(angleStage == 3){
      const v1 = SglVec3.normalize(SglVec3.sub(anglePoints[0], anglePoints[1]));
      const v2 = SglVec3.normalize(SglVec3.sub(anglePoints[2], anglePoints[1]));      
      const len = 0.75 * Math.min(SglVec3.length(SglVec3.sub(anglePoints[0], anglePoints[1])), SglVec3.length(SglVec3.sub(anglePoints[2], anglePoints[1])));
      const triBuffer = [];
      triBuffer.push(anglePoints[1]);
      triBuffer.push(SglVec3.add(SglVec3.muls(v1,len),anglePoints[1]));
      triBuffer.push(SglVec3.add(SglVec3.muls(v2,len),anglePoints[1]));
      const angleV = presenter.createEntity("angleV", "triangles", triBuffer);
      angleV.color = [0.2, 0.5, 0.7, 0.3];
      angleV.useTransparency = true;
      angleV.useSeethrough = true;
      angleV.zOff = 0.001;
    } else {
      presenter.deleteEntity("angleV");
    }
	  presenter.repaint();
  }


  // Tube helper (per la visualizzazione della distanza)
function tube(p0, p1, thickness){
  const dt = thickness;
  
	const dir = SglVec3.normalize(SglVec3.sub(p1, p0));
	let vInitial = [0.0, 0.0, 0.0];
	do {
		vInitial[0] = Math.random()+0.01;
		vInitial[1] = Math.random()+0.01;
		vInitial[2] = Math.random()+0.01;
		vInitial = SglVec3.normalize(vInitial);
	} while (SglVec3.dot(dir, vInitial) > 0.9);
	const v0 = SglVec3.normalize(SglVec3.cross(dir, vInitial));
	const v1 = SglVec3.normalize(SglVec3.cross(dir, v0));

	// from Optimizing Triangle Strips for Fast Rendering https://www.cs.umd.edu/gvil/papers/av_ts.pdf
	// triangle strip of a cube
	const vertices = [];
	vertices[1] = SglVec3.add(p0, SglVec3.muls(v0, dt));
	vertices[2] = SglVec3.add(p0, SglVec3.muls(v1,-dt));
	vertices[3] = SglVec3.add(p0, SglVec3.muls(v1, dt));
	vertices[4] = SglVec3.add(p0, SglVec3.muls(v0,-dt));
	vertices[5] = SglVec3.add(p1, SglVec3.muls(v0, dt));
	vertices[6] = SglVec3.add(p1, SglVec3.muls(v1,-dt));
	vertices[7] = SglVec3.add(p1, SglVec3.muls(v0,-dt));
	vertices[8] = SglVec3.add(p1, SglVec3.muls(v1, dt));
	const triBuffer = [];
	triBuffer.push(vertices[4]);
	triBuffer.push(vertices[3]);
	triBuffer.push(vertices[7]);
	triBuffer.push(vertices[8]);
	triBuffer.push(vertices[5]);
	triBuffer.push(vertices[3]);
	triBuffer.push(vertices[1]);
	triBuffer.push(vertices[4]);
	triBuffer.push(vertices[2]);
	triBuffer.push(vertices[7]);
	triBuffer.push(vertices[6]);
	triBuffer.push(vertices[5]);
	triBuffer.push(vertices[2]);
	triBuffer.push(vertices[1]);

  return triBuffer;
}

  // Measurement controls
  function measureDistance(state) {
    distanceStage = 0;
    distancePoints = [[0.0,0.0,0.0],[0.0,0.0,0.0]];
    if(state) {
      presenter._onEndPickingPoint = onDistancePick;
      presenter.enablePickpointMode(true);
    } else {
      presenter.deleteEntity("distanceP");
      presenter.deleteEntity("distanceL");
      presenter.enablePickpointMode(false);
      presenter._onEndPickingPoint = onEndPick;
    }
  }

  function measurePickpoint(state) {
    pickStage = 0;
    pickPoints = [0.0,0.0,0.0];
    if(state) {
      presenter._onEndPickingPoint = onPickpointPick;
      presenter.enablePickpointMode(true);
    } else {
      presenter.deleteEntity("pickpointP");
      presenter.deleteEntity("pickpointL");    
      presenter.enablePickpointMode(false);
      presenter._onEndPickingPoint = onEndPick;    
    }
  }

  function measureAngle(state) {
    angleStage = 0;
    anglePoints = [[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]];
    if(state) {
      presenter._onEndPickingPoint = onAnglePick;
      presenter.enablePickpointMode(true);	
    } else {
      presenter.deleteEntity("angleP");
      presenter.deleteEntity("angleL");
      presenter.deleteEntity("angleV");
      presenter.enablePickpointMode(false);
      presenter._onEndPickingPoint = onEndPick;
    }
  }

  function measurePanelSwitch(state, instructions, title, output) {
    if(instructions) document.querySelector('#panel_instructions').innerHTML = instructions; 
    if(title) document.querySelector("#measure-box-title").textContent = title;
    if(output) document.querySelector("#measure-output").innerHTML = output;
  
    const box = document.querySelector('#measure-box');
    if(state) {
      box.classList.remove('invisible');
      box.style.display = 'block';
      viewerEl.canvas.style.cursor = "crosshair";
    } else {
      box.classList.add('invisible');
      viewerEl.canvas.style.cursor = "default";
    }
  }

  function stopMeasure() {
    const btns = document.getElementsByName('measureTool');
    [...btns].forEach(btn => {
      btn.checked = false
    });
    measureDistance(false);
    measurePickpoint(false);
    measureAngle(false);
    measurePanelSwitch(false);
    viewerState.activeMeasurement = null;
  }

  // Aggiungi questi metodi prima del return

  function restoreDistance(p0, p1, value) {
    distancePoints[0] = p0.slice();
    distancePoints[1] = p1.slice();
    distanceStage = 2;
    computeDistance();
    // Mostra il pannello con il risultato
    measurePanelSwitch(true, 'Click to measure distance', 'Distance', value.toFixed(getDecimalPlaces(measure_unit)) + measure_unit);
  }

  function restorePickpoint(p0) {
    pickPoints[0] = p0.slice();
    pickStage = 1;
    computePickpoint();
    // Mostra il pannello con il risultato
    const opoint = [p0[0], p0[1], p0[2], 1.0];	
    const tpoint = SglMat4.mul4(SglMat4.inverse(presenter._scene.modelInstances["mesh_0"].transform.matrix), opoint);
    const clampTo = getDecimalPlaces(measure_unit);
    const x = tpoint[0].toFixed(clampTo);
    const y = tpoint[1].toFixed(clampTo);
    const z = tpoint[2].toFixed(clampTo);
    measurePanelSwitch(true, 'Click to pick a point', 'Point', `[ ${x} , ${y} , ${z} ]`);
  }

  function restoreAngle(p0, p1, p2, value) {
    anglePoints[0] = p0.slice();
    anglePoints[1] = p1.slice();
    anglePoints[2] = p2.slice();
    angleStage = 3;
    computeAngle();
    // Mostra il pannello con il risultato
    const v0 = SglVec3.sub(p0, p1);
    const v1 = SglVec3.sub(p2, p1);
    const dot = SglVec3.dot(SglVec3.normalize(v0), SglVec3.normalize(v1));
    const angle = Math.acos(dot) * 180.0 / Math.PI;
    measurePanelSwitch(true, 'Click to measure angle', 'Angle', angle.toFixed(2) + "°");
  }

  function getDecimalPlaces(measure_unit) {
    return measure_unit === "m" ? 3 : 2;
  }

  return { 
    measureDistance, 
    measurePickpoint, 
    measureAngle, 
    measurePanelSwitch,
    stopMeasure,
    onEndPick,
    restoreDistance,
    restorePickpoint,
    restoreAngle
  };
}