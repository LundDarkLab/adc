export function initSection(presenter, VIEWER_STATE,DEFAULT_VIEWER_STATE) {

  function sectionListener(event) {      
    const planeToggles = document.getElementsByClassName('planeToggle');
    [...planeToggles].forEach(toggle => {
      toggle.addEventListener('click', function() {
        const plane = this.id.charAt(0); // x, y, o z
        const index = plane === 'x' ? 0 : plane === 'y' ? 1 : 2;
        VIEWER_STATE.clipping[index] = !VIEWER_STATE.clipping[index];
        setSections();
      });
    });  

    const planeFlips = document.getElementsByClassName('planeFlip');
    [...planeFlips].forEach(flip => {
      flip.addEventListener('click', function() {
        const plane = this.id.charAt(0);
        const index = plane === 'x' ? 0 : plane === 'y' ? 1 : 2;
        VIEWER_STATE.clippingDir[index] = this.checked ? -1 : 1;
        setSections();
      });
    });

    const planeRanges = document.getElementsByClassName('planeRange');
    [...planeRanges].forEach(range => {
      range.addEventListener('input', function() {
        const plane = this.id.charAt(0);
        const index = plane === 'x' ? 0 : plane === 'y' ? 1 : 2;
        if (!VIEWER_STATE.clipping[index]) { VIEWER_STATE.clipping[index] = true; }
        VIEWER_STATE.clippingPoint[index] = parseFloat(this.value);
        setSections();
      });
    });

    const showPlane = document.getElementById('showPlane');
    if(showPlane) {
      showPlane.addEventListener('click', function() {
        VIEWER_STATE.clippingRender[0] = this.checked;
        setSections();
      });
    }

    const showBorder = document.getElementById('showBorder');
    if(showBorder) {
      showBorder.addEventListener('click', function() {
        VIEWER_STATE.clippingRender[1] = this.checked;
        setSections();
      });
    }

    const sectionResetBtn = document.getElementById('sectionReset');
    if(sectionResetBtn) {
      sectionResetBtn.addEventListener('click', () => sectionReset());
    }

    const sectionTool = document.getElementsByClassName('sectionTool');
    if (sectionTool && sectionTool.length > 0) {
      for (let i = 0; i < sectionTool.length; i++) {
        sectionTool[i].addEventListener('change', function() {
          sectionToolShow(this.checked);
        });
      }
    }
  }

  function sectionToolShow(state) {
    if(state){
      document.getElementById('sections-box').classList.remove('d-none');      
      setSections();
    }else{
      document.getElementById('sections-box').classList.add('d-none');
      presenter.setClippingXYZ(0, 0, 0);
      VIEWER_STATE.clipping = [false, false, false];
    }
  }

  function setSections(){
    // update rendering in presenter
    presenter.setClippingX(VIEWER_STATE.clipping[0]?VIEWER_STATE.clippingDir[0]:0);
    presenter.setClippingY(VIEWER_STATE.clipping[1]?VIEWER_STATE.clippingDir[1]:0);
    presenter.setClippingZ(VIEWER_STATE.clipping[2]?VIEWER_STATE.clippingDir[2]:0);

    presenter.setClippingPointX(VIEWER_STATE.clippingPoint[0]); 
    presenter.setClippingPointY(VIEWER_STATE.clippingPoint[1]); 
    presenter.setClippingPointZ(VIEWER_STATE.clippingPoint[2]);

    presenter.setClippingRendermode(VIEWER_STATE.clippingRender[0], VIEWER_STATE.clippingRender[1]);

    presenter.repaint();

    // update interface
    const xPlaneToggle = document.getElementById('xPlaneToggle');
    const yPlaneToggle = document.getElementById('yPlaneToggle');
    const zPlaneToggle = document.getElementById('zPlaneToggle');
    xPlaneToggle.src = VIEWER_STATE.clipping[0]?'img/ico/sectionX_on.png':'img/ico/sectionX_off.png';
    yPlaneToggle.src = VIEWER_STATE.clipping[1]?'img/ico/sectionY_on.png':'img/ico/sectionY_off.png';
    zPlaneToggle.src = VIEWER_STATE.clipping[2]?'img/ico/sectionZ_on.png':'img/ico/sectionZ_off.png';

    const xPlaneRange = document.getElementById('xPlaneRange');
    const yPlaneRange = document.getElementById('yPlaneRange');
    const zPlaneRange = document.getElementById('zPlaneRange');

    xPlaneRange.value = VIEWER_STATE.clippingPoint[0];
    yPlaneRange.value = VIEWER_STATE.clippingPoint[1];
    zPlaneRange.value = VIEWER_STATE.clippingPoint[2];

    const xPlaneFlip = document.getElementById('xPlaneFlip');
    const yPlaneFlip = document.getElementById('yPlaneFlip');
    const zPlaneFlip = document.getElementById('zPlaneFlip');
    xPlaneFlip.checked = VIEWER_STATE.clippingDir[0]==-1;
    yPlaneFlip.checked = VIEWER_STATE.clippingDir[1]==-1;
    zPlaneFlip.checked = VIEWER_STATE.clippingDir[2]==-1;

    const showPlane = document.getElementById('showPlane');
    const showEdges = document.getElementById('showBorder');
    showPlane.checked = VIEWER_STATE.clippingRender[0];
    showEdges.checked = VIEWER_STATE.clippingRender[1];

    togglePlanesEdgesTool();  
  }

  function sectionReset(){
    VIEWER_STATE.clipping = DEFAULT_VIEWER_STATE.clipping.slice();
    VIEWER_STATE.clippingDir = DEFAULT_VIEWER_STATE.clippingDir.slice();
    VIEWER_STATE.clippingPoint = DEFAULT_VIEWER_STATE.clippingPoint.slice();
    VIEWER_STATE.clippingRender = DEFAULT_VIEWER_STATE.clippingRender.slice();
    setSections();
  }

  function togglePlanesEdgesTool(){
    const planesEdgesDiv = document.getElementById('planesEdgesDiv');
    if (VIEWER_STATE.clipping[0] || VIEWER_STATE.clipping[1] || VIEWER_STATE.clipping[2]){
      planesEdgesDiv.classList.remove('invisible');
    }
    else{
      planesEdgesDiv.classList.add('invisible');
    }
  }

  sectionListener();

  return {
    setSections,
    sectionReset
  };

}