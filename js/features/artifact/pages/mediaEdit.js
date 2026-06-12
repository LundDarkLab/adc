import { bsAlert } from "../../../components/bsComponents.js";
import { checkExternalUrl } from "../../../components/media/externalSources/checkExternalSources.js";
import { initMediaPreview } from "../../../components/media/preview/initMediaPreview.js";
import { getMediaMetadata, initFormSubmit, setUI } from "../components/media/mediaEditUtils.js";


export async function initPage() {
  try {
    const id = checkInitError();
    const item = await getMediaMetadata(id);
    if (!item) { return; }
    await setUI(item);
    await checkExternalUrl('url', 'blur', 'previewExternal');

    if (item.type !== 'link') {
      const fileInput = document.getElementById('path');
      const previewEl = document.getElementById('preview');
      if (fileInput && previewEl) {
        fileInput.addEventListener('change', async (event) => {
          const file = event.currentTarget.files[0];
          if (!file) return;
          try {
            await initMediaPreview({ file, mediaType: item.type, previewEl });
          } catch (error) {
            bsAlert(error.message, 'danger', 5000);
            console.error('mediaEdit — errore preview:', error);
          }
        });
      }
    }

    initFormSubmit(item);
  } catch (error) {
    console.error('Error initializing media edit page:', error);
    return;
  }
}

function checkInitError(){
  const media = document.getElementById('id')
  if (!media?.value) {
    const mainDiv = document.querySelector('body > main > .container');
    mainDiv.innerHTML = '<div class="alert alert-danger mt-4" role="alert">Media ID is required to load this page.</div>';
    throw new Error('Media ID is required to initialize the page.');
  }
  return media.value;
}