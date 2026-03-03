import { getModelDetailsApi } from "../api/modelApi.js";
import { initModel } from "../../../3dhop_function.js";

export async function initViewPage(){
  const modelId = document.querySelector('input[name="modelId"]').value;
  const response = await getModelDetailsApi(modelId)
  console.log(response);
  
  if(response.error === 1 && response.data.error === 1){
    console.error('Error fetching model details:', response.data.output);
    return;
  }
  initModel(response.data.response, viewerReady);
}

function viewerReady(){
  const btnWidescreen = document.getElementById('btWidescreen');
  if(btnWidescreen){ btnWidescreen.remove(); }
}