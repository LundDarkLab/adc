import { SIZE_LIMITS } from '../config.js';

/**
 * @param {File}   file
 * @param {string} mediaType  - chiave di SIZE_LIMITS
 * @throws {RangeError}
 */
export function checkSize(file, mediaType) {
  const limit = SIZE_LIMITS[mediaType];
  if (limit === undefined) {
    throw new TypeError(`Tipo media non riconosciuto: "${mediaType}"`);
  }
  if (file.size > limit) {
    const limitMB = limit / 1024 / 1024;
    throw new RangeError(
      `Il file supera la dimensione massima consentita di ${limitMB}MB.`
    );
  }
}