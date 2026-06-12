import { getModelDetailsApi } from "../api/modelApi.js";
import { initModel } from "../../../3dhop_function.js";
import { bsAlert } from "../../../components/bsComponents.js";


export async function initViewPage(){
  const modelId = document.querySelector('input[name="modelId"]').value;
  const response = await getModelDetailsApi(modelId)
  
  if(response.error === 1 && response.data.error === 1){
    console.error('Error fetching model details:', response.data.output);
    bsAlert('Failed to load model details. Please try again later.', 'danger');
    return;
  }
  initModel(response.data.response, () => viewerReady(response.data.response));
}

function viewerReady(modelData){
  if(modelData.model_object.length === 0){ return false; }
  const btnWidescreen = document.getElementById('btWidescreen');
  if(btnWidescreen){ btnWidescreen.remove(); }
}

