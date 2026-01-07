import { fetchApi } from "../shared/utils/fetch.js";

export async function institutionsList(){
  try {
    const payload = {
      class: 'Institution',
      action: 'institutionsList'
    };
    const response = await fetchApi({ body: payload });
    if (response.error === 1) throw new Error("Error fetching Institution list");
    return response.data;
  } catch (error) {
    console.error("institutionsList error:", error);
    return [];
  }
}

export async function institutionCategories(){
  try {
    const payload = {
      class: 'Institution',
      action: 'categoryList'
    };
    const response = await fetchApi({ body: payload });
    if (response.error === 1) throw new Error("Error fetching Institution categories");
    return response.data;
  } catch (error) {
    console.error("institutionCategories error:", error);
    return [];
  }
}

export async function institutionLocations(){
  try {
    const payload = {
      class: 'Institution',
      action: 'locationList'
    };
    const response = await fetchApi({ body: payload });
    if (response.error === 1) throw new Error("Error fetching Institution locations");
    return response.data;
  } catch (error) {
    console.error("institutionLocations error:", error);
    return [];
  }
}

export async function getInstitutions(filters={}){
  try {
    const payload = {
      class: 'Institution',
      action: 'getInstitutions',
      filters: filters
    };
    const response = await fetchApi({ body: payload });
    if (response.error === 1) throw new Error("Error fetching Institutions with filters");
    return response.data;
  } catch (error) {
    console.error("getInstitutions error:", error);
    return [];
  }
}
