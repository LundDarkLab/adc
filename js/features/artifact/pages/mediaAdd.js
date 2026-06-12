import { bsAlert } from '../../../components/bsComponents.js';
import { initMediaPreview } from '../../../components/media/preview/initMediaPreview.js';
import { MEDIA_TYPE_EXTENSIONS } from '../../../components/media/preview/config.js';
import { setUI, initFormSubmit } from '../components/media/mediaAddUtils.js';

const artifact  = document.getElementById('artifact')?.value ?? '';
const mediaType = document.getElementById('type')?.value ?? '';

if (mediaType!=='link' && !MEDIA_TYPE_EXTENSIONS[mediaType]) {
  bsAlert('Invalid media type.', 'danger');
  throw new Error(`mediaAdd: mediaType non valido: "${mediaType}"`);
}

export async function initPage() {
  await setUI(artifact, mediaType);

  if (mediaType !== 'link') {
    const input     = document.getElementById('path');
    const previewEl = document.getElementById('preview');
    if (input && previewEl) {
      input.addEventListener('change', handleFileChange(previewEl));
    }
  }

  initFormSubmit(artifact, mediaType);
}
/**
 * Restituisce l'handler per l'evento change sull'input file.
 * Usa una closure per ricevere previewEl senza inquinare lo scope globale.
 *
 * @param {HTMLElement} previewEl
 * @returns {Function}
 */
function handleFileChange(previewEl) {
  return async (event) => {
    const file = event.currentTarget.files[0];
    if (!file) return;

    try {
      await initMediaPreview({ file, mediaType, previewEl });
      const additionalFieldsRow = document.getElementById('additionalFieldsRow');
      if (additionalFieldsRow) {
        additionalFieldsRow.classList.remove('d-none');
      }
    } catch (error) {
      bsAlert(error.message, 'danger', 5000);
      console.error('mediaAdd — errore preview:', error);
    }
  };
}