import { clearPreviewExternal, clearPreviewInput } from "../preview/renderers/renderImage.js";
import { getEmbedUrl } from './getEmbedUrl.js';

export async function renderExternalLink(url, previewEl) {
  previewEl.innerHTML = '';
  if(window.pageType === 'media_add'){
    const p = document.createElement('p');
    p.classList.add('mb-1');
    p.textContent = 'The content cannot be previewed. You can access it through the following link:';
    previewEl.appendChild(p);
  }
  const div = document.createElement('div');
  div.id = 'externalLinkWrapper';
  div.className = 'btn-group btn-group-sm';
  div.setAttribute('role', 'group');
  previewEl.appendChild(div);

  const btn = await addCloseBtn(previewEl);
  div.appendChild(btn);

  const a = await addAnchor(url);
  div.appendChild(a);
}

async function addCloseBtn(previewEl) {
  console.log(previewEl);
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-danger';
  removeBtn.setAttribute('aria-label', 'Remove link');
  removeBtn.title = 'Remove link';
  removeBtn.innerHTML = '<i class="mdi mdi-close"></i>';
  if(window.pageType === 'media_add') {
    removeBtn.addEventListener('click', () => { clearPreviewExternal(previewEl); });
  }
  else if(window.pageType === 'media_edit') {
    removeBtn.addEventListener('click', () => {
      if(previewEl.id === 'previewExternal') {
        clearPreviewExternal(previewEl);
        const urlInput = document.getElementById('url');
        urlInput.value = '';
        urlInput.classList.remove('d-none');
      }
      else if (previewEl.id === 'currentFile') { 
        clearPreviewInput(previewEl);
        const pathInput = document.getElementById('path');
        const pathLabel = document.getElementById('pathLabel');
        pathLabel.textContent = 'upload file';
        pathInput.value = '';
        pathInput.classList.remove('d-none');
        pathInput.dataset.deleteCurrentFile = '1';
      }
    });
  }
  return removeBtn;
}

export function renderVideoFromUrl(url, previewEl, onClear=null) {
  previewEl.innerHTML = '';

  const embedUrl = getEmbedUrl(url);

  const wrapper = document.createElement('div');
  wrapper.classList.add('ratio', 'ratio-16x9', 'mt-2');

  if (embedUrl) {
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    wrapper.appendChild(iframe);
  } else {
    const video = document.createElement('video');
    video.controls = true;
    video.style.width = '100%';
    const source = document.createElement('source');
    source.src = url;
    video.appendChild(source);
    wrapper.appendChild(video);
  }

  previewEl.appendChild(wrapper);

  const clearFn = onClear ?? (() => clearPreviewExternal(previewEl));

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-sm btn-danger mt-1';
  removeBtn.innerHTML = '<i class="mdi mdi-close"></i> remove';
  removeBtn.addEventListener('click', clearFn);
  previewEl.appendChild(removeBtn);
}

async function addAnchor(url) {
  const a = document.createElement('a');
  a.href = url;
  a.textContent = url.includes('archive/document') ? url.split('/').pop() : url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'btn btn-light text-primary text-start';
  a.title = 'Open external resource';
  return a;
}