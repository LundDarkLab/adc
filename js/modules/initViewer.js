import { isIOS, isMobile } from '../../js/helpers/utils.js';

// Factory function: init3dhop
function init3dhop(presenter) {
  if (isIOS()) document.head.insertAdjacentHTML('beforeend', '<meta name="viewport" content="width=device-width">');

  let interval, id, ismousedown;
  let button = 0;
  document.querySelectorAll('#toolbar button').forEach(btn => {
    btn.addEventListener('click', e => {
      let id = e.target.id;
      if (id === 'light_on') {
        e.target.id = 'light';
        e.target.title = 'disable light control';
        e.target.querySelector('i').classList.add('text-warning');
      }
      if (id === 'light') {
        e.target.id = 'light_on';
        e.target.title = 'enable light control';
        e.target.querySelector('i').classList.remove('text-warning');
      }
      if (id === 'full_on') {
        e.target.id = 'full';
        e.target.title = 'exit full screen';
        const i = e.target.querySelector('i');
        i.classList.toggle('fa-expand');
        i.classList.toggle('fa-compress');
      }
      if (id === 'full') {
        e.target.id = 'full_on';
        e.target.title = 'full screen';
        const i = e.target.querySelector('i');
        i.classList.toggle('fa-compress');
        i.classList.toggle('fa-expand');
      }
      actionsToolbar(id);
    });
  });

  document.querySelectorAll('.output-table td').forEach(td => {
    if (td.querySelector('.output-text, .output-input')) {
      td.style.borderRadius = '5px';
      td.style.backgroundColor = 'rgba(125,125,125,0.25)';
    }
  });

  const hop = document.getElementById('3dhop');
  hop.addEventListener('touchstart', () => {
    document.querySelectorAll('#toolbar img').forEach(img => img.style.opacity = '0.5');
  });
  hop.addEventListener('pointerdown', () => {
    document.querySelectorAll('#toolbar img').forEach(img => img.style.opacity = '0.5');
  });
  hop.addEventListener('touchend', () => {
    clearInterval(interval);
  });
  hop.addEventListener('touchmove', () => {
    clearInterval(interval);
    document.querySelectorAll('#toolbar img').forEach(img => img.style.opacity = '0.5');
  });

  const canvas = document.getElementById('draw-canvas');
  canvas.addEventListener('contextmenu', e => {
    if (!isMobile()) e.preventDefault();
  });
  canvas.addEventListener('touchstart', () => {
    document.querySelectorAll('#toolbar img').forEach(img => img.style.opacity = '0.5');
  });
  canvas.addEventListener('pointerdown', () => {
    document.querySelectorAll('#toolbar img').forEach(img => img.style.opacity = '0.5');
  });
  canvas.addEventListener('mousedown', e => {
    document.querySelectorAll('#toolbar img').forEach(img => img.style.opacity = '0.5');
    e.preventDefault();
    if (window.getSelection) window.getSelection().removeAllRanges();
    else if (document.selection) document.selection.empty();
  });

  ['MSFullscreenChange', 'mozfullscreenchange', 'webkitfullscreenchange'].forEach(event => {
    document.addEventListener(event, () => {
      if (!document.msFullscreenElement && !document.mozFullScreen && !document.webkitIsFullScreen) exitFullscreen();
    });
  });

  if (window.navigator.userAgent.includes('Trident/')) { // IE fullscreen handler
    document.getElementById('full').addEventListener('click', enterFullscreen);
    document.getElementById('full_on').addEventListener('click', exitFullscreen);
  }

  window.addEventListener('resize', () => {
    if (!presenter._resizable) return;

    let width, height;

    if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
      width = Math.max(document.documentElement.clientWidth, window.innerWidth);
      height = window.innerHeight;
    } else {
      const hopParent = document.getElementById('3dhop').parentElement;
      width = hopParent.offsetWidth;
      height = hopParent.offsetHeight;
    }

    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    const hopEl = document.getElementById('3dhop');
    hopEl.style.width = width + 'px';
    hopEl.style.height = height + 'px';

    presenter.ui.postDrawEvent();
  });

  document.querySelectorAll('.close').forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.querySelectorAll('.close').forEach(c => c.style.display = 'none');
      document.querySelectorAll('.close_on').forEach(c => c.style.display = 'inline');
    });
  });
  document.querySelectorAll('.close_on').forEach(el => {
    el.addEventListener('mouseleave', () => {
      document.querySelectorAll('.close_on').forEach(c => c.style.display = 'none');
      document.querySelectorAll('.close').forEach(c => c.style.display = 'inline');
    });
  });

  const hopEl = document.getElementById('3dhop');
  const hopParent = hopEl.parentElement;
  canvas.setAttribute('width', hopParent.offsetWidth);
  canvas.setAttribute('height', hopParent.offsetHeight);
  hopEl.style.width = hopParent.offsetWidth + 'px';
  hopEl.style.height = hopParent.offsetHeight + 'px';

  // Restituisce l'oggetto con tutte le funzioni (factory pattern)
  return {
    lightSwitch,
    lightingSwitch,
    hotspotSwitch,
    pickpointSwitch,
    colorSwitch,
    cameraSwitch,
    helpSwitch,
    sectiontoolSwitch,
    sectiontoolInit,
    isIOS,
    isMobile
  };
}

