import { fetchApi } from "../shared/utils/fetch.js";

export async function roleList(data) {
  try {
    const payload = {
      class: 'User',
      action: 'roleList',
      data: data
    };
    const response = await fetchApi({ body: payload });
    if (response.error === 1) throw new Error("Error fetching Role list");
    return response.data;
  } catch (error) {
    console.error("roleList error:", error);
    return { error: 1, message: error.message };
  }
}