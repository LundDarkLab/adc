import { buildFormData } from './buildFormData.js';
import { fetchApi } from './fetch.js';
import { bsAlert } from '../../components/bsComponents.js';

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
 * @param {boolean} options.showAlerts - Mostra alert automatici (default: true)
 * @param {string} options.successMessage - Messaggio di successo custom
 * @param {string} options.errorMessage - Messaggio di errore custom
 * @param {boolean} options.resetOnSuccess - Reset form dopo successo (default: true)
 * @param {boolean} options.useFormData - Usa FormData invece di JSON (default: false)
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

  // Validazione parametri obbligatori
  if (!className || !action) {
    console.error('Parameters "class" and "action" are required');
    return () => {};
  }

  const submitHandler = async (e) => {
    e.preventDefault();

    // 1. Validazione HTML5
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }

    // 2. Validazione custom
    if (customValidation && !customValidation(formEl)) {
      return;
    }

    // 3. Disabilita submit button
    const submitBtn = formEl.querySelector('[type="submit"]');
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    try {
      // 4. Prepara dati
      let data = buildFormData(formEl, formOptions);

       // 5. Converti '' a null se abilitato
      if (convertEmptyStringsToNull) {
        const convertEmptyToNull = (obj) => {
          for (let key in obj) {
            if (obj[key] === '') {
              obj[key] = null;
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              convertEmptyToNull(obj[key]);
            }
          }
        };
        convertEmptyToNull(data);
      }
      
      // 6. Modifica dati se necessario (es: aggiungere array)
      if (beforeSubmit) {
        data = beforeSubmit(data);
      }

      // 7. Aggiungi class e action per l'endpoint
      data.class = className;
      data.action = action;

      // 8. Invia dati
      let result;

      // Per upload file - usa FormData con fetch nativo
      if (useFormData) {
        const formData = new FormData();
        
        // Aggiungi class e action
        formData.append('class', className);
        formData.append('action', action);
        
        // Aggiungi dati del form
        Object.entries(data).forEach(([table, fields]) => {
          if (table === 'class' || table === 'action') return; // Già aggiunti
          
          Object.entries(fields).forEach(([field, value]) => {
            const key = `${table}[${field}]`;
            if (Array.isArray(value)) {
              value.forEach(v => formData.append(`${key}[]`, v));
            } else {
              formData.append(key, value);
            }
          });
        });
        
        const endpoint = url || formEl.action || '';
        const fetchOptions = { method: method || 'POST', body: formData };
        
        // Aggiungi headers se forniti (es: Authorization)
        if (headers) {
          fetchOptions.headers = headers;
        }
        result = await fetch(endpoint, fetchOptions).then(r => r.json());
      } else {
        // Default - usa fetchApi con JSON (usa ENDPOINT e POST di default)
        const fetchOptions = { body: data };
        // Aggiungi url solo se fornito
        if (url) { fetchOptions.url = url; }
        // Aggiungi method solo se fornito
        if (method) { fetchOptions.method = method; }
        // Aggiungi headers solo se forniti (es: JWT Bearer)
        if (headers) {fetchOptions.headers = headers;}

        result = await fetchApi(fetchOptions);
      }

      // 9. Success
      if (resetOnSuccess) { formEl.reset(); }
      if (onSuccess) { onSuccess(result); }
    } catch (error) {
      // 10. Error
      if (onError) { onError(error); }
    } finally {
      // 11. Riabilita submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  };

  formEl.addEventListener('submit', submitHandler);

  return () => {
    formEl.removeEventListener('submit', submitHandler);
  };
}

/**
 * Versione semplificata per uso rapido
 */
export function quickFormSubmit(form, className, action, onSuccess) {
  return handleFormSubmit(form, { class: className, action, onSuccess });
}