import { institutionsList } from "../../../modules/institution.js";
import { usersList } from "../../../modules/user.js";
import { getLicenseListApi } from "../../artifact/api/artifactMediaApi.js";
import { fetchObject, fetchAcquisitionMethodList } from "../api/objectApi.js";
import { uploadObjectNxz } from "../utils/uploadObjectNxz.js";
import { initModel } from "../../../3dhop_function.js";
import { handleFormSubmit } from "../../../shared/utils/handleFormSubmit.js";
import { bsAlert } from "../../../components/bsComponents.js";

export async function initModelObjectPage() {
  const model = new URLSearchParams(location.search).get('model');
  const object = new URLSearchParams(location.search).get('item');

  const objectData = await fetchObject(object);
  console.log('objectData', objectData);

  fillFormFields(objectData.data);
  addHiddenIdFields(objectData.data);
  initSelect(objectData.data);
  initThumbPreview(objectData.data.thumbnail);
  initExistingModelViewer(objectData.data);

  const nxz = document.getElementById('nxz');
  if (nxz) { nxz.addEventListener('change', uploadObjectNxz); }

  const backToModelLink = document.getElementById('back-to-model-link');
  if (backToModelLink) {
    backToModelLink.href = `model_view.php?item=${model}`;
  }

  initFormSubmit(model);
}

/**
 * The row identifiers (model_object.id / model_param.object) aren't rendered
 * server-side to avoid reflecting the raw query string into the page; they're
 * created here from the already-fetched, validated API response instead, and
 * picked up by buildFormDataForSubmit() via their data-table attribute.
 */
function addHiddenIdFields(objectData) {
  const form = document.querySelector('[name="editObjForm"]');
  if (!form) return;

  const idField = document.createElement('input');
  idField.type = 'hidden';
  idField.id = 'id';
  idField.dataset.table = 'model_object';
  idField.value = objectData.id;
  form.appendChild(idField);

  const paramField = document.createElement('input');
  paramField.type = 'hidden';
  paramField.id = 'object';
  paramField.dataset.table = 'model_param';
  paramField.value = objectData.id;
  form.appendChild(paramField);
}

function initExistingModelViewer(objectData) {
  if (!objectData.nxz) return;
  const modelObject = [{
    id: objectData.id,
    object: objectData.nxz,
    measure_unit: objectData.measure_unit
  }];
  initModel(
    modelObject, 
    () => {
      document.getElementById('alertBg')?.remove();
      document.getElementById('uploadTip')?.remove();
    });
}

function fillFormFields(objectData) {
  document.getElementById('description').value = objectData.description;
  document.getElementById('note').value = objectData.note;
  document.getElementById('software').value = objectData.software;
  document.getElementById('points').value = objectData.points;
  document.getElementById('polygons').value = objectData.polygons;
  document.getElementById('textures').value = objectData.textures;
  document.getElementById('scans').value = objectData.scans;
  document.getElementById('pictures').value = objectData.pictures;
  document.getElementById('encumbrance').value = objectData.encumbrance;
  document.getElementById('status').checked = objectData.status == 2;
}

async function initSelect(objectData){
  console.log('initSelect', objectData);
  const authorSelect = document.getElementById('author');
  const ownerSelect = document.getElementById('owner');
  const licenseSelect = document.getElementById('license');
  const acquisitionMethodSelect = document.getElementById('acquisition_method');

  const authorList = await usersList();
  const ownerList = await institutionsList();
  const licenseList = await getLicenseListApi();
  const acquisitionMethodList = await fetchAcquisitionMethodList();

  if (authorSelect) {
    authorList.forEach(author => {
      authorSelect.add(new Option(author.name, author.id, false, author.id == objectData.author));
    });
  }
  if (ownerSelect) {
    ownerList.forEach(owner => {
      ownerSelect.add(new Option(owner.name, owner.id, false, owner.id == objectData.owner));
    });
  }
  if (licenseSelect) {
    licenseList.data.forEach(license => {
      licenseSelect.add(new Option(`${license.license} (${license.acronym})`, license.id, false, license.id == objectData.license));
    });
  }
  if (acquisitionMethodSelect) {
    acquisitionMethodList.data.forEach(method => {
      acquisitionMethodSelect.add(new Option(method.value, method.id, false, method.id == objectData.acquisition_method));
    });
  }
}

function initThumbPreview(thumbnail) {
  const thumb = document.getElementById('thumb');
  const thumbPreview = document.getElementById('thumbPreview');
  if (!thumb || !thumbPreview) return;

  thumbPreview.innerHTML= `<img src="archive/thumb/${thumbnail}" class="thumbPreview" alt="Thumbnail preview">`;

  thumb.addEventListener('change', () => {
    if (!thumb.files.length) return;
    const reader = new FileReader();
    reader.onload = () => {
      thumbPreview.innerHTML = '';
      const img = document.createElement('img');
      img.src = reader.result;
      img.className = 'thumbPreview';
      thumbPreview.appendChild(img);
    };
    reader.readAsDataURL(thumb.files[0]);
  });
}

function initFormSubmit(model) {
  const form = document.querySelector('[name="editObjForm"]');
  const nxz = document.getElementById('nxz');
  const thumb = document.getElementById('thumb');

  handleFormSubmit(form, {
    class: 'Model',
    action: 'updateObjectMetadata',
    useFormData: true,
    resetOnSuccess: false,
    beforeSubmit: (data) => {
      data.set('model_object[status]', document.getElementById('status').checked ? '2' : '1');
      if (nxz && nxz.files.length > 0) { data.append('object', nxz.files[0]); }
      if (thumb && thumb.files.length > 0) { data.append('thumbnail', thumb.files[0]); }
      return data;
    },
    onSuccess: (result) => {
      if (result.data.res === 1) {
        bsAlert(result.data.output, 'success', 3000, () => { window.location.href = `model_view.php?item=${model}`; });
      } else {
        bsAlert(result.data.output, 'danger', 5000);
      }
    },
    onError: (error) => {
      console.error('Error updating object:', error);
    }
  });
}
