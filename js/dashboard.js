import { initDashboard,applyFilters,map } from "./modules/dashboard.js";
import { calculateMaxBoundsAndZoom} from "./helpers/mapHelper.js";

document.addEventListener("DOMContentLoaded", async function() {
  await initDashboard();
  initListeners();
  const role = document.getElementById('role').value;
  const addInstitutionBtn = document.getElementById('addInstitutionBtn');
  if(role == 1 && addInstitutionBtn){
    addInstitutionBtn.remove();
  }
});

const toggleRoleSelect = (currentSelect, roleSelect) => {
  if (!roleSelect) return; // Early return se non esiste
  const isInactiveStatus = currentSelect.id === 'personByStatus' && currentSelect.value == 3;
  roleSelect.disabled = isInactiveStatus;
};

function initListeners(){
  const setupSelect = (element) => {
    document.querySelectorAll(`#${element}Filters select`).forEach(select => {   
      select.addEventListener('change', async (ev) => { 
        const roleSelect = document.getElementById('personByUserClass');
        toggleRoleSelect(ev.currentTarget, roleSelect);
        applyFilters(element);
      });
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
  setupSelect('institution');
  setupSelect('person');
  setupSearchInput('artifact');
  setupSearchInput('model');
  setupSearchInput('institution');
  setupSearchInput('person');

  const maxZoomBtn = document.getElementById('maxZoomBtn');
  if (maxZoomBtn) {
    maxZoomBtn.addEventListener('click', (e) => {
      e.preventDefault();
      calculateMaxBoundsAndZoom(map.map);
    });
  }
}