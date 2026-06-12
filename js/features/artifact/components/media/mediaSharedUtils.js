import { getAcceptString } from "../../../../components/media/preview/initMediaPreview.js";
import { getLicenseListApi } from "../../api/artifactMediaApi.js";
const alertMessage = {
  image: 'File upload is mandatory for images. You can also add an URL to provide additional information from external resources.<br>Supported upload formats: JPG, PNG, GIF, WEBP.<br>Max size: 512 MB.',

  video: 'Please provide at least one of: a file upload or an external URL.<br>Supported upload formats: MP4, WebM, OGV.<br>Max size: 512 MB.',

  document: 'Please provide at least one of: a file upload or an external URL.<br>Supported upload formats: PDF, DOC, DOCX, ODT, ODS, ODP, XLSX, PPTX.<br>Max size: 512 MB.',
  
  reference: 'A reference is a bibliographic entry related to this artifact. You can add it by uploading a file, linking an external resource, or writing it manually in the description field.<br>Supported upload formats: PDF, DOC, DOCX, ODT, ODS, ODP, XLSX, PPTX.<br>Max size: 512 MB.',

   link: 'A "link" is an external resource related to this artifact — it can point to a similar object, a semantic reference, or any other relevant online resource. It can be a link to a file (image or document), or an external URL pointing to a web page.<br>An external URL is required.',
};

export function setAlertContent(mediaType) {
  const el = document.getElementById('alertContent');
  if (el) {el.innerHTML = alertMessage[mediaType] || '';}
}

export function setBackLink(artifact) {
  const el = document.getElementById('backToArtifact');
  if (el) el.href = `artifact_view.php?item=${artifact}`;
}

export function setPathLabel() {
  const pathLabel = document.getElementById('pathLabel');
  if(window.pageType === 'media_add') {
    pathLabel.textContent = 'upload file';
  } else if(window.pageType === 'media_edit') {
    pathLabel.textContent = 'file available';
  }
}

export function setRequiredFields(mediaType) {
  if (mediaType === 'image') {
    const pathLabel = document.getElementById('pathLabel');
    const pathInput = document.getElementById('path');
    if (pathLabel && pathInput) {
      pathLabel.classList.add('fw-bold');
      pathInput.required = true;
    }
  }
  else if (mediaType === 'link') {
    const fileInputCol = document.getElementById('fileInputCol');
    const additionalFieldsRow = document.getElementById('additionalFieldsRow');
    const urlInputCol = document.getElementById('urlInputCol');
    const urlLabel = document.getElementById('urlLabel');
    const urlInput = document.getElementById('url');
    const span = urlLabel.querySelector('span');
    if (fileInputCol) {fileInputCol.remove();}
    if (additionalFieldsRow) {additionalFieldsRow.remove();}
    if (urlInputCol) {
      urlInputCol.classList.remove('col-md-6');
      urlInputCol.classList.add('col-12');
    }
    if (urlLabel && span && urlInput) {
      urlLabel.classList.add('fw-bold');
      span.textContent = '* ';
      urlInput.required = true;
    }
  }
}

export function setInputAccept(mediaType) {
  const el = document.getElementById('path');
  if (el) { el.accept = getAcceptString(mediaType); }
}

export async function populateLicenseSelect() {
  const licenseSelect = document.getElementById('license');
  if (!licenseSelect) return;
  try {
    const licenseList = await getLicenseListApi();
    if (!licenseList.data.length) throw new Error('No licenses found.');

    licenseSelect.innerHTML = '';
    licenseList.data.forEach(license => {
      const option = document.createElement('option');
      option.value = license.id;
      option.textContent = `${license.license} (${license.acronym})`;
      licenseSelect.appendChild(option);
    });
  } catch (error) {
    licenseSelect.innerHTML = '<option>Unavailable</option>';
    console.error('mediaAdd: errore nel caricamento delle licenze:', error);
  } finally {
    licenseSelect.disabled = false;
  }
}
