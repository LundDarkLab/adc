import { fetchApi } from "../../../shared/utils/fetch.js";

const payload = { class: 'Media' }
const vocabulary = {class: 'Vocabulary'};

export async function getMediaApi(file) {
  payload.action = 'getMedia';
  payload.file = file;
  return await fetchApi({ body: payload });
}

export async function deleteArtifactMediaApi(media) {
  payload.action = 'deleteMedia';
  payload.media = media;
  return await fetchApi({ body: payload });
}

export async function getLicenseListApi(){
  vocabulary.action = 'getLicenses';
  return await fetchApi({ body: vocabulary });
}

