import { bsAlert, bsModal } from "../../components/bsComponents.js";
import { fetchApi } from "../../shared/utils/fetch.js";
import { OBJECT_METADATA_FIELDS } from "./viewerConfig.js";

export async function changeModelStatus(modelId, status) {
  try {
    const payload = { class: 'Model', action: 'changeModelStatus', id:modelId, status:status };
    const response = await fetchApi({ body: payload });
    if(response.data.error === 1){
      throw new Error(response.data.message || 'Unknown error');
    }
    bsAlert(response.data.message, 'success', 3000, () => {window.location.reload();});
  } catch (error) {
    bsAlert('Errore durante il cambio di stato del modello: ' + error.message, 'danger');
  }
} 


/**
 * Gestisce i permessi utente e la visibilità dei bottoni/moduli.
 * @param {Object} mainData - Dati principali del modello.
 */
export function handleUserPermissions(isLoggedUser, mainData) {
  updateStatusUi(mainData.status_id);

  if (isLoggedUser) {
    const btn = document.getElementById('modelStatus');
    if (btn && !btn.dataset.listenerAttached) {
      btn.addEventListener('click', () => changeModelStatus(mainData.id, btn.value));
      btn.dataset.listenerAttached = 'true';
    }
  } else {
    document.querySelector('#toolBarModel')?.remove();
    document.getElementsByName('saveModelParam')[0]?.remove();
  }
}

function updateStatusUi(status_id) {
  const isPublished = status_id == 2;

  const modelStatus = document.querySelector('#model-status');
  if (modelStatus) {
    modelStatus.classList.toggle('alert-danger', !isPublished);
    modelStatus.classList.toggle('alert-success', isPublished);
  }

  const btn = document.getElementById('modelStatus');
  if (btn) {
    btn.value = isPublished ? 1 : 2;
  }
}


/**
 * Popola la UI con i metadati del modello.
 * @param {Object} mainData - Dati principali del modello.
*/
function setMetadataField(key, value) {
  const el = document.querySelector("#model-" + key);
  if (el) { el.textContent = value; }
}

export function renderModelMetadata(isLoggedUser, mainData) {
  const editBtns = document.querySelectorAll('.editModelBtn');
  if (editBtns.length > 0) {
    if (mainData?.id) {
      const editUrl = `model_edit.php?item=${encodeURIComponent(mainData.id)}`;
      editBtns.forEach(btn => { btn.setAttribute('href', editUrl); });
    } else {
      console.error('mainData.id is missing:', mainData);
    }
  } else {
    console.error('Edit buttons not found in the DOM');
  }

  const isEmpty = (value) => value === null || value === undefined || value === '';

  Object.keys(mainData).forEach(key => {
    if (!isEmpty(mainData[key])) {
      if (key === 'doi') {
        const modelPageDoiLink = document.getElementById("model-doi");
        if (modelPageDoiLink) {
          modelPageDoiLink.setAttribute('href', mainData.doi);
          modelPageDoiLink.textContent = mainData.doi;
        }
      } else {
        setMetadataField(key, mainData[key]);
      }
    } else if (!isLoggedUser) {
      document.querySelector(`#model-${key}`)?.parentElement?.remove();
    }
  });
}

export function initObjectToggleToolbar(data){
  if(data.length <= 1){ return; }
  const toolbar = document.getElementById('object-control');
  toolbar.classList.remove('d-none');
  const fragment = document.createDocumentFragment();
  data.forEach((obj, index) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline-secondary active';
    btn.type = 'button';
    btn.setAttribute('aria-label', `Object ${index}`);

    const img = document.createElement('img');
    const thumbUrl = obj.thumbnail ? `/archive/thumb/${obj.thumbnail}` : 'https://via.placeholder.com/150?text=No+Thumbnail';
    img.src = thumbUrl;
    img.alt = '';

    btn.appendChild(img);
    btn.addEventListener('click', () => toggleObject(obj,btn));

    fragment.appendChild(btn);
  });
  
  toolbar.innerHTML = '';
  toolbar.appendChild(fragment);
}

function toggleObject(obj, btn){  
  const instanceName = 'mesh_' + obj.id;
  const isHidden = btn.classList.contains('hidden');
  presenter.setInstanceVisibilityByName(instanceName, isHidden, isHidden);
  btn.classList.toggle('hidden');
}

export function initObjectMetadata(model,data) {
  const thumbBody = document.querySelector('#paradata-modal .thumbnail-body');
  thumbBody.innerHTML = '';

  data.forEach((obj, index) => {
    const div = document.createElement('div');
    div.className = 'thumb-item';
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', `Object ${index + 1}`);

    if (obj.thumbnail) {
      div.style.backgroundImage = `url('/archive/thumb/${obj.thumbnail}')`;
    }

    div.addEventListener('click', () => showObjectMetadata(model, obj));
    thumbBody.appendChild(div);
  });
}

export function showObjectMetadata(model, data){
  console.log('showObjectMetadata', data);
  const thumbRow = `
    <tr>
      <td colspan="2" style="padding:0">
        <img 
          src="${data.thumbnail ? `/archive/thumb/${data.thumbnail}` : 'https://via.placeholder.com/150?text=No+Thumbnail'}" 
          alt="Thumbnail" 
          class="img-thumbnail thumbPreview shadow" 
        >
      </td>
    </tr>
  `;

  const rows = Object.entries(data)
    .filter(([key]) => OBJECT_METADATA_FIELDS.has(key))
    .reduce((acc, [key, value]) => {
      if (['license_acronym', 'license_link', 'thumbnail'].includes(key)) return acc; // skip, già gestiti
      if (key === 'license') {
        const link = data.license_link
          ? `<a href="${data.license_link}" target="_blank">${value} (${data.license_acronym ?? ''})</a>`
          : `${value} (${data.license_acronym ?? 'N/A'})`;
        acc.push(['license', link]);
      } else {
        acc.push([key, value]);
      }
      return acc;
    }, [])
    .map(([key, value]) => `
      <tr>
        <th scope="row" class="text-capitalize">${key.replaceAll('_', ' ')}</th>
        <td>${value ?? 'N/A'}</td>
      </tr>`)
    .join('');

  const body = `
    <table class="table table-sm table-striped">
      <tbody>
        ${thumbRow}
        ${rows}
      </tbody>
    </table>`;

  bsModal({
    title: 'Object details',
    body: body,
    size: 'modal-lg',
    buttons: [
      { text: 'Close', class: 'btn-secondary', action: 'close' },
      { text: 'Edit', class: 'btn-primary', action: () => window.location.href = `model_object_edit.php?model=${model}&item=${data.id}` }
    ]
  });
}