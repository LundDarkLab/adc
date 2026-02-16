import { modelList } from "../modelComponents.js";
import { cutStringByWords } from '../../helpers/utils.js';
import { bsPopovers } from '../bsComponents.js';

const user = document.getElementById('user').value;
const role = document.getElementById('role').value;
const institution = document.getElementById('institution').value;

export async function getModels(filters={}){
  const modelDataWrap = document.getElementById('modelDataWrap');
  const modelStatusCount = document.getElementById('modelStatusCount');
  const models = await modelList(filters);
  modelDataWrap.innerHTML = '';
  modelStatusCount.textContent = models.length;
  if(models.length === 0){
    const emptyMessage = document.createElement('p');
    emptyMessage.classList.add('text-center', 'empty-models-message');
    emptyMessage.textContent = 'No models found with the selected filters.';
    modelDataWrap.appendChild(emptyMessage);
    return;
  }
  models.forEach(model => {
    const card = document.createElement('div');
    card.classList.add('card');
    modelDataWrap.appendChild(card);

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    cardHeader.style.height = '150px';
    card.appendChild(cardHeader);

    const img = document.createElement('img');
    img.src = `archive/thumb/${model.thumbnail}`;
    img.classList.add('card-img-top', 'h-100', 'w-100', 'object-fit-contain');
    img.alt = `Thumbnail of ${model.name}`;
    cardHeader.appendChild(img);

    const cardBody = document.createElement('ul');
    cardBody.classList.add('card-body');
    card.appendChild(cardBody);
    const fields = [
      { label: 'Model ID', value: model.id },
      { label: 'Model object', value: model.model },
      { label: 'Author', value: model.author },
      { label: 'Institution', value: model.owner },
      { label: 'Last update', value: model.last_update },
      { label: 'Description', value: model.description },
    ];

    fields.forEach(field => {
      const div = document.createElement('div');
      div.classList.add('d-flex', 'justify-content-start', 'gap-2', 'mb-2', 'border-bottom');
      const label = document.createElement('strong');
      label.style.flexBasis = '80px';
      label.style.flexShrink = '0';
      label.textContent = `${field.label}:`;
      div.appendChild(label);

      let valueElement;
      const valueText = field.value;
      if(field.label === 'Description' && valueText.split(/\s+/).length >= 50){
        const truncatedText = cutStringByWords(valueText, 20);
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

    const cardFooter = document.createElement('div');
    cardFooter.classList.add('card-footer');
    card.appendChild(cardFooter);

    const viewBtn = document.createElement('a');
    viewBtn.href = `model_view.php?item=${model.id}`;
    viewBtn.classList.add('btn', 'btn-sm', 'btn-adc-blue');
    viewBtn.textContent = 'View';
    cardFooter.appendChild(viewBtn);

    if (
      Number(user) === model.author_id || 
      Number(role) === 1 || 
      (Number(role) === 2 && Number(institution) === model.owner_id)
    ){
      const editBtn = document.createElement('a');
      editBtn.classList.add('btn', 'btn-sm', 'btn-adc-blue', 'ms-2');
      editBtn.textContent = 'Edit';
      editBtn.href = `model_edit.php?item=${model.id}`;
      cardFooter.appendChild(editBtn);
      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'ms-2');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete the current model? This action cannot be undone.`)) {
        deleteModel(model.id).then(() => {
          getModels(filters);
        }).catch(err => {
          alert('Error deleting model: ' + err.message);
        });
      }
    });
    cardFooter.appendChild(deleteBtn);
    }
  });
  bsPopovers();
}