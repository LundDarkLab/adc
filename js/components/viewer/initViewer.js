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
export { init3dhop };