import { fetchApi } from "../../../shared/utils/fetch.js";

const payload = { class: 'Model' }

export async function checkNameApi(name) {
  payload.action = 'checkName';
  payload.name = name;
  const response = await fetchApi({ body: payload });
  return response;
}