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



/*
--- inizio oggetto: 0 --- 
id: 921
thumbnail: 7798e617-61ac-4014-bfcb-627657a7f3b4.png
author: Giuseppe Naponiello
owner: Department of Archaeology and Ancient History
license: No Rights Reserved
license_acronym: CC0
license_link: https://creativecommons.org/publicdomain/zero/1.0/
description: sdsdfsdfs
note: null
acquisition_method: Photogrammetry
software: null
points: null
polygons: null
textures: null
scans: null
pictures: null
encumbrance: null
measure_unit: cm
--- fine oggetto: 0 --- 
*/