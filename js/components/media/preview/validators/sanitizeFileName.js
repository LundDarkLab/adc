/**
 * Rimuove caratteri pericolosi dal nome del file.
 * Non modifica il File object (immutabile), restituisce il nome sanificato.
 *
 * @param {File} file
 * @returns {string} nome sanificato
 * @throws {Error} se il nome risulta vuoto dopo la sanitizzazione
 */
export function sanitizeFileName(file) {
  const sanitized = file.name
    .replaceAll(/[^\w\s.-]/g, '')   // rimuove tutto tranne alfanumerici, punto, trattino, underscore
    .replaceAll(/\.{2,}/g, '.')      // blocca path traversal: "../../" → "."
    .trim();

  if (!sanitized) {
    throw new Error('Il nome del file non è valido.');
  }
  return sanitized;
}