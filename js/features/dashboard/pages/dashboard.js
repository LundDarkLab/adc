import { dashboardMap } from "../components/dashboardMap.js";
import { initFilters } from "../utils/dashboard_filters.js";

export async function initDashboard() {
  const userId = Number.parseInt(document.getElementById('userId').value);
  const isLoggedUser = userId && userId != 'unregistered' && !Number.isNaN(Number(userId));
  console.log(isLoggedUser);
  
  await initFilters();
  await dashboardMap();

}