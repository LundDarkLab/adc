import { bsAlert } from "../../../../components/bsComponents.js";
import { renderExternalLink, renderVideoFromUrl } from "../../../../components/media/externalSources/renderExternalSource.js";
import { renderUrlPreview } from "../../../../components/media/externalSources/checkExternalSources.js";
import { renderImageFromUrl } from "../../../../components/media/preview/renderers/renderImage.js";
import { handleFormSubmit } from "../../../../shared/utils/handleFormSubmit.js";
import { getMediaApi } from "../../api/artifactMediaApi.js";
import { populateLicenseSelect, setAlertContent, setBackLink, setInputAccept, setPathLabel, setRequiredFields} from "./mediaSharedUtils.js";

export async function getMediaMetadata(media){
  try {
    const item = await getMediaApi(media)
    if(item?.error === 1 || item?.data?.length === 0) {
      bsAlert('Error loading media data.', 'danger', 5000);
      return;
    }
    return item.data;
  } catch (error) {
    bsAlert('Error loading media data.', 'danger', 5000);
    console.error('mediaEdit: error fetching media data:', error);
    return;
  }
} 

export async function setUI(item){
  try {
    setAlertContent(item.type)
    setPathLabel();
    setRequiredFields(item.type);
    const pathInput = document.getElementById('path');
    const urlInput = document.getElementById('url');
    const currentFileDiv = document.getElementById('currentFile');
    const previewExtEl = document.getElementById('previewExternal');

    if(item.type !== 'link' && item.path !== null) { pathInput.required = false; }

    if(item.path === null){
      pathInput?.classList.remove('d-none');
      currentFileDiv?.classList.add('d-none');
    } else {
      pathInput?.classList.add('d-none');
      currentFileDiv?.classList.remove('d-none');
      const path = `archive/${item.type}/${item.path}`;
      if(item.type === 'image'){
        renderImageFromUrl(path, currentFileDiv);
      } else if(item.type === 'video'){
        renderVideoFromUrl(path, currentFileDiv);
      } else if(item.type === 'document' || item.type === 'reference'){
        renderExternalLink(path, currentFileDiv);
      }
    }
    if(item.url === null) {
      urlInput.classList.remove('d-none');
    }else {
      urlInput.classList.add('d-none');
      renderExternalLink(item.url, previewExtEl);
    }
    
    if(item.type !== 'link') {
      const additionalFieldsRow = document.getElementById('additionalFieldsRow');
      additionalFieldsRow?.classList.remove('d-none')
      setInputAccept(item.type);
      await populateLicenseSelect();
    }
    
    populateFields(item);
    setBackLink(item.artifact);
  } catch (error) {
    bsAlert('Error loading media data.', 'danger', 5000);
    console.error('mediaEdit: error fetching media data:', error);
  }
}

export function initFormSubmit(media){
  const form = document.getElementById('editMediaForm');
  if (!form) {return;}

  handleFormSubmit(form, {
    class: 'Media',
    action: 'editMedia',
    useFormData: true,
    resetOnSuccess: false,
    formOptions: { includeEmpty: true },
    customValidation: () => {
      if (media.type === 'document' || media.type === 'video') {
        const url = document.getElementById('url').value.trim();
        const fileInput = document.getElementById('path');
        const newFile = fileInput.files[0];
        const deleteCurrentFile = fileInput.dataset.deleteCurrentFile === '1';
        const hasCurrentFile = media.path && !deleteCurrentFile;
        if (!url && !newFile && !hasCurrentFile) {
          bsAlert('Please provide either a file or an external URL.', 'warning', 5000);
          return false;
        }
      }
      return true;
    },
    beforeSubmit: (data) => {
      const fileInput = document.getElementById('path');
      const deleteCurrentFile = fileInput.dataset.deleteCurrentFile === '1';
      data.delete('files[path]');
      if (fileInput?.files[0]) {
        data.append('files[path]', fileInput.files[0]);
      } else if (deleteCurrentFile) {
        data.append('files[deleteFile]', '1');
      }
      return data;
    },
    onSuccess: (response) => {
      console.log(response);
      
      if (response.data.error === 1) {
        bsAlert(`Error: ${response.data.output}`, 'danger', 5000);
      } else {
        bsAlert(response.data.output, 'success', 3000, () => {window.location.href = `artifact_view.php?item=${media.artifact}`;});
      }
    },
    onError: (error) => {
      console.error('mediaAdd: errore nella richiesta:', error);
      bsAlert('An error occurred while saving the media. Please try again.', 'danger', 5000);
    }
  });
}

function populateFields(item){
  const urlInput = document.getElementById('url');
  urlInput.value = item.url || '';

  const descriptionInput = document.getElementById('text');
  descriptionInput.value = item.text || '';

  const downloadCheckbox = document.getElementById('downloadable');
  downloadCheckbox.checked = item.downloadable === '1';

  const licenseSelect = document.getElementById('license');
  if (licenseSelect) { licenseSelect.value = item.license_id; }
  
  if (item.url) {
    const previewExtEl = document.getElementById('previewExternal');
    renderUrlPreview(item.url, previewExtEl).catch(console.error);
  }
}