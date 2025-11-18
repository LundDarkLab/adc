import { getInstitutions } from "../../modules/institution.js";
import { map } from "../../modules/dashboard.js";

const user = document.getElementById('user').value;
const role = document.getElementById('role').value;
const institution = document.getElementById('institution').value;

export async function getInstitutionsList(filters={}) {
  const institutionDataWrap = document.getElementById('institutionDataWrap');
  const institutionStatusCount = document.getElementById('institutionStatusCount');
  const institutions = await getInstitutions(filters);
  institutionDataWrap.innerHTML = '';
  institutionStatusCount.textContent = institutions.length;
  
  if(institutions.length === 0){
    institutionDataWrap.innerHTML = '<p class="text-center">No institutions found with the selected filters.</p>';
    return;
  }

  institutions.forEach(institution => {
    const institutionCard = document.createElement('div');
    institutionCard.classList.add('card', 'mb-3');
    institutionDataWrap.appendChild(institutionCard);

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    const title = document.createElement('h6');
    title.classList.add('mb-0');
    title.textContent = institution.name;
    cardHeader.appendChild(title);
    institutionCard.appendChild(cardHeader);

    const bodyWrap = document.createElement('div');
    bodyWrap.classList.add('row', 'g-0');
    institutionCard.appendChild(bodyWrap);

    const logoWrap = document.createElement('div');
    logoWrap.classList.add('col-md-4', 'cardLogo');
    logoWrap.style.backgroundImage = institution.logo ? `url(img/logo/${institution.logo})` : 'url(img/logo/default.jpg)';
    bodyWrap.appendChild(logoWrap);

    const bodyContent = document.createElement('div');
    bodyContent.classList.add('col-md-8');
    bodyWrap.appendChild(bodyContent);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    bodyContent.appendChild(cardBody);

    const fields = [
      { label: 'Code' },
      { label: 'Category' },
      { label: 'Address' },
      { label: 'URL' },
      { label: 'Artifacts' },
    ];
    fields.forEach(field => {
      const div = document.createElement('div');
      div.classList.add('d-flex', 'justify-content-start', 'gap-2', 'mb-2');
      const label = document.createElement('strong');
      label.style.flexBasis = '60px';
      label.style.flexShrink = '0';
      label.textContent = `${field.label}:`;
      div.appendChild(label);
      
      let valueText = '';
      switch(field.label) {
        case 'Code':
          valueText = institution.abbreviation;
          break;
          case 'Category':
            valueText = institution.category;
            break;
        case 'Address':
          valueText = `<i class="mdi mdi-map-marker"></i> ${institution.address}, ${institution.city}`;
          break;
        case 'URL':
          valueText = institution.url ? `<a href="${institution.url}" target="_blank" rel="noopener noreferrer">${institution.url}</a>` : 'No URL';
          break;
        case 'Artifacts':
          valueText = institution.artifact_count;
          break;
      }

      const valueElement = document.createElement('div');
      valueElement.innerHTML = valueText;
      div.appendChild(valueElement);
      cardBody.appendChild(div);
    });

    const cardFooter = document.createElement('div');
    cardFooter.classList.add('card-footer', 'text-muted');
    const viewBtn = document.createElement('a');
    viewBtn.classList.add('btn', 'btn-sm', 'btn-adc-blue');
    viewBtn.textContent = 'View';
    viewBtn.href = `institution_view.php?item=${institution.id}`;
    cardFooter.appendChild(viewBtn);

    const goOnMapBtn = document.createElement('button');
    goOnMapBtn.classList.add('btn', 'btn-sm', 'btn-adc-blue', 'ms-2');
    goOnMapBtn.textContent = 'View on map';
    goOnMapBtn.addEventListener('click', () => {
      if(institution.lat && institution.lon){
        const mapWrap = document.getElementById('mapWrap');
        if (mapWrap) {
          const y = mapWrap.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        map.map.setView([institution.lat, institution.lon], 18);
      } else {
        alert('Location data not available for this institution.');
      }
    });
    cardFooter.appendChild(goOnMapBtn);

    if (Number(role) === 1 || (Number(role) === 2 && Number(institution) === institution.id)) {
      const editBtn = document.createElement('a');
      editBtn.classList.add('btn', 'btn-sm', 'btn-adc-blue', 'ms-2');
      editBtn.textContent = 'Edit';
      editBtn.href = `institution_edit.php?item=${institution.id}`;
      cardFooter.appendChild(editBtn);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'ms-2');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete the institution "${institution.name}"? This action cannot be undone.`)) {
          deleteInstitution(institution.id).then(() => {
            getInstitutions(filters);
          }).catch(err => {
            alert('Error deleting institution: ' + err.message);
          });
        }
      });
      cardFooter.appendChild(deleteBtn);
    }
    institutionCard.appendChild(cardFooter);
  });
  return institutions;
}