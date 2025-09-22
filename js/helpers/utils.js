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