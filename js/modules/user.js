import { fetchApi } from "../shared/utils/fetch.js";

export async function usersList(filters={}){
  try {
    const payload = {
      class: 'User',
      action: 'usersList'
    };
    if(filters.institution){
      payload.institution = filters.institution;
    }
    const response = await fetchApi({ body: payload });
    if (response.error === 1) throw new Error("Error fetching User list");
    return response.data;
  } catch (error) {
    console.error("usersList error:", error);
    return [];
  }
}