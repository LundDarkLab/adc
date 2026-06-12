import { bsAlert } from "../../bsComponents.js";
import { renderImageFromUrl } from "../preview/renderers/renderImage.js";
import { checkExternalUrlApi } from "./externalSourcesApi.js";
import { renderExternalLink, renderVideoFromUrl } from "./renderExternalSource.js";
import { getEmbedUrl } from "./getEmbedUrl.js";

export async function checkExternalUrl(el, trigger, previewEl = null) {
  const urlInput = document.getElementById(el);
  if (!urlInput) {
    console.error(`checkExternalUrl: input element with id "${el}" not found.`);
    return;
  }
  urlInput.addEventListener(trigger, async (ev) => {
    await urlInputHandler(previewEl, ev);
  });

}

async function urlInputHandler(previewEl, ev) {
  const url = ev.currentTarget.value.trim();
  if (!url) {return;}
  const previewContent = document.getElementById(previewEl);
  if (!previewContent) {return;}
  try {
    await renderUrlPreview(url, previewContent);
  } catch (error) {
    console.error('Error checking external URL:', error);
    bsAlert(error.message, 'danger', 5000);
  }
}

export async function renderUrlPreview(url, previewEl) {
  // Per fonti note (YouTube, Vimeo), non serve il check server-side
  const embedUrl = getEmbedUrl(url);
  if (embedUrl) {
    renderVideoFromUrl(url, previewEl);
    return;
  }

  const data = await checkUrl(url);
  const isImage = data.contentType?.startsWith('image/');
  const isVideo = data.contentType?.startsWith('video/');

  if (!data.renderable) {
    await renderExternalLink(url, previewEl);
  } else if (isImage) {
    renderImageFromUrl(url, previewEl, async () => {
      await renderExternalLink(url, previewEl);
    });
  } else if (isVideo) {
    renderVideoFromUrl(url, previewEl);
  } else {
    await renderExternalLink(url, previewEl);
  }
}

async function checkUrl(url){
  if (!isValidUrl(url)) { throw new TypeError('The URL is not valid.'); }
  const response = await checkExternalUrlApi(url);
  if (!response) { throw new Error('Error contacting the media check service.'); }
  if (response.error === 1) { throw new Error(response.message ?? 'Unknown error'); }
  const data = response.data;

  if (!data.available && !data.blocked) {
    throw new Error('The external resource is not available.');
  }

  return {
    renderable:  !data.blocked,
    contentType: data.content_type,
    status_code: data.status_code,
  };
}

function isValidUrl(string) {
  try { new URL(string); return true; }
  catch { return false; }
}