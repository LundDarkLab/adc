export const MEDIA_TYPE_EXTENSIONS = Object.freeze({
  image:    ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  video:    ['.mp4', '.webm', '.ogv'],
  audio:    ['.mp3', '.wav', '.ogg', '.oga'],
  document: ['.pdf', '.doc', '.docx', '.odt', '.ods', '.odp', '.xlsx', '.pptx'],
  reference: ['.pdf', '.doc', '.docx', '.odt', '.ods', '.odp', '.xlsx', '.pptx'],
  '3d':     ['.ply', '.nxs', '.nxz', '.obj', '.zip'],
  gis:      ['.shp', '.geojson', '.zip'],
});

// ─────────────────────────────────────────────
// LIMITI DIMENSIONE (in bytes)
// ─────────────────────────────────────────────
export const SIZE_LIMITS = Object.freeze({
  image:    536870912,   // 512 MB
  video:    536870912,   // 512 MB
  audio:    536870912,   // 512 MB
  document: 536870912,   // 512 MB
  reference: 536870912,   // 512 MB
  '3d':    1073741824,   // 1 GB
  gis:      536870912,   // 512 MB  (geojson, shapefile)
});

// ─────────────────────────────────────────────
// ESTENSIONI BLOCCATE (sicurezza)
// ─────────────────────────────────────────────
export const BLOCKED_EXTENSIONS = Object.freeze([
  '.exe', '.php', '.js',  '.mjs', '.cjs', '.sh',  '.bat', '.cmd', '.ps1', '.py',  '.rb',  '.pl',  '.cgi', '.asp', '.aspx','.jsp', '.jar', '.vbs', '.wsf', '.htaccess',
]);

// ─────────────────────────────────────────────
// MAGIC BYTES
// Quanti byte leggere dal file per la verifica
// ─────────────────────────────────────────────
export const MAGIC_BYTES_LENGTH = 16;

/**
 * Firme binarie per tipo MIME.
 * null in una posizione = wildcard (byte ignorato nel confronto).
 *
 * WebP: i primi 4 bytes sono "RIFF" (condiviso con .wav),
 * per disambiguare si controllano anche i bytes 8-11 ("WEBP").
 * La firma qui copre solo i primi 4 — checkMagicBytes dovrà
 * gestire il caso WebP con logica dedicata se aggiungi audio.
 *
 * OBJ: formato testo ASCII puro, nessuna firma binaria.
 * La validazione avviene tramite sniffTextFormat.js.
 *
 * GeoJSON: JSON puro, nessuna firma binaria.
 * La validazione avviene tramite sniffTextFormat.js.
 */
export const MIME_SIGNATURES = Object.freeze({

  // — Immagini —
  'image/jpeg':               [0xFF, 0xD8, 0xFF],
  'image/png':                [0x89, 0x50, 0x4E, 0x47],
  'image/gif':                [0x47, 0x49, 0x46],
  'image/webp':               [0x52, 0x49, 0x46, 0x46], // "RIFF" — vedi nota WebP

  // — Video —
  'video/mp4':                [null, null, null, null, 0x66, 0x74, 0x79, 0x70], // "ftyp"
  'video/webm':               [0x1A, 0x45, 0xDF, 0xA3],
  'video/ogg':                [0x4F, 0x67, 0x67, 0x53], // "OggS"

  // — Audio —
  'audio/mpeg':               [0xFF, 0xFB],              // MP3
  'audio/wav':                [0x52, 0x49, 0x46, 0x46], // "RIFF" — vedi nota WebP
  'audio/ogg':                [0x4F, 0x67, 0x67, 0x53], // "OggS"

  // — Documenti —
  'application/pdf':          [0x25, 0x50, 0x44, 0x46], // "%PDF"
  'application/msword':       [0xD0, 0xCF, 0x11, 0xE0], // DOC legacy (OLE2)
  // DOCX, XLSX, ODS, ODP condividono la firma ZIP — disambiguare via checkExtensionMimeCoherence
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':       [0x50, 0x4B, 0x03, 0x04],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':[0x50, 0x4B, 0x03, 0x04],
  'application/vnd.oasis.opendocument.text':         [0x50, 0x4B, 0x03, 0x04],
  'application/vnd.oasis.opendocument.spreadsheet':  [0x50, 0x4B, 0x03, 0x04],
  'application/vnd.oasis.opendocument.presentation': [0x50, 0x4B, 0x03, 0x04],

  // — 3D —
  'model/ply':                [0x70, 0x6C, 0x79, 0x0A], // "ply\n"
  'model/nxs':                [0x4E, 0x58, 0x53, 0x20], // "NXS "
  'model/nxz':                [0x4E, 0x58, 0x5A, 0x20], // "NXZ "
  // OBJ → nessuna firma, gestito da sniffTextFormat.js

  // — Archivi (ZIP per OBJ multi-file) —
  'application/zip':          [0x50, 0x4B, 0x03, 0x04], // "PK"

  // — GIS —
  'application/x-shapefile':  [0x00, 0x00, 0x27, 0x0A],
  // GeoJSON → JSON puro, gestito da sniffTextFormat.js
});

