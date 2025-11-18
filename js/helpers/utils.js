export const basePath = () => {
  return window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
}
export const currentPage = () => {
  return  window.location.pathname.split('/').pop();
}

export const ENDPOINT = () => {
  const path = window.location.pathname;
  let root = '/';
  if (path.includes('/prototype_dev/')) { root = '/prototype_dev/'; }
  if (path.includes('/plus/')) { root = '/plus/'; }
  const API = root + 'api/';
  return `${API}endpoint_private.php`;
};

// In js/helpers/utils.js (o crea il file se non esiste)
export function getValidatedValue(id, type = 'string') {
  const el = document.getElementById(id);
  if (!el) return undefined;

  const rawValue = el.value.trim();

  switch (type) {
    case 'int':
      const intVal = parseInt(rawValue, 10);
      return isNaN(intVal) ? undefined : intVal;

    case 'string':
      return rawValue === '' ? undefined : rawValue;

    case 'array':
      if (rawValue === '') return undefined;
      // Assume valori separati da virgola, es. "a,b,c" -> ["a", "b", "c"]
      return rawValue.split(',').map(s => s.trim()).filter(s => s !== '');

    case 'json':
      if (rawValue === '') return undefined;
      try {
        return JSON.parse(rawValue);
      } catch (e) {
        console.warn(`Invalid JSON for element ${id}:`, e);
        return undefined;
      }

    case 'function':
      // Pericoloso: eval può introdurre vulnerabilità. Usa solo se necessario e valida l'input.
      if (rawValue === '') return undefined;
      try {
        // Esempio: se rawValue è "x => x * 2", restituisci la funzione
        return new Function('return ' + rawValue)();
      } catch (e) {
        console.warn(`Invalid function for element ${id}:`, e);
        return undefined;
      }

    default:
      console.warn(`Unknown type '${type}' for element ${id}`);
      return undefined;
  }
}


export function getDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = ("0" + (d.getMonth() + 1)).slice(-2);
  const day = ("0" + d.getDate()).slice(-2);
  const hours = ("0" + d.getHours()).slice(-2);
  const minutes = ("0" + d.getMinutes()).slice(-2);
  const seconds = ("0" + d.getSeconds()).slice(-2);
  return [year, month, day, hours, minutes, seconds];
}

// replace spaces with underscores and remove special characters
export function sanitizeString(title) {
  return title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
}

export function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function cutString(str, len) { 
  return str.length > len ? str.slice(0, len) + '…' : str; 
}
export function cutStringByWords(str, maxWords = 10) {
  if (!str || typeof str !== 'string') return '';
  const words = str.trim().split(/\s+/);
  if (words.length <= maxWords) return str;
  return words.slice(0, maxWords).join(' ') + '...';
}

export const groupBy = (keys, separator = '-') => array => {
  if (!Array.isArray(keys) || !Array.isArray(array)) {
    throw new Error('Invalid input: keys and array must be arrays');
  }
  return array.reduce((objectsByKeyValue, obj) => {
    if (obj == null) return objectsByKeyValue; // Salta oggetti null/undefined
    const value = keys.map(key => obj[key] ?? '').join(separator); // Usa '' per valori mancanti
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
    return objectsByKeyValue;
  }, {});
};

export function isIOS() {
  // Controllo moderno: usa navigator.userAgentData se disponibile
  if (navigator.userAgentData && navigator.userAgentData.platform) {
    return navigator.userAgentData.platform === 'iOS';
  }
  // Fallback: regex semplificata su userAgent (per browser vecchi, evita navigator.platform deprecata)
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !/MSStream/.test(navigator.userAgent);
}

export function isMobile() {
  // Controllo moderno: usa navigator.userAgentData.mobile se disponibile
  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
    return navigator.userAgentData.mobile;
  }
  // Fallback: regex semplificata su userAgent (per browser vecchi, senza navigator.vendor deprecato)
  return /Mobi|Android/i.test(navigator.userAgent) || /iPad|iPhone|iPod/.test(navigator.userAgent);
}
