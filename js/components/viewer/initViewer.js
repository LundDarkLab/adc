import { isIOS, isMobile } from "../../helpers/utils.js";

// Factory function: init3dhop
function init3dhop(isLoggedUser) {
  if (isIOS()) document.head.insertAdjacentHTML('beforeend', '<meta name="viewport" content="width=device-width">');


  const canvas = document.getElementById('draw-canvas');
  // previene bug su menù contestuale nel canvas
  canvas.addEventListener('contextmenu', e => { if (!isMobile()) e.preventDefault(); });

  const hopEl = document.getElementById('3dhop');
  const hopParent = hopEl.parentElement;
  canvas.setAttribute('width', hopParent.offsetWidth);
  canvas.setAttribute('height', hopParent.offsetHeight);
  hopEl.style.width = hopParent.offsetWidth + 'px';
  hopEl.style.height = hopParent.offsetHeight + 'px';
}

function resizeCanvas(presenter, viewerEl) {
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


function resizeCanvasNew(presenter, viewerEl) {
  if (!presenter) return;
  if (!presenter._resizable) return;

  const modelEl = document.getElementById('model') ?? document.getElementById('mainContent');
  const hopEl   = document.getElementById('3dhop');
  const canvas  = viewerEl.canvas;

  // Frame 1: rimuovi gli stili inline → il browser ricalcola il layout di #model
  hopEl.style.width  = '';
  hopEl.style.height = '';

  // Frame 2: leggi le dimensioni ora pulite e applicale
  requestAnimationFrame(() => {
    const width  = modelEl.offsetWidth;
    const height = modelEl.offsetHeight;

    hopEl.style.width  = width  + 'px';
    hopEl.style.height = height + 'px';

    canvas.setAttribute('width',  width);
    canvas.setAttribute('height', height);

    presenter.ui.postDrawEvent();
  });
}


export { init3dhop, resizeCanvas, resizeCanvasNew };