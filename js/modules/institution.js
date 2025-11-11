import { fetchApi } from "../helpers/helper.js";

export async function institutionsList(){
  try {
    const payload = {
      class: 'Institution',
      action: 'institutionsList'
    };
    const response = await fetchApi({ url: ENDPOINT, body: payload });
    if (response.error === 1) throw new Error("Error fetching Institution list");
    return response.data;
  } catch (error) {
    console.error("institutionsList error:", error);
    return [];
  }
}