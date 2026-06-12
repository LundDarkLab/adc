export const basePath = () => {
  return window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
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

const VALUE_PARSERS = {
  int: raw => {
    const v = parseInt(raw, 10);
    return isNaN(v) ? undefined : v;
  },
  string: raw => raw === '' ? undefined : raw,
  array: raw => {
    if (raw === '') return undefined;
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    return parts.length ? parts : undefined;
  },
  json: (raw, id) => {
    if (raw === '') return undefined;
    try { return JSON.parse(raw); }
    catch (e) { console.warn(`Invalid JSON for element ${id}:`, e); return undefined; }
  },
  function: (raw, id) => {
    if (raw === '') return undefined;
    try { return new Function('return ' + raw)(); }
    catch (e) { console.warn(`Invalid function for element ${id}:`, e); return undefined; }
  },
};

export function getValidatedValue(id, type = 'string') {
  const el = document.getElementById(id);
  if (!el) return undefined;

  const raw = el.value.trim();
  const parser = VALUE_PARSERS[type];

  if (!parser) {
    console.warn(`Unknown type '${type}' for element ${id}`);
    return undefined;
  }

  return parser(raw, id);
}

// Debounce: esegue fn solo dopo "delay" ms dall'ultimo evento
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
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

// previene attacchi xss
export function sanitizeInput(str) {
  return str
    .trim()
    .replaceAll(/[<>"'`]/g, '')  // rimuove caratteri HTML/JS injection
    .toLowerCase();
}

// replace spaces with underscores and remove special characters
export function sanitizeString(title) {
  return title.replaceAll(/\s+/g, '_').replaceAll(/[^a-zA-Z0-9_-]/g, '');
}

export function escapeHTML(str) {
  return String(str)
    .replaceAll('&', "&amp;")
    .replaceAll('<', "&lt;")
    .replaceAll('>', "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, function(c) {
    const r = Math.trunc(Math.random() * 16), v = c == 'x' ? r : (r & 0x3 | 0x8);
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
    throw new TypeError('Invalid input: keys and array must be arrays');
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
  if (navigator.userAgentData?.platform) {
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
