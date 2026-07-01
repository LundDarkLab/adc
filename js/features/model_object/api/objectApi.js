import { fetchApi } from "../../../shared/utils/fetch.js";

export async function fetchObject(item){
  const payload = {
    class: 'Model',
    action: 'getObject',
    id: item
  };
  return await fetchApi({body:payload});
}

export async function fetchAcquisitionMethodList(){
  const payload = {
    class: 'Model',
    action: 'objectAcquisitionMethodList',

  };
  return await fetchApi({body:payload});
}