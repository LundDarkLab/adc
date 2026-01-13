/**
 * Costruisce un oggetto dati strutturato dai campi del form con attributo data-table
 * @param {HTMLElement|string} container - Il form o contenitore, o un selettore CSS
 * @param {Object} options - Opzioni di configurazione
 * @param {boolean} options.includeDisabled - Include campi disabilitati (default: false)
 * @param {boolean} options.includeEmpty - Include campi vuoti (default: false)
 * @param {string} options.dataAttribute - Nome dell'attributo data (default: 'table')
 * @returns {Object} Oggetto con struttura {tabella: {campo: valore}}
 */
export function buildFormData(container = document, options = {}) {
  const {
    includeDisabled = false,
    includeEmpty = false,
    dataAttribute = 'table'
  } = options;

  const selector = `[data-${dataAttribute}]`;
  const containerEl = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;

  if (!containerEl) {
    console.warn('Container not found');
    return {};
  }

  const elements = containerEl.querySelectorAll(selector);
  const data = {};

  elements.forEach(element => {
    // Salta elementi disabilitati se non richiesti
    if (!includeDisabled && element.disabled) {
      return;
    }

    const table = element.dataset[dataAttribute];
    const fieldId = element.id || element.name;

    if (!table || !fieldId) {
      console.warn('Element missing data-table or id/name:', element);
      return;
    }

    let value = null;

    // Gestione checkbox e radio
    if (element.type === 'checkbox') {
      value = element.checked ? 1 : 0;
    } else if (element.type === 'radio') {
      if (!element.checked) return;
      value = element.value;
    } 
    // Gestione select multiple
    else if (element.type === 'select-multiple') {
      value = Array.from(element.selectedOptions).map(opt => opt.value);
      if (!includeEmpty && value.length === 0) return;
    }
    // Altri input
    else {
      value = element.value;
      // Salta valori vuoti se non richiesti
      if (!includeEmpty && !value) {
        return;
      }
    }

    // Inizializza la struttura se non esiste
    if (!data[table]) {
      data[table] = {};
    }

    data[table][fieldId] = value;
  });

  return data;
}

/**
 * Versione semplificata che restituisce un array flat
 * @param {HTMLElement|string} container 
 * @param {Object} options 
 * @returns {Array} Array di oggetti {table, field, value}
 */
export function buildFormDataFlat(container = document, options = {}) {
  const data = buildFormData(container, options);
  const flatData = [];

  Object.entries(data).forEach(([table, fields]) => {
    Object.entries(fields).forEach(([field, value]) => {
      flatData.push({ table, field, value });
    });
  });

  return flatData;
}

/**
 * Converte i dati in FormData per invio multipart
 * @param {HTMLElement|string} container 
 * @param {Object} options 
 * @returns {FormData}
 */
export function buildFormDataForSubmit(container = document, options = {}) {
  const data = buildFormData(container, options);
  const formData = new FormData();

  Object.entries(data).forEach(([table, fields]) => {
    Object.entries(fields).forEach(([field, value]) => {
      const key = `${table}[${field}]`;
      if (Array.isArray(value)) {
        value.forEach(v => formData.append(`${key}[]`, v));
      } else {
        formData.append(key, value);
      }
    });
  });

  return formData;
}

/**
 * Converte i dati in JSON per invio API
 * @param {HTMLElement|string} container 
 * @param {Object} options 
 * @returns {string}
 */
export function buildFormDataJSON(container = document, options = {}) {
  const data = buildFormData(container, options);
  return JSON.stringify(data);
}