import { artifactList } from "../artifactComponents.js";
import { cutStringByWords } from '../../helpers/utils.js';
import { bsPopovers } from '../bsComponents.js';
import { confirmAction } from "../../helpers/helper.js";
import { deleteArtifact } from "../../features/artifact/api/artifactApi.js";
import { bsAlert } from "../../components/bsComponents.js";

const user = document.getElementById('user').value;
const role = document.getElementById('role').value;
const institution = document.getElementById('institution').value;

export async function getArtifacts(filters={}){
  const artifactDataWrap = document.getElementById('artifactDataWrap');
  const artifactStatusCount = document.getElementById('artifactStatusCount');
  const artifacts = await artifactList(filters);
  artifactDataWrap.innerHTML = '';
  artifactStatusCount.textContent = artifacts.length;
  
  if(artifacts.length === 0){
    artifactDataWrap.innerHTML = '<p class="text-center">No artifacts found with the selected filters.</p>';
    return;
  }

  artifacts.forEach(artifact => {
    const artifactCard = document.createElement('div');
    artifactCard.classList.add('card', 'mb-3');
    artifactDataWrap.appendChild(artifactCard);

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header', 'd-flex', 'justify-content-between', 'align-items-center');
    const title = document.createElement('h6');
    title.classList.add('mb-0');
    title.textContent = artifact.name || 'Unnamed Artifact';
    cardHeader.appendChild(title);
    const lastUpdate = document.createElement('small');
    lastUpdate.textContent = artifact.last_update;
    cardHeader.appendChild(lastUpdate);
    artifactCard.appendChild(cardHeader);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const fields = [
      { label: 'Institution', value: artifact.institution },
      { label: 'Author', value: artifact.author },
      { label: 'Description', value: artifact.description },
    ];

    fields.forEach(field => {      
      const div = document.createElement('div');
      div.classList.add('d-flex', 'justify-content-start', 'gap-2', 'mb-2', 'border-bottom');
      const label = document.createElement('strong');
      label.style.flexBasis = '100px';
      label.style.flexShrink = '0';
      label.textContent = `${field.label}:`;
      div.appendChild(label);
      
      let valueElement;
      const valueText = field.value || `No ${field.label.toLowerCase()}`;

      if(field.label === 'Description' && valueText.split(/\s+/).length >= 50){
        const truncatedText = cutStringByWords(valueText, 50);
        valueElement = document.createElement('a');
        valueElement.innerHTML = truncatedText; 
        valueElement.classList.add('d-inline-block', 'text-black' );
        valueElement.tabIndex = 0;
        valueElement.style.cursor = 'pointer';
        valueElement.title = 'Click to see full description';
        valueElement.setAttribute('data-bs-toggle', 'popover');
        valueElement.setAttribute('data-bs-trigger', 'click');
        valueElement.setAttribute('data-bs-placement', 'top');
        valueElement.setAttribute('data-bs-content', valueText);
        valueElement.setAttribute('title', '');
      } else {
        valueElement = document.createElement('span');
        valueElement.innerHTML = valueText;
      }
      div.appendChild(valueElement);
      cardBody.appendChild(div);
    });
    artifactCard.appendChild(cardBody);

    const cardFooter = document.createElement('div');
    cardFooter.classList.add('card-footer');
    const viewBtn = document.createElement('a');
    viewBtn.classList.add('btn', 'btn-sm', 'btn-adc-blue');
    viewBtn.textContent = 'View';
    viewBtn.href = `artifact_view.php?item=${artifact.id}`;
    cardFooter.appendChild(viewBtn);

    if (Number(user) === artifact.author_id || Number(role) === 1 || (Number(role) === 2 && Number(institution) === artifact.institution_id)) {
      const editBtn = document.createElement('a');
      editBtn.classList.add('btn', 'btn-sm', 'btn-adc-blue', 'ms-2');
      editBtn.textContent = 'Edit';
      editBtn.href = `artifact_edit.php?item=${artifact.id}`;
      cardFooter.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'ms-2');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', async () => {
        await confirmAction(
          `Are you sure you want to delete the artifact "${artifact.name}"? This action cannot be undone.`, 
          async () => {
            try {
              const response = await deleteArtifact(artifact.id);
              if (response.error === 1) {
                bsAlert(response.message, 'danger');
              } else {
                bsAlert(response.data.message, 'success', 3000, () => { getArtifacts(filters); });
              }
            } catch (err) {
              bsAlert('Error deleting artifact: ' + err.message, 'danger');
            }
          }
        );
        // if (confirm(`Are you sure you want to delete the artifact "${artifact.name}"? This action cannot be undone.`)) {
        //   deleteArtifact(artifact.id).then(() => {
        //     getArtifacts(filters);
        //   }).catch(err => {
        //     alert('Error deleting artifact: ' + err.message);
        //   });
        // }
      });
      cardFooter.appendChild(deleteBtn);
    }

    artifactCard.appendChild(cardFooter);

  });
  bsPopovers();
}