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

export async function getInstitutions() {
  const response = await fetchApi({ body: { class: 'Institution', action: 'getInstitutions', filters: {} } });
  return response.data ?? [];
}

export async function getPersonFromUser(userId) {
  const payload = {
    class: 'Person',
    action: 'getPersonFromUser',
    userId: userId
  };
  const response = await fetchApi({body:payload});
  return response;
}