// ─────────────────────────────────────────────
// COERENZA ESTENSIONE ↔ MIME TYPE
// ─────────────────────────────────────────────
export const EXTENSION_MIME_MAP = Object.freeze({

  // — Immagini —
  '.jpg':   ['image/jpeg'],
  '.jpeg':  ['image/jpeg'],
  '.png':   ['image/png'],
  '.gif':   ['image/gif'],
  '.webp':  ['image/webp'],

  // — Video —
  '.mp4':   ['video/mp4'],
  '.webm':  ['video/webm'],
  '.ogv':   ['video/ogg'],

  // — Audio —
  '.mp3':   ['audio/mpeg'],
  '.wav':   ['audio/wav'],
  '.oga':   ['audio/ogg'],
  '.ogg':   ['audio/ogg'],

  // — Documenti —
  '.pdf':   ['application/pdf'],
  '.doc':   ['application/msword'],
  '.docx':  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xlsx':  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.pptx':  ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  '.ods':   ['application/vnd.oasis.opendocument.spreadsheet'],
  '.odt':   ['application/vnd.oasis.opendocument.text'],
  '.odp':   ['application/vnd.oasis.opendocument.presentation'],

  // — 3D —
  '.ply':   ['model/ply'],
  '.nxs':   ['model/nxs'],
  '.nxz':   ['model/nxz'],
  '.obj':   ['text/plain', 'application/octet-stream'], // OBJ è testo, i browser lo dichiarano in modo inconsistente
  '.zip':   ['application/zip'],                        // ZIP per bundle OBJ

  // — GIS —
  '.shp':     ['application/x-shapefile', 'application/octet-stream'],
  '.shx':     ['application/x-shapefile', 'application/octet-stream'],
  '.dbf':     ['application/dbase', 'application/octet-stream'],
  '.prj':     ['text/plain', 'application/octet-stream'],
  '.cpg':     ['text/plain', 'application/octet-stream'],
  '.sbn':     ['application/octet-stream'],
  '.sbx':     ['application/octet-stream'],
  '.qpj':     ['text/plain', 'application/octet-stream'],
  '.geojson': ['application/geo+json', 'application/json', 'text/plain'],
});

// ─────────────────────────────────────────────
// CONTENUTO ATTESO NEGLI ZIP
// Usato da checkZipContents.js
// ─────────────────────────────────────────────
export const ZIP_ALLOWED_CONTENTS = Object.freeze({
  // Bundle OBJ: geometria + materiali + texture
  obj: ['.obj', '.mtl', '.jpg', '.jpeg', '.png'],

  // Bundle Shapefile: obbligatori .shp + .shx + .dbf, opzionali .prj e altri
  shapefile: ['.shp', '.shx', '.dbf', '.prj', '.cpg', '.sbn', '.sbx', '.qpj'],
});