import { fetchApi } from "../../../shared/utils/fetch.js";

export async function getPersonData(personId) {
  const payload = {
    class: 'Person',
    action: 'getPersons',
    filters: { id: personId }
  };
  const response = await fetchApi({body:payload});
  return response;
}