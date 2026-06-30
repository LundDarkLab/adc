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

export async function updatePersonInfo(personId, data) {
  return await fetchApi({ body: { class: 'Person', action: 'updatePerson', person: { id: personId, ...data } } });
}

export async function updateAffiliation(personId, data) {
  return await fetchApi({ body: { class: 'Person', action: 'updatePerson', person: { id: personId, ...data } } });
}

export async function updatePassword(userId, data) {
  const result = await fetchApi({
    body: { class: 'User', action: 'changePassword', id: userId, curPwd: data.current_password, password_hash: data.new_password }
  });
  if (result?.data) result.data.res = result.data.res === 1 ? 0 : 1;
  return result;
}

export async function checkAdmin(){
  return await fetchApi({
    body: { class: 'User', action: 'checkAdmin' }
  });
}

export async function login(email, password) {
  return await fetchApi({
    body: { class: 'User', action: 'login', email, password }
  });
}

export async function rescuePwd(email) {
  const result = await fetchApi({
    body: { class: 'User', action: 'rescuePwd', email }
  });
  // Backend usa 'error' invece di 'res' — normalizziamo per coerenza con le altre funzioni
  if (result?.data) result.data.res = result.data.error === 0 ? 0 : 1;
  return result;
}