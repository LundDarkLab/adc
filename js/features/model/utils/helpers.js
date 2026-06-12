import { bsAlert } from "../../../shared/components/bsComponents/initBsComponents.js";
import { getArtifactNameApi } from "../../artifact/api/artifactApi.js";
import { checkNameApi, connectToArtifactApi } from "../api/modelApi.js";


export function checkName(){
  const checkNameBtn = document.getElementById('checkNameBtn');
  const checkNameResult = document.getElementById('checkNameResult');
  const nameInput = document.getElementById('name');

  checkNameBtn.addEventListener('click', async function() {
    checkNameResult.textContent = '';
    checkNameResult.className = '';
    const name = nameInput.value.trim();

    if (!name) {
      checkNameResult.textContent = 'The field is empty, enter a value and retry';
      checkNameResult.className = 'alert alert-danger m-0 p-1';
      return;
    }

    if (name.length < 5) {
      checkNameResult.textContent = 'The name must be 5 characters at least';
      checkNameResult.className = 'alert alert-danger m-0 p-1';
      return;
    }

    const result = await checkNameApi(name);
    if(result.data.exists){
      checkNameResult.textContent = 'The name is already taken, please choose another one';
      checkNameResult.className = 'alert alert-danger m-0 p-1';
    } else {
      checkNameResult.textContent = 'The name is available';
      checkNameResult.className = 'alert alert-success m-0 p-1';
    }
  });
}

export function allowUploadNxz() {
  const uploadNxzRow = document.getElementById('uploadNxzRow');
  const measure_unit = document.getElementById('measure_unit');
  const uploadTip = document.getElementById('uploadTip');

  if (measure_unit) {
    measure_unit.addEventListener('change', function(ev) {
      if (ev.currentTarget.value) {
        uploadNxzRow.classList.remove('d-none');
        uploadTip.classList.add('d-none');
      } else {
        uploadNxzRow.classList.add('d-none');
        uploadTip.classList.remove('d-none');
      }
    });
  }
}  

export async function getArtifactName(artifact) {
  try {
    const artifactName = await getArtifactNameApi(artifact);
    if (artifactName.data.length === 0) {
      throw new Error('Artifact not found');
    }
    return artifactName.data[0].name;
  } catch (error) {
    bsAlert('Failed to fetch artifact name: ' + error.message, 'danger');
  }
}

export async function connectToArtifact(modelId, artifactId) {
  try {
    if(!modelId || !artifactId) {
      throw new Error('Model ID and Artifact ID are required');
    }
    const response = await connectToArtifactApi(modelId, artifactId);
    if (response.error === 1) {
      throw new Error(response.message);
    } else {
      if(response.data.error === 1) {
        throw new Error(response.data.message);
      }
      bsAlert(response.data.message, 'success', 3000, () => {window.location.href = `artifact_view.php?item=${artifactId}`;});
    }
  } catch (error) {
    bsAlert('Failed to connect model to artifact: ' + error, 'danger');
    console.error('Error connecting model to artifact:', error);
  }
}