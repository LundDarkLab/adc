import { bsConfirm } from "../components/bsComponents.js";
export async function confirmAction(message, onConfirm, onCancel = null) {
  const confirmed = await bsConfirm(message);
  if (confirmed) {
    await onConfirm();
  } else if (onCancel) {
    await onCancel();
  }
}

let loadingDiv = null;
const loadingHTML = `
  <div id="loadingDiv">
    <p class="mdi mdi-loading mdi-spin"></p>
    <p>
      <span class="dot dot1">.</span>
      <span class="dot dot2">.</span>
      <span class="dot dot3">.</span>
      Loading
    </p>
  </div>
`;
export function showLoading(show) {
  if (show) {
    if (!loadingDiv) {
      loadingDiv = document.createElement('div');
      loadingDiv.innerHTML = loadingHTML;
      document.body.appendChild(loadingDiv);
    }
  } else {
    if (loadingDiv) {
      document.body.removeChild(loadingDiv);
      loadingDiv = null;
    }
  }
}

// Carica gli script in ordine di dipendenza
export function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export function copy_to_clipboard(el) {
  const host = window.location.origin+'/'+window.location.pathname.split('/')[1]
  const element = el.split('-')[0]
  const text = document.getElementById(el).innerHTML;
  const link = host+'/'+element+'_view.php?uuid='+text
  navigator.clipboard.writeText(link);
}