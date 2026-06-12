import { buildFormData, buildFormDataForSubmit } from './buildFormData.js';
import { fetchApi } from './fetch.js';

/**
 * Gestisce il submit di un form con validazione e invio dati
 * @param {HTMLFormElement|string} form - Il form o selettore CSS
 * @param {Object} options - Opzioni di configurazione
 * @param {string} options.class - Nome della classe PHP (es: 'Artifact')
 * @param {string} options.action - Nome del metodo PHP (es: 'addArtifact')
 * @param {string} options.url - URL di destinazione (opzionale, usa ENDPOINT di default)
 * @param {string} options.method - Metodo HTTP (opzionale, default: POST)
 * @param {Object} options.headers - Headers HTTP custom (opzionale, es: JWT Bearer token)
 * @param {Function} options.onSuccess - Callback in caso di successo (riceve data)
 * @param {Function} options.onError - Callback in caso di errore (riceve error)
 * @param {Function} options.customValidation - Validazione custom aggiuntiva
 * @param {Function} options.beforeSubmit - Modifica i dati prima dell'invio (riceve data, deve restituire data)
 * @param {Object} options.formOptions - Opzioni per buildFormData
 * @param {boolean} options.resetOnSuccess - Reset form dopo successo (default: true)
 * @param {boolean} options.useFormData - Usa FormData invece di JSON (default: false)
 * @param {boolean} options.convertEmptyStringsToNull - Converti '' a null (default: true)
 * @returns {Function} Funzione di cleanup per rimuovere listener
 */
export function handleFormSubmit(form, options = {}) {
  const {
    class: className,
    action,
    url = null,
    method = null,
    headers = null,
    onSuccess,
    onError,
    customValidation,
    beforeSubmit,
    formOptions = {},
    resetOnSuccess = true,
    useFormData = false,
    convertEmptyStringsToNull = true
  } = options;

  const formEl = typeof form === 'string' ? document.querySelector(form) : form;

  if (!formEl) {
    console.error('Form not found');
    return () => {};
  }

  if (!className || !action) {
    console.error('Parameters "class" and "action" are required');
    return () => {};
  }

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }

    if (customValidation && !customValidation(formEl)) {
      return;
    }

    const submitBtn = formEl.querySelector('[type="submit"]');
    const originalText = submitBtn?.textContent;
    _setSubmitLoading(submitBtn);

    try {
      let data = _prepareData({ formEl, useFormData, formOptions, className, action, convertEmptyStringsToNull });

      if (beforeSubmit) {
        const result = await _applyBeforeSubmit(beforeSubmit, data);
        if (result.abort) return; // finally ripristina il bottone
        data = result.data;
      }

      const fetchResult = await fetchApi(_buildFetchOptions({ body: data, url, method, headers }));

      if (resetOnSuccess) formEl.reset();
      if (onSuccess) onSuccess(fetchResult);
    } catch (error) {
      if (onError) onError(error);
    } finally {
      _restoreSubmit(submitBtn, originalText);
    }
  };

  formEl.addEventListener('submit', submitHandler);
  return () => formEl.removeEventListener('submit', submitHandler);
}

function _prepareData({ formEl, useFormData, formOptions, className, action, convertEmptyStringsToNull }) {
  if (useFormData) {
    const data = buildFormDataForSubmit(formEl, formOptions);
    if (!data.has('class')) data.append('class', className);
    if (!data.has('action')) data.append('action', action);
    return data;
  }

  const data = buildFormData(formEl, formOptions);
  data.class = className;
  data.action = action;
  if (convertEmptyStringsToNull) _convertEmptyToNull(data);
  return data;
}

async function _applyBeforeSubmit(beforeSubmit, data) {
  const result = await beforeSubmit(data);
  if (result === false) return { abort: true, data };
  if (typeof result === 'object') return { abort: false, data: result };
  return { abort: false, data };
}

function _buildFetchOptions({ body, url, method, headers }) {
  const opts = { body };
  if (url)     opts.url     = url;
  if (method)  opts.method  = method;
  if (headers) opts.headers = headers;
  return opts;
}

function _convertEmptyToNull(obj) {
  for (const key in obj) {
    if (obj[key] === '') {
      obj[key] = null;
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      _convertEmptyToNull(obj[key]);
    }
  }
}

function _setSubmitLoading(btn) {
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = 'Saving...';
}

function _restoreSubmit(btn, originalText) {
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = originalText;
}

/**
 * Versione semplificata per uso rapido
 */
export function quickFormSubmit(form, className, action, onSuccess) {
  return handleFormSubmit(form, { class: className, action, onSuccess });
}