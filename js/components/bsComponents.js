/**
 * Displays a Bootstrap toast alert with a message, type, delay, and optional callback.
 * @param {string} message - The message to display in the toast.
 * @param {string} type - The Bootstrap alert type (e.g., 'success', 'danger', 'warning').
 * @param {number} [delay=2000] - The delay in milliseconds before the toast auto-hides.
 * @param {function} [callback=null] - Optional callback function to execute after the toast is hidden.
 */
export function bsAlert(message, type, delay = 2000, callback = null) {
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

/**
 * Displays a Bootstrap confirmation modal with a message and returns a Promise that resolves to true (confirm) or false (cancel/close).
 * @param {string} message - The message to display in the modal body.
 * @returns {Promise<boolean>} A Promise that resolves to true if confirmed, false if canceled or closed.
 */
export function bsConfirm(message/*, onConfirm, onCancel = null*/) {
    return new Promise((resolve) => {
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
      resolve(false);
      // if (typeof onCancel === "function") { onCancel(); }
    });
  
    document.getElementById(`${modalId}-confirm`).addEventListener("click", () => {
      modalInstance.hide();
      resolve(true);
      // if (typeof onConfirm === "function") { onConfirm(); }
    });
  });
}

/**
 * Initializes Bootstrap tooltips on elements matching the selector.
 * @param {string} [selector='[data-bs-toggle="tooltip"]'] - The CSS selector for tooltip elements.
 */
export function bsTooltips(selector = '[data-bs-toggle="tooltip"]') {
  const tooltipTriggerList = Array.prototype.slice.call(document.querySelectorAll(selector));
  const tooltips = tooltipTriggerList.map(function (tooltipTriggerEl) {
    const trigger = tooltipTriggerEl.tagName === 'BUTTON' ? 'hover' : 'hover focus';
    return new bootstrap.Tooltip(tooltipTriggerEl, {
      trigger: trigger,
      html: true,
      container: 'body',
      zIndex: 9999
    });
  });
  return tooltips;
}


/**
 * Initializes Bootstrap popovers on elements matching the selector.
 * @param {string} [selector='[data-bs-toggle="popover"]'] - The CSS selector for popover elements.
 */
export function bsPopovers(selector = '[data-bs-toggle="popover"]') {
  const popoverTriggerList = Array.prototype.slice.call(document.querySelectorAll(selector));
  const popovers = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl, {
      trigger: 'focus',
      html: true,
      container: 'body',
      zIndex: 9999
    });
  });
  return popovers;
}



/**
 * Creates a customizable Bootstrap modal with title, body, buttons, and options.
 * @param {object} options - The options for the modal.
 * @param {string} [options.title='Modal Title'] - The title of the modal.
 * @param {string} [options.body='Modal body text.'] - The body content of the modal.
 * @param {array} [options.buttons=[{ text: 'Close', class: 'btn-secondary', action: 'close' }]] - Array of button objects with text, class, and action.
 * @param {string} [options.size=''] - The size class for the modal (e.g., 'modal-lg').
 * @param {boolean|string} [options.backdrop=true] - Backdrop option ('static' for static, false for none, true for default).
 * @param {boolean} [options.keyboard=true] - Whether the modal can be closed with the keyboard.
 * @returns {Promise<string>} A Promise that resolves with the action of the clicked button or 'closed' if dismissed.
 */
export function bsModal(options = {}) {
  const {
    title = 'Modal Title',
    body = 'Modal body text.',
    buttons = [
      { text: 'Close', class: 'btn-secondary', action: 'close' }
    ],
    size = '', // e.g., 'modal-lg', 'modal-sm'
    backdrop = true,
    keyboard = true
  } = options;

  return new Promise((resolve) => {
    let modalContainer = document.getElementById("modal-container");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "modal-container";
      document.body.appendChild(modalContainer);
    }

    const modalId = `modal-${Date.now()}`;
    const sizeClass = size ? ` ${size}` : '';
    
    let backdropAttr;
    if (backdrop === 'static') {
      backdropAttr = 'data-bs-backdrop="static"';
    } else if (backdrop) {
      backdropAttr = '';
    } else {
      backdropAttr = 'data-bs-backdrop="false"';
    }
    
    const keyboardAttr = keyboard ? '' : 'data-bs-keyboard="false"';

    const buttonsHTML = buttons.map((btn, index) => {
      const btnId = `${modalId}-btn-${index}`;
      return `<button type="button" class="btn ${btn.class}" id="${btnId}">${btn.text}</button>`;
    }).join('');

    const modalHTML = `
      <div class="modal fade" id="${modalId}" ${backdropAttr} ${keyboardAttr} tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered${sizeClass}">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="${modalId}-label">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">
              ${buttonsHTML}
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
      resolve('closed');
    });

    buttons.forEach((btn, index) => {
      const btnElement = document.getElementById(`${modalId}-btn-${index}`);
      btnElement.addEventListener("click", () => {
        modalInstance.hide();
        if (typeof btn.action === 'function') {
          btn.action();
        } else {
          resolve(btn.action || btn.text);
        }
      });
    });
  });
}