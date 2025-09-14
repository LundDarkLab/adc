export function bsToast(message, type, delay = 2000, callback = null) {
  // Crea il container se non esiste
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container position-fixed top-0 start-50 translate-middle-x p-3";
    document.body.appendChild(toastContainer);
  }

  const toastId = `toast-${Date.now()}`;
  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${delay}">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.innerHTML = toastHTML;

  const toastElement = document.getElementById(toastId);
  const toastInstance = new bootstrap.Toast(toastElement, { delay: delay });
  toastInstance.show();
  toastElement.addEventListener("hidden.bs.toast", () => { 
    toastElement.remove(); 
    if (typeof callback === "function") { callback(); }
    if (!toastContainer.hasChildNodes()) {
      toastContainer.remove();
    }
  });
}