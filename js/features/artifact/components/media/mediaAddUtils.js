import { bsAlert } from "../../../../components/bsComponents.js";
import { checkExternalUrl } from "../../../../components/media/externalSources/checkExternalSources.js";
import { handleFormSubmit } from "../../../../shared/utils/handleFormSubmit.js";
import { getArtifactName } from "../../../model/utils/helpers.js";
import { setBackLink, setInputAccept, populateLicenseSelect, setRequiredFields, setAlertContent, setPathLabel} from "./mediaSharedUtils.js";

export async function setUI(artifact, mediaType) {
  setAlertContent(mediaType);
  setMediaTypeLabel(mediaType);
  setPathLabel();
  setBackLink(artifact);
  setRequiredFields(mediaType);
  setInputAccept(mediaType);
  await setArtifactName(artifact);
  await populateLicenseSelect();
  await checkExternalUrl('url', 'blur', 'previewExternal');
}


function setMediaTypeLabel(mediaType) {
  const el = document.getElementById('fileTypeText');
  if (el) el.textContent = mediaType;
}

async function setArtifactName(artifact) {
  const el = document.getElementById('artifactName');
  if (!el) return;
  try {
    el.textContent = await getArtifactName(artifact);
  } catch (error) {
    console.error('mediaAdd: errore nel recupero del nome artifact:', error);
  }
}

export function initFormSubmit(artifact, mediaType) {
  const form = document.querySelector('form[name="newMediaForm"]');
  if (!form) return;

  handleFormSubmit(form, {
    class: 'Media',
    action: 'addMedia',
    useFormData: true,
    resetOnSuccess: false,
    customValidation: () => {
      if (mediaType === 'document' || mediaType === 'video') {
        const url = document.getElementById('url').value.trim();
        const path = document.getElementById('path').value;
        if (!url && !path) {
          bsAlert('Please provide either a file or an external URL.', 'warning', 5000);
          return false;
        }
      }
      return true;
    },
    beforeSubmit: (data) => {
      const fileInput = document.getElementById('path');
      if (fileInput?.files[0]) {data.append('files[path]', fileInput.files[0]);}
      return data;
    },
    onSuccess: (response) => {
      console.log(response);
      
      if (response.data.error === 1) {
        bsAlert(`Error: ${response.data.output}`, 'danger', 5000);
      } else {
        bsAlert(response.data.output, 'success', 3000, () => {window.location.href = `artifact_view.php?item=${artifact}`;});
      }
    },
    onError: (error) => {
      console.error('mediaAdd: errore nella richiesta:', error);
      bsAlert('An error occurred while saving the media. Please try again.', 'danger', 5000);
    }
  });
}