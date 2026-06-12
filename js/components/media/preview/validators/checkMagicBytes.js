import { MIME_SIGNATURES, MAGIC_BYTES_LENGTH } from '../config.js';

/**
 * Legge i primi bytes del file e confronta con la firma attesa.
 * Se il tipo non è mappato in MIME_SIGNATURES, il check viene saltato.
 *
 * @param {File}   file
 * @param {string} declaredMimeType  - es. "image/jpeg"
 * @returns {Promise<void>}
 * @throws {TypeError}
 */
export async function checkMagicBytes(file, declaredMimeType) {
  const signature = MIME_SIGNATURES[declaredMimeType];
  if (!signature) return; // tipo non mappato, skip

  const buffer = await file.slice(0, MAGIC_BYTES_LENGTH).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const isValid = signature.every((byte, i) => byte === null || bytes[i] === byte);
  if (!isValid) {
    throw new TypeError(
      `Il contenuto del file non corrisponde al tipo dichiarato "${declaredMimeType}".`
    );
  }
}