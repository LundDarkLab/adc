import { cutStringByWords } from "../../../helpers/utils.js";
import { fetchApi } from "../../../shared/utils/fetch.js";

const container = document.getElementById('modelsCard');

export async function renderModelCard(author) {
  const payload = {
    class: 'Model',
    action: 'modelList',
    author_id: author
  };
  try {
    const response = await fetchApi({body:payload});
    if(response?.error === 1 || response?.data.error === 1){
      throw new Error("Error fetching models: " + response.message);
    }
    if(response?.data?.length === 0){
      renderNoModelCard();
      return;
    }
    console.log("modelList:", response);
    const models = response.data;
    const title = document.createElement('h5');
    title.classList.add('p-3','m-0', 'bg-light', 'border','border-bottom-0', 'rounded-top');
    title.innerHTML = `Models created <span class="badge text-bg-dark float-end">${models.length}</span>`;
    container.appendChild(title);

    const modelsWrap = document.createElement('div');
    modelsWrap.id = 'modelsWrap';
    modelsWrap.classList.add('p-3', 'border', 'objWrap');
    container.appendChild(modelsWrap);
    
    models.forEach(model => {
      const modelCard = document.createElement('div');
      modelCard.classList.add('card');
      const statusColor = model.status_id === 1 ? 'warning' : 'success';
      const description = cutStringByWords(model.description, 30);
      modelCard.innerHTML = `
        <div class="card-header model-header">
          <img src="archive/thumb/${model.thumbnail}" class="card-img-top h-100 w-100 object-fit-contain" alt="Thumbnail of ${model.name}">
          <span class="badge position-absolute top-0 start-0 m-2 text-bg-light">ID: ${model.model}</span>
        </div>
        <div class="card-body p-0">
          <ul class="list-group list-group-flush">
            <li class="list-group-item">
              <span class="p-1 text-center d-block alert alert-${statusColor}">${model.status}</span>
            </li>
            <li class="list-group-item d-flex justify-content-start gap-2">
              <small class="d-block fw-bold flex-basis: 80px; flex-shrink: 0;">Name: </small>
              <small class="card-text">${model.name}</small>
            </li>
            <li class="list-group-item d-flex justify-content-start gap-2">
              <small class="d-block fw-bold flex-basis: 80px; flex-shrink: 0;">Name: </small>
              <small class="card-text">${model.owner}</small>
            </li>
            <li class="list-group-item">
              <small class="d-block fw-bold">Description</small>
              <small class="card-text">${description}</small>
            </li>
          </ul>
        </div>
        <div class="card-footer">
          <a href="model_view.php?item=${model.model}" class="btn btn-sm btn-adc-blue">View Model</a>
        </div>
      `;

      /*
  <ul class="card-body">
    <div class="d-flex justify-content-start gap-2 mb-2 border-bottom">
      <strong style="flex-basis: 80px; flex-shrink: 0;">Model ID:</strong>
      <span>534</span>
    </div>
    <div class="d-flex justify-content-start gap-2 mb-2 border-bottom"><strong style="flex-basis: 80px; flex-shrink: 0;">Model object:</strong><span>529</span></div><div class="d-flex justify-content-start gap-2 mb-2 border-bottom"><strong style="flex-basis: 80px; flex-shrink: 0;">Model name:</strong><span>gargoTest</span></div><div class="d-flex justify-content-start gap-2 mb-2 border-bottom"><strong style="flex-basis: 80px; flex-shrink: 0;">Author:</strong><span>Giuseppe Naponiello</span></div><div class="d-flex justify-content-start gap-2 mb-2 border-bottom"><strong style="flex-basis: 80px; flex-shrink: 0;">Institution:</strong><span>Lund University Historical Museum</span></div><div class="d-flex justify-content-start gap-2 mb-2 border-bottom"><strong style="flex-basis: 80px; flex-shrink: 0;">Last update:</strong><span>2025-11-18</span></div><div class="d-flex justify-content-start gap-2 mb-2 border-bottom"><strong style="flex-basis: 80px; flex-shrink: 0;">Description:</strong><a class="d-inline-block text-black" tabindex="0" style="cursor: pointer;" title="" data-bs-toggle="popover" data-bs-trigger="click" data-bs-placement="top" data-bs-content="lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. 
lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.">lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut...</a></div></ul><div class="card-footer"><a href="model_view.php?item=534" class="btn btn-sm btn-adc-blue">View</a><a class="btn btn-sm btn-adc-blue ms-2" href="model_edit.php?item=534">Edit</a><button class="btn btn-sm btn-danger ms-2">Delete</button></div></div>
      */
      modelsWrap.appendChild(modelCard);
    });
  } catch (error) {
    console.error("Error fetching models for author " + author + ": " + error);
  }
  
}

function renderNoModelCard() {
  if (!container) {
    console.error('Models container element not found');
    return;
  }
  container.innerHTML = `<div id="noModels" class="alert alert-info">No models created by user</div>`;
}