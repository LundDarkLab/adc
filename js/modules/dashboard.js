import { showLoading } from "../helpers/helper.js";
import { getValidatedValue, cutString } from "../helpers/utils.js";
import { artifactIssues } from "../components/artifact_issues.js";
import { getArtifacts } from "../components/dashboard/artifactList.js";
import { getModels } from "../components/dashboard/modelList.js";
import { getInstitutionsList } from "../components/dashboard/institutionList.js";
import { getPersonsList } from "../components/dashboard/personsList.js";
import { dashboardMap } from "../components/dashboard/dashboardMap.js";
import { addInstitutionMarkers } from "../helpers/mapHelper.js";

import { initFilters } from "../components/dashboard/dashboard_filters.js";

const userId = parseInt(document.getElementById('user').value);
const isLoggedUser = userId && userId !== 'unregistered' && !isNaN(Number(userId));
export let map = null;
export async function initDashboard() {
  showLoading(true);
  // await artifactIssues();
  await initFilters();
  map = await dashboardMap();  
  setDefaultFilters();
  applyFilters('artifact');
  applyFilters('model');
  applyFilters('institution');
  applyFilters('person');
  showLoading(false);
}

function setDefaultFilters() {
  document.getElementById('artifactByPerson').value = userId;
  document.getElementById('modelByPerson').value = userId;
}

export async function applyFilters(element){
  showLoading(true);
  const filters = {
    artifact: {
      status: getValidatedValue('artifactStatus', 'int'),
      owner: getValidatedValue('artifactByInstitution', 'int'),
      author: getValidatedValue('artifactByPerson', 'int'),
      description: getValidatedValue('artifactByDescription', 'string')
    },
    model: {
      status_id: getValidatedValue('modelStatus', 'int'),
      owner_id: getValidatedValue('modelByInstitution', 'int'),
      author_id: getValidatedValue('modelByPerson', 'int'),
      to_connect: getValidatedValue('modelToConnect', 'int'),
      description: getValidatedValue('modelByDescription', 'string')
    },
    institution: {
      category: getValidatedValue('institutionByCategory', 'int'),
      location: getValidatedValue('institutionByLocation', 'int'),
      description: getValidatedValue('institutionByDescription', 'string')
    },
    person: {
      status: getValidatedValue('personByStatus', 'int'),
      role: getValidatedValue('personByUserClass', 'int'),
      institution: getValidatedValue('personByInstitution', 'int'),
      name: getValidatedValue('personByDescription', 'string')
    }
  };

  Object.keys(filters[element]).forEach(key => {
    if (filters[element][key] === undefined) {
      delete filters[element][key];
    }
  });

  switch (element) {
    case 'artifact':
      getArtifacts(filters.artifact);
      break;
    case 'model':
      getModels(filters.model);
      break;
    case 'institution':
      const institutions = await getInstitutionsList(filters.institution);
      addInstitutionMarkers(map, { error: 0, data: { items: institutions } });
      break;
    case 'person':
      await getPersonsList(filters.person);
      break;  
    default:
      break;
  }
  showLoading(false);
}
