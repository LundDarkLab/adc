import { showLoading } from "./helpers/helper.js";
import { initDashboard,applyFilters,map } from "./modules/dashboard.js";
import { calculateMaxBoundsAndZoom} from "./helpers/mapHelper.js";
document.addEventListener("DOMContentLoaded", async function() {
  showLoading(true);
  await initDashboard();
  calculateMaxBoundsAndZoom(map.map);
  initListeners();
  showLoading(false);
});

function initListeners(){
  const setupSelect = (element) => {
    document.querySelectorAll(`#${element}Filters select`).forEach(select => {   
      select.addEventListener('change', async () => { applyFilters(element); });
    });
  };

  const setupSearchInput = (element) => {
    const descInput = document.getElementById(`${element}ByDescription`);
    const searchBtn = document.getElementById(`${element}ByDescriptionSearchBtn`);
    const resetBtn = document.getElementById(`${element}ByDescriptionResetBtn`);
    searchBtn.addEventListener('click', async (e) => {
      const descValue = descInput.value.trim();
      if(!descValue){
        bsAlert('Please enter a description to search.', 'warning');
        return;
      }
      e.currentTarget.classList.add('d-none');
      resetBtn.classList.remove('d-none');
      applyFilters(element);
    });

    resetBtn.addEventListener('click', (e) => {
      descInput.value = '';
      e.currentTarget.classList.add('d-none');
      searchBtn.classList.remove('d-none');
      applyFilters(element);
    });
  };
  setupSelect('artifact');
  setupSelect('model');
  setupSearchInput('artifact');
  setupSearchInput('model');

  const maxZoomBtn = document.getElementById('maxZoomBtn');
  if (maxZoomBtn) {
    maxZoomBtn.addEventListener('click', (e) => {
      console.log('map home clicked');
      
      e.preventDefault();
      calculateMaxBoundsAndZoom(map.map);
    });
  }
}