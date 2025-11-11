import { fetchApi } from "../helpers/helper.js";

export async function modelList(payload={}){
  try {
    payload.class = 'Model';
    payload.action = 'modelList';
    
    const response = await fetchApi({ url: ENDPOINT, body: payload });
    if (response.error === 1) throw new Error("Error fetching Model list");
    return response.data;
  } catch (error) {
    bsAlert(`Error fetching Model list: ${error}`, 'danger');
    return false;
  }
}