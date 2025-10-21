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

export function cutString(str, len) { return str.length > len ? str.slice(0, len) + '…' : str; }

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