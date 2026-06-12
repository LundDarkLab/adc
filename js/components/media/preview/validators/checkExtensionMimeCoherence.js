// Mappa estensione → MIME types accettabili
const EXTENSION_MIME_MAP = Object.freeze({
  '.jpg':  ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png':  ['image/png'],
  '.gif':  ['image/gif'],
  '.webp': ['image/webp'],
});

/**
 * @param {File} file
 * @throws {TypeError}
 */
export function checkExtensionMimeCoherence(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const allowedMimes = EXTENSION_MIME_MAP[ext];

  if (!allowedMimes) return; // estensione non mappata, skip

  if (!allowedMimes.includes(file.type)) {
    throw new TypeError(
      `L'estensione "${ext}" non è compatibile con il tipo MIME dichiarato "${file.type}".`
    );
  }
}