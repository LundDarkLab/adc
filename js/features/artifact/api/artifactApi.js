import { fetchApi } from "../../../shared/utils/fetch.js";

const payload = { class: 'Artifact' }

export async function getArtifactById(artifactId) {
  payload.action = 'getArtifact';
  payload.id = artifactId;
  const response = await fetchApi({ body: payload });
  return response;
}

export async function deleteArtifact(artifactId){
  payload.action = 'deleteArtifact';
  payload.id = artifactId;
  const response = await fetchApi({ body: payload });
  return response;
}