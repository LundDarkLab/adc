import { BLOCKED_EXTENSIONS } from '../config.js';

/**
 * @param {File} file
 * @throws {SecurityError} — errore custom, vedi nota sotto
 */
export function checkExtension(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    throw new Error(`Estensione non permessa: "${ext}"`); // vedi nota
  }
}