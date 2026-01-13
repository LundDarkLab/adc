import { fetchApi } from "../../../shared/utils/fetch.js";

export async function deleteArtifact(artifactId){
  const payload = {
    class: 'Artifact',
    action: 'deleteArtifact',
    id: artifactId
  };
  const response = await fetchApi({ body: payload });
  return response;
}