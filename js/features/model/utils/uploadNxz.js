import { startupViewer } from "../../../3dhop_function.js";

const statusEl = document.getElementById('status');
const progressBar = document.getElementById('progressBar');
const endpoint = '/api/modelPreview.php';
const measureUnitInput = document.getElementById('measure_unit');

export function uploadNxz(ev){
  const nxzFile = ev.currentTarget.files[0];
  statusEl.textContent = '';
  const maxSize = 100 * 1024 * 1024; // 100MB in byte
  if (!nxzFile.name.toLowerCase().endsWith('.nxz')) {
    statusEl.textContent = "Sorry but you can upload only nxz files. You are trying to upload a "+nxzFile.name.split('.').pop()+" file type";
    return false;
  }
  if(nxzFile.size > maxSize){
    statusEl.textContent = "The file is too big. Maximum allowed size is 100MB.";
    return false;
  }
  statusEl.textContent = "File is valid and ready for upload.";
  const nxzUploadFormData = new FormData();
  nxzUploadFormData.append('nxz', nxzFile, nxzFile.name);
  const ajax = new XMLHttpRequest();
  ajax.upload.addEventListener("progress", progressHandler, false);
  ajax.addEventListener("load", completeHandler, false);
  ajax.addEventListener("error", errorHandler, false);
  ajax.addEventListener("abort", abortHandler, false);
  ajax.open("POST", endpoint);
  ajax.send(nxzUploadFormData);
  return true;
}

function progressHandler(event){
  const percent = Math.round((event.loaded / event.total) * 100);
  progressBar.classList.remove('d-none');
  progressBar.value = percent;
  statusEl.textContent = `Uploading ${percent}%... please wait`;
}

function completeHandler(event){
  progressBar.classList.add('d-none');
  progressBar.value = 0;
  let response;
  try {
    response = JSON.parse(event.target.responseText);
  } catch (e) {
    console.error("Error parsing server response:", e);
    statusEl.textContent = `Unexpected server response: ${e}. Please try again or contact support.`;
    return;
  }
  if(response.success){
    console.log(`Upload complete: ${JSON.stringify(response)}`);
    statusEl.textContent = response.message;
    const thumbWrap = document.getElementById('modelPreviewRow');
    thumbWrap.classList.remove('d-none');
    const modelObject = [{
      object: 'preview/' + response.filename,
      measure_unit: measureUnitInput.value
    }];
    startupViewer(modelObject, viewerReady);

  } else {
    statusEl.textContent = response.message;
  }
}

function errorHandler(event){
  statusEl.textContent = "Upload Failed";
  console.log(`errorHandler message: ${event}`);
  
}
function abortHandler(event){
  statusEl.textContent = "Upload Aborted";
  console.log(`abortHandler message: ${event}`);
}

function viewerReady(){
  console.log("Viewer pronto!");
}