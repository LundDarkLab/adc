// shared/mediaPreview/validators/validator.js

import { checkSize }                   from './validators/checkSize.js';
import { checkExtension }              from './validators/checkExtension.js';
import { checkExtensionMimeCoherence } from './validators/checkExtensionMimeCoherence.js';
import { checkMagicBytes }             from './validators/checkMagicBytes.js';
import { sanitizeFileName }            from './validators/sanitizeFileName.js';
import { MEDIA_TYPE_EXTENSIONS, EXTENSION_MIME_MAP } from './config.js';
import { renderDocument, renderImage, renderVideo } from './renderers/renderImage.js';

/**
 * Esegue tutti i controlli in sequenza (fail-fast).
 * Il primo check che fallisce interrompe la catena e propaga l'errore.
 *
 * Ordine dei check — dal meno costoso al più costoso:
 * 1. checkSize              → confronto numerico, O(1)
 * 2. checkExtension         → array lookup, O(n) piccolo
 * 3. checkExtensionMimeCoherence → map lookup, O(1)
 * 4. checkMagicBytes        → lettura parziale del file (I/O), asincrono
 * 5. sanitizeFileName       → regex sul nome, O(n) piccolo
 *
 * @param {File}   file
 * @param {string} mediaType  - chiave di SIZE_LIMITS ('image', 'video', '3d', ecc.)
 * @returns {Promise<string>} il nome file sanificato
 * @throws {RangeError}  se il file supera il limite di dimensione
 * @throws {Error}       se l'estensione è bloccata
 * @throws {TypeError}   se estensione e MIME type sono incoerenti
 * @throws {TypeError}   se i magic bytes non corrispondono al tipo dichiarato
 * @throws {Error}       se il nome file risulta vuoto dopo la sanitizzazione
 */
async function validateFile(file, mediaType) {
  checkSize(file, mediaType);
  checkExtension(file);
  checkExtensionMimeCoherence(file);
  await checkMagicBytes(file, file.type);
  const safeName = sanitizeFileName(file);
  return safeName;
}

/**
 * Entry point del modulo condiviso.
 * Orchestra: conferma sostituzione → validazione → render preview.
 *
 * @param {Object}      config
 * @param {File}        config.file        - Il file selezionato dall'input
 * @param {string}      config.mediaType   - Chiave di SIZE_LIMITS ('image', 'video', ecc.)
 * @param {HTMLElement} config.previewEl   - Contenitore della preview
 *
 * @returns {Promise<string>} il nome file sanificato
 * @throws {RangeError|TypeError|Error} errori di validazione — gestiti dal chiamante
 */
export async function initMediaPreview({ file, mediaType, previewEl }) {
  // Controlla se c'è già una preview attiva nel contenitore
  if (previewEl.hasChildNodes()) {
    const confirmed = window.confirm(
      'You have already selected a file. Are you sure you want to replace it?'
    );
    if (!confirmed) return;
    clearPreview(previewEl);
  }

  // validateFile è fail-fast: il primo check fallito propaga l'errore al chiamante
  const safeName = await validateFile(file, mediaType);

  // Per ora solo immagini — altri mediaType verranno aggiunti qui
  switch (mediaType) {
    case 'image':
      renderImage(file, safeName, previewEl);
      break;
    case 'video':
      renderVideo(file, safeName, previewEl);
      break;
    case 'document':
    case 'reference':
      renderDocument(file, safeName, previewEl);
      break;
    default:
      throw new TypeError(`Renderer non disponibile per il tipo "${mediaType}".`);
  }

  return safeName;
}

/**
 * Restituisce la stringa da usare nell'attributo `accept` dell'input file,
 * derivata da EXTENSION_MIME_MAP per evitare duplicazioni.
 *
 * @param {string} mediaType
 * @returns {string}  es. "image/jpeg, image/png, image/gif, image/webp"
 */
export function getAcceptString(mediaType) {
  const extensions = MEDIA_TYPE_EXTENSIONS[mediaType];
  if (!extensions) return '';

  // Per ogni estensione prende i MIME types da EXTENSION_MIME_MAP,
  // poi appiattisce e deduplica
  const mimes = extensions
    .flatMap(ext => EXTENSION_MIME_MAP[ext] ?? [])
    .filter((mime, index, self) => self.indexOf(mime) === index); // deduplica

  return mimes.join(', ');
}