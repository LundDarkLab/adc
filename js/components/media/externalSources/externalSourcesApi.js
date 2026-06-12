import { fetchApi } from "../../../shared/utils/fetch.js";

const mediaApi = { class: 'Media' };

export async function checkExternalUrlApi(url) {
  mediaApi.action = 'checkExternalUrl';
  mediaApi.url = url;
  return await fetchApi({ body: mediaApi });
}