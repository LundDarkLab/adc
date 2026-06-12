import { setRequiredFields } from "../../../../features/artifact/components/media/mediaSharedUtils.js";

/**
 * @param {File}        file
 * @param {string}      safeName
 * @param {HTMLElement} previewEl
 */
export function renderImage(file, safeName, previewEl) {
  const objectUrl = URL.createObjectURL(file);
  _render({
    src:        objectUrl,
    fileName:   safeName,
    fileSize:   file.size,
    objectUrl,
    previewEl,
  });
}

export function renderVideo(file, safeName, previewEl) {
  const objectUrl = URL.createObjectURL(file);
  _render({ src: objectUrl, fileName: safeName, fileSize: file.size, objectUrl, previewEl, type: 'video' });
}

/**
 * @param {File}        file
 * @param {string}      safeName
 * @param {HTMLElement} previewEl
 */
export function renderDocument(file, safeName, previewEl) {
  const objectUrl = URL.createObjectURL(file);

  previewEl.innerHTML = '';

  const p = document.createElement('p');
  p.classList.add('mb-1');
  p.textContent = 'Check the selected file:';
  previewEl.appendChild(p);

  const div = document.createElement('div');
  div.id = 'documentLinkWrapper';
  div.className = 'btn-group btn-group-sm';
  div.setAttribute('role', 'group');
  previewEl.appendChild(div);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-danger';
  removeBtn.setAttribute('aria-label', 'Remove selected file');
  removeBtn.title = 'Remove selected file';
  removeBtn.innerHTML = '<i class="mdi mdi-close"></i>';
  removeBtn.addEventListener('click', () => { removeBtnListener(previewEl, 'document'); });
  div.appendChild(removeBtn);

  const a = document.createElement('a');
  a.href = objectUrl;
  a.textContent = `${safeName} (${formatFileSize(file.size)})`;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'btn btn-light text-primary';
  a.title = 'Open selected file';
  a.dataset.objectUrl = objectUrl;
  div.appendChild(a);
}

/**
 * @param {string}      url
 * @param {string}      fileName
 * @param {HTMLElement} previewEl
 * @param {number}      [fileSize]  - opzionale, se disponibile dalla fetch
 */
export function renderImageFromUrl(url, previewEl, onError = null) {
  if (!url) {
    console.warn('renderImageFromUrl: url non valido:', url);
    return;
  }
  _render({
    src:      url,
    fileName: url.split('/').pop(),
    fileSize: null,
    objectUrl: null,
    previewEl,
    onError,
  });
}

/**
 * Revoca l'objectURL se presente e svuota il contenitore.
 *
 * @param {HTMLElement} previewEl
 */
export function clearPreview(previewEl) {
  const existing = previewEl.querySelector('[data-object-url]');
  if (existing) {
    URL.revokeObjectURL(existing.dataset.objectUrl);
  }
  previewEl.innerHTML = '';
}

/**
 * Costruisce e inietta la struttura DOM della preview.
 * Privata al modulo — non esportata.
 *
 * @param {Object}      params
 * @param {string}      params.src
 * @param {string}      params.fileName
 * @param {number|null} params.fileSize
 * @param {string|null} params.objectUrl
 * @param {HTMLElement} params.previewEl
 * @param {Function|null} params.onError
 */
function _render({ src, fileName, fileSize, objectUrl, previewEl, onError = null, type = 'image' }) {
  previewEl.innerHTML = '';
  const figure = document.createElement('figure');
  figure.className = `media-preview media-preview--${type}`;
  
  let mediaEl;
  if (type === 'video') {
    mediaEl = document.createElement('video');
    mediaEl.controls = true;
    mediaEl.className = 'img-fluid';
  } else {
    mediaEl = document.createElement('img');
    mediaEl.alt = `Preview of ${fileName}`;
    mediaEl.className = 'img-fluid img-thumbnail';
    if (onError) mediaEl.onerror = onError;
  }
  mediaEl.src = src;
  if (objectUrl) mediaEl.dataset.objectUrl = objectUrl;

  const figcaption = document.createElement('figcaption');
  figcaption.className = 'media-preview__caption d-flex justify-content-between gap-3 mt-1';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'media-preview__filename text-truncate';
  
  let nameSpanText = fileName || 'Unnamed file';
  if (fileSize !== null) {
    nameSpanText += ` (${formatFileSize(fileSize)})`;
  }
  
  nameSpan.textContent = nameSpanText;
  figcaption.appendChild(nameSpan);
  figure.appendChild(mediaEl);
  figure.appendChild(figcaption);
  previewEl.appendChild(figure);
  addCloseBtn(previewEl, figcaption, type);
}
  
/**
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function addCloseBtn(previewEl, figcaption, type) {
  const btnWrapper = document.createElement('div');
  btnWrapper.id = 'btnWrapper';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-sm btn-danger';
  removeBtn.setAttribute('aria-label', 'Remove selected file');
  removeBtn.title = 'Remove selected file';
  removeBtn.innerHTML = '<i class="mdi mdi-close"></i> remove';
  removeBtn.addEventListener('click', () => { removeBtnListener(previewEl, type); });

  btnWrapper.appendChild(removeBtn);
  figcaption.appendChild(btnWrapper);

}

function removeBtnListener(previewEl, type) {
  if(previewEl.id === 'preview' || previewEl.id === 'currentFile') { clearPreviewInput(previewEl); }
  else if (previewEl.id === 'previewExternal') { clearPreviewExternal(previewEl); }
    
  if(window.pageType === 'media_edit') {
    const pathLabel = document.getElementById('pathLabel');
    const pathInput = document.getElementById('path');
    pathInput.classList.remove('d-none');
    if (previewEl.id === 'currentFile' || previewEl.closest?.('#currentFile')) {
      pathInput.dataset.deleteCurrentFile = '1';
    }
    setRequiredFields(type);
    if(pathLabel){
      pathLabel.textContent = (type === 'image' ? '*' : '') + 'upload file';
    }
  }
}

export function clearPreviewInput(element){
  clearPreview(element);
  const fileInput = document.getElementById('path');
  if (fileInput) fileInput.value = '';
  const additionalFieldsRow = document.getElementById('additionalFieldsRow');
  if (additionalFieldsRow) additionalFieldsRow.classList.add('d-none');
}

export function clearPreviewExternal(element){
  element.innerHTML = '';
  const urlInput = document.getElementById('url');
  if (urlInput) urlInput.value = '';
}