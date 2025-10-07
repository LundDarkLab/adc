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