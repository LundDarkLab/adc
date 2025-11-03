export function initLightController(presenter, VIEWER_STATE) {
  const [lightX, lightY] = VIEWER_STATE.lightDir;
  const lightCanvas = document.getElementById("lightcontroller");
  const lightBtn = document.getElementById("btLight");
  const lightingBtn = document.getElementById("btLighting");
  const canvas = document.getElementById("draw-canvas");

  function init() {
    if(!lightCanvas) { return false; };
  	resizeLightController();
    lightBtn.addEventListener("mousedown", openLightControl, false);
    lightingBtn.addEventListener("click", function() { setLighting(); }, false);
  	lightCanvas.addEventListener("touchstart", clickLightController, false);
  	lightCanvas.addEventListener("mousedown", clickLightController, false);
  	lightCanvas.addEventListener("dblclick", doubleclickLightController, false);
    lightCanvas.addEventListener("mouseup", closeLightControl, false);
    
  	canvas.addEventListener("mouseup", function () { 
  		lightCanvas.removeEventListener("mousemove", clickLightController, false); 
  		lightCanvas.removeEventListener("touchmove", clickLightController, false);
  	}, false);
  	document.addEventListener("mouseup", function () { 
  		lightCanvas.removeEventListener("mousemove", clickLightController, false);
  		lightCanvas.removeEventListener("touchmove", clickLightController, false);
  	}, false);
  	presenter.rotateLight(lightX, lightY);
  	updateLightController();	
  }

  function openLightControl(event){
    lightCanvas.width = 200;
  	lightCanvas.height = 200;	
    lightCanvas.style.display = "block";
    updateLightController();
    (event.touches) ? lightCanvas.addEventListener("touchmove", clickLightController, false) : lightCanvas.addEventListener("mousemove", clickLightController, false);
  }

  function clickLightController(event) {
    const cwidth = lightCanvas.width;
    const cheight = lightCanvas.height;
    const midpoint = [Math.floor(cwidth/2.0),Math.floor(cheight/2.0)];
    const radius = Math.min(midpoint[0],midpoint[1]);
    const XX = event.offsetX - midpoint[0];
    const YY = event.offsetY - midpoint[1];
    // check inside circle
    if((XX*XX + YY*YY) < ((radius)*(radius))) {
      const lx = (XX / radius)/2.0;
      const ly = (YY / radius)/2.0;
      VIEWER_STATE.lightDir = [lx,-ly];
      presenter.rotateLight(VIEWER_STATE.lightDir[0],VIEWER_STATE.lightDir[1]);
      updateLightController(VIEWER_STATE.lightDir[0],VIEWER_STATE.lightDir[1]);
      (event.touches) ? lightCanvas.addEventListener("touchmove", clickLightController, false) : lightCanvas.addEventListener("mousemove", clickLightController, false);
    }
  }

  function closeLightControl(){
    lightCanvas.style.display = "none";
  }
  function resizeLightController(){
  	const dim = Math.min(150, Math.min(lightCanvas.parentElement.clientWidth,lightCanvas.parentElement.clientHeight));
  	lightCanvas.width = dim;
  	lightCanvas.height = dim;	
  }
  

  function doubleclickLightController(event) {
    event.preventDefault();  
    VIEWER_STATE.lighting = !VIEWER_STATE.lighting;
    presenter.enableSceneLighting(VIEWER_STATE.lighting);
    updateLightController();
  }

  function updateLightController(xx=VIEWER_STATE.lightDir[0],yy=-VIEWER_STATE.lightDir[1]) {
  	var cwidth = lightCanvas.width;
  	var cheight = lightCanvas.height;
  	var midpoint = [Math.floor(cwidth/2.0),Math.floor(cheight/2.0)];
  	var radius = Math.min(midpoint[0],midpoint[1]);
  	var context = lightCanvas.getContext("2d");
  	context.clearRect(0, 0, cwidth, cheight);
  	var lightcolor = presenter.isSceneLightingEnabled()?"yellow":"grey";
  	context.beginPath();
  	context.arc(midpoint[0], midpoint[1], radius, 0, 2 * Math.PI, false);
  	var grd=context.createRadialGradient(midpoint[0]+(xx*(radius-3)*2),midpoint[1]+(-yy*(radius-3)*2),3,midpoint[0], midpoint[1],radius);
  	grd.addColorStop(0,lightcolor);
  	grd.addColorStop(1,"black");
  	context.fillStyle = grd;
  	context.fill();
  	context.lineWidth = 1;
  	context.strokeStyle = 'black';
  	context.stroke();
  	context.beginPath();
  	context.rect(midpoint[0]+(xx*radius*2)-1,midpoint[1]+(-yy*radius*2)-1,3,3);
  	context.lineWidth = 3;
  	context.strokeStyle = lightcolor;
  	context.stroke();
  	presenter.repaint();
  }

  function setLighting(value, lightdir) {
    if(value === undefined) value = !VIEWER_STATE.lighting;
    VIEWER_STATE.lighting = value;
    
    if(lightdir !== undefined) VIEWER_STATE.lightDir = lightdir;
    
    presenter.enableSceneLighting(value);
    if(value) {
      updateLightController(VIEWER_STATE.lightDir[0], VIEWER_STATE.lightDir[1]);
      presenter.rotateLight(VIEWER_STATE.lightDir[0], VIEWER_STATE.lightDir[1]);
    }

    if(lightingBtn){
      lightingBtn.classList.remove("btn-outline-secondary", "btn-adc-blue");
      lightingBtn.classList.add(value ? "btn-adc-blue" : "btn-outline-secondary");
    }
  }

  init();
  return { setLighting };

}