import { preloadForModel } from '../../../shared/utils/lists.js';
import { bsAlert } from "../../../components/bsComponents.js";

export async function buildModelLists() {
  try {
    const userId = document.getElementById('userId').value;
    const institutionId = document.getElementById('userInstitution').value;
    const lists = await preloadForModel();
    
    Object.keys(lists).forEach(key => {
      if (!lists[key] || lists[key].length === 0) {
        bsAlert(`No data found for ${key}, skipping select population.`, 'warning', 3000);
        return;
      }
      if(lists[key].error === 1){
        bsAlert(`Error fetching data for ${key}: ${lists[key].error}`, 'danger', 3000);
        return;
      }
      
      const selectEl = document.getElementById(key);
      if (selectEl) {
        lists[key].data.forEach(optionData => {
          const option = document.createElement("option");
          if(key === 'measure_unit'){
            option.value = optionData.acronym;
          }else{
            option.value = optionData.id;
          }
          option.textContent = optionData.value || optionData.name || optionData.definition || `${optionData.acronym} - ${optionData.license}`;
          selectEl.appendChild(option);
        });

        if (key === 'author' && userId) {
          selectEl.value = userId;
        } else if (key === 'owner' && institutionId) {
          selectEl.value = institutionId;
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error fetching Model select options:', error);
    bsAlert('Error fetching Model select options: ' + error.message, 'danger', 3000);
    return false;
  }
}