import { fetchApi } from "../../../shared/utils/fetch.js";

const payload = { class: 'Model' }

export async function checkNameApi(name) {
  payload.action = 'checkName';
  payload.name = name;
  const response = await fetchApi({ body: payload });
  return response;
}

export async function getModelDetailsApi(modelId) {
  payload.action = 'getModelApi';
  payload.modelId = modelId;
  return await fetchApi({ body: payload });
}