function lightSwitch(on) {
  if(on === undefined) on = presenter.isLightTrackballEnabled();
}

function lightingSwitch(on) {
  if (on === undefined) on = presenter.isSceneLightingEnabled();

  if (on) {
    document.getElementById('lighting_off').style.visibility = 'hidden';
    document.getElementById('lighting').style.visibility = 'visible';
  } else {
    document.getElementById('lighting').style.visibility = 'hidden';
    document.getElementById('lighting_off').style.visibility = 'visible';
    document.getElementById('light_on').style.visibility = 'hidden'; // manage light combined interface
    document.getElementById('light').style.visibility = 'visible'; // manage light combined interface
  }
}

function hotspotSwitch(on) {
  if (on === undefined) on = presenter.isSpotVisibilityEnabled();

  if (on) {
    document.getElementById('hotspot').style.visibility = 'hidden';
    document.getElementById('hotspot_on').style.visibility = 'visible';
  } else {
    document.getElementById('hotspot_on').style.visibility = 'hidden';
    document.getElementById('hotspot').style.visibility = 'visible';
  }
}

function pickpointSwitch(on) {
  if (on === undefined) on = presenter.isPickpointModeEnabled();

  if (on) {
    document.getElementById('pick').style.visibility = 'hidden';
    document.getElementById('pick_on').style.visibility = 'visible';
    document.getElementById('pickpoint-box').style.display = 'table';
    document.getElementById('draw-canvas').style.cursor = 'crosshair';
  } else {
    if (window.getSelection) window.getSelection().removeAllRanges();
    else if (document.selection) document.selection.empty();
    document.getElementById('pick_on').style.visibility = 'hidden';
    document.getElementById('pick').style.visibility = 'visible';
    document.getElementById('pickpoint-box').style.display = 'none';
    document.getElementById('pickpoint-output').innerHTML = '[ 0 , 0 , 0 ]';
    if (!presenter.isAnyMeasurementEnabled()) document.getElementById('draw-canvas').style.cursor = 'default';
  }
}

function colorSwitch(on) {
  if (on === undefined) on = document.getElementById('color').style.visibility === 'visible';

  if (on) {
    document.getElementById('color').style.visibility = 'hidden';
    document.getElementById('color_on').style.visibility = 'visible';
  } else {
    document.getElementById('color_on').style.visibility = 'hidden';
    document.getElementById('color').style.visibility = 'visible';
  }
}

function cameraSwitch(on) {
  if (on === undefined) on = document.getElementById('perspective').style.visibility === 'visible';

  if (on) {
    document.getElementById('perspective').style.visibility = 'hidden';
    document.getElementById('orthographic').style.visibility = 'visible';
  } else {
    document.getElementById('orthographic').style.visibility = 'hidden';
    document.getElementById('perspective').style.visibility = 'visible';
  }
}

function helpSwitch(on) {
  if (on === undefined) on = document.getElementById('help').style.visibility === 'visible';

  if (on) {
    document.getElementById('help').style.visibility = 'hidden';
    document.getElementById('help_on').style.visibility = 'visible';
  } else {
    document.getElementById('help_on').style.visibility = 'hidden';
    document.getElementById('help').style.visibility = 'visible';
  }
}

function sectiontoolSwitch(on) {
  if (on === undefined) on = document.getElementById('sections').style.visibility === 'visible';

  if (on) {
    document.getElementById('sections').style.visibility = 'hidden';
    document.getElementById('sections_on').style.visibility = 'visible';
    document.getElementById('sections-box').style.display = 'table';
    document.querySelectorAll('#xplane, #yplane, #zplane').forEach(el => el.style.visibility = 'visible');
  } else {
    document.getElementById('sections_on').style.visibility = 'hidden';
    document.getElementById('sections').style.visibility = 'visible';
    document.getElementById('sections-box').style.display = 'none';
    document.querySelectorAll('#sections-box img').forEach(img => img.style.visibility = 'hidden');
    presenter.setClippingXYZ(0, 0, 0);
  }
}

function sectiontoolInit() {
  // set sections value
  presenter.setClippingPointXYZ(0.5, 0.5, 0.5);

  // set sliders
  const xplaneSlider = document.getElementById('xplaneSlider');
  xplaneSlider.min = 0.0;
  xplaneSlider.max = 1.0;
  xplaneSlider.step = 0.01;
  xplaneSlider.defaultValue = 0.5;
  xplaneSlider.oninput = () => { sectionxSwitch(true); presenter.setClippingPointX(xplaneSlider.valueAsNumber); };
  xplaneSlider.onchange = () => { sectionxSwitch(true); presenter.setClippingPointX(xplaneSlider.valueAsNumber); };

  const yplaneSlider = document.getElementById('yplaneSlider');
  yplaneSlider.min = 0.0;
  yplaneSlider.max = 1.0;
  yplaneSlider.step = 0.01;
  yplaneSlider.defaultValue = 0.5;
  yplaneSlider.oninput = () => { sectionySwitch(true); presenter.setClippingPointY(yplaneSlider.valueAsNumber); };
  yplaneSlider.onchange = () => { sectionySwitch(true); presenter.setClippingPointY(yplaneSlider.valueAsNumber); };

  const zplaneSlider = document.getElementById('zplaneSlider');
  zplaneSlider.min = 0.0;
  zplaneSlider.max = 1.0;
  zplaneSlider.step = 0.01;
  zplaneSlider.defaultValue = 0.5;
  zplaneSlider.oninput = () => { sectionzSwitch(true); presenter.setClippingPointZ(zplaneSlider.valueAsNumber); };
  zplaneSlider.onchange = () => { sectionzSwitch(true); presenter.setClippingPointZ(zplaneSlider.valueAsNumber); };

  // set checkboxes
  const xplaneFlip = document.getElementById('xplaneFlip');
  xplaneFlip.defaultChecked = false;
  xplaneFlip.onchange = function() {
    if (presenter.getClippingX() !== 0) {
      if (this.checked) presenter.setClippingX(-1);
      else presenter.setClippingX(1);
    }
  };

  const yplaneFlip = document.getElementById('yplaneFlip');
  yplaneFlip.defaultChecked = false;
  yplaneFlip.onchange = function() {
    if (presenter.getClippingY() !== 0) {
      if (this.checked) presenter.setClippingY(-1);
      else presenter.setClippingY(1);
    }
  };

  const zplaneFlip = document.getElementById('zplaneFlip');
  zplaneFlip.defaultChecked = false;
  zplaneFlip.onchange = function() {
    if (presenter.getClippingZ() !== 0) {
      if (this.checked) presenter.setClippingZ(-1);
      else presenter.setClippingZ(1);
    }
  };

  const planesCheck = document.getElementById('showPlane');
  planesCheck.defaultChecked = presenter.getClippingRendermode()[0];
  planesCheck.onchange = function() { presenter.setClippingRendermode(this.checked, presenter.getClippingRendermode()[1]); };

  const edgesCheck = document.getElementById('showBorder');
  edgesCheck.defaultChecked = presenter.getClippingRendermode()[1];
  edgesCheck.onchange = function() { presenter.setClippingRendermode(presenter.getClippingRendermode()[0], this.checked); };
}

// Esporta la factory come named export
export { init3dhop };