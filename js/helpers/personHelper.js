import { fetchApi } from "./helper.js";

export async function listPositions(data) {
  try {
    const payload = {
      class: 'Person',
      action: 'listPositions',
      data: data
    };
    const response = await fetchApi({ url: ENDPOINT, body: payload });
    if (response.error === 1) throw new Error("Error fetching Position list");
    return response.data;
  } catch (error) {
    console.error("listPositions error:", error);
    return { error: 1, message: error.message };
  }
}