export function bsAlert(message, type, delay = 2000, callback = null) {
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

export function bsConfirm(message, onConfirm, onCancel = null) {
  let modalContainer = document.getElementById("modal-container");
  if (!modalContainer) {
    modalContainer = document.createElement("div");
    modalContainer.id = "modal-container";
    document.body.appendChild(modalContainer);
  }

  const modalId = `modal-${Date.now()}`;
  const modalHTML = `
    <div class="modal fade" id="${modalId}" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="${modalId}-label">Please Confirm</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">${message}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="${modalId}-confirm">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  `;

  modalContainer.innerHTML = modalHTML;

  const modalElement = document.getElementById(modalId);
  const modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();

  modalElement.addEventListener("hidden.bs.modal", () => {
    modalElement.remove();
    if (typeof onCancel === "function") { onCancel(); }
  });

  document.getElementById(`${modalId}-confirm`).addEventListener("click", () => {
    modalInstance.hide();
    if (typeof onConfirm === "function") { onConfirm(); }
  });
}

export function bsTooltips(selector = '[data-bs-toggle="tooltip"]') {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll(selector));
  tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    new bootstrap.Tooltip(tooltipTriggerEl, {trigger:'focus', html: true });
  });
}