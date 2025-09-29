import { collectionState } from "../modules/collectionStorage.js";
import { cutString } from "../helpers/utils.js";

const stateManager = await collectionState();

export function createGalleryItem(item, onCollect = null, onUncollect = null, onRemove = null) {
  const currentState = stateManager.getState();
  const itemEl = document.createElement('div');
  itemEl.className = 'galleryItem';
  itemEl.dataset.item = item.id;

  const header = document.createElement('div');
  header.className = 'card-header galleryCardHeader border-bottom';
  const imageUrl = `archive/thumb/${item.thumbnail}`;
  const placeholderUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>image-remove</title><path fill="rgb(220,53,69)" d="M13.3 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V13.3C20.4 13.1 19.7 13 19 13C17.9 13 16.8 13.3 15.9 13.9L14.5 12L11 16.5L8.5 13.5L5 18H13.1C13 18.3 13 18.7 13 19C13 19.7 13.1 20.4 13.3 21M20.4 19L22.5 21.1L21.1 22.5L19 20.4L16.9 22.5L15.5 21.1L17.6 19L15.5 16.9L16.9 15.5L19 17.6L21.1 15.5L22.5 16.9L20.4 19Z" /></svg>';
  
  const thumbnail = document.createElement('img');
  thumbnail.className = 'cardImage';
  thumbnail.loading = "lazy";
  thumbnail.src = imageUrl;
  thumbnail.alt = item.name;
  thumbnail.onerror = function() {
    this.onerror = null;
    this.src = placeholderUrl;
    this.className = 'cardPlaceholder cardImage';
  };
  
  const headerTxt = document.createElement('p');
  headerTxt.className = 'txt-adc-dark fw-bold headerTxt';
  headerTxt.textContent = item.id;
  
  header.appendChild(thumbnail);
  header.appendChild(headerTxt);

  const body = document.createElement('div');
  body.className = 'card-body';
  body.innerHTML = `
    <h3 class="card-title txt-adc-dark fw-bold">${item.category}</h3>
    <p class="m-0 mb-1">${item.nation} / ${item.county}</p>
    <p class="m-0 mb-1">${item.institution}</p>
    <p class="m-0 mb-1">${item.start} / ${item.end}</p>
  `;
  
  let cutLen;
  if (screen.width < 577) { cutLen = 20; } 
  else if (screen.width < 1081) { cutLen = 50; }
  else if (screen.width < 1370) { cutLen = 80; } 
  else { cutLen = 100; }
    
  body.innerHTML += `<p class="m-0 mb-1">${cutString(item.description, cutLen)}</p>`;

  
  const viewBtn = document.createElement('a');
  viewBtn.href = `artifact_view.php?item=${item.id}`;
  viewBtn.className = 'btn btn-sm btn-adc-blue text-white';
  viewBtn.dataset.bsToggle = "tooltip";
  viewBtn.dataset.bsPlacement = "top";
  viewBtn.title = "View item details";
  viewBtn.textContent = 'View';
  
  const collectItemBtn = document.createElement('button');
  collectItemBtn.className = 'btn btn-sm btn-adc-blue text-white collectItemBtn';
  collectItemBtn.dataset.item = item.id;
  collectItemBtn.textContent = 'Collect';
  collectItemBtn.addEventListener('click', (event) => {
    event.preventDefault();
    if (onCollect) onCollect(item, event.currentTarget);
  });

  const uncollectItemBtn = document.createElement('button');
  uncollectItemBtn.className = 'btn btn-sm btn-danger text-white uncollectItemBtn';
  uncollectItemBtn.dataset.item = item.id;
  uncollectItemBtn.textContent = 'Uncollect';
  uncollectItemBtn.addEventListener('click', (event) => {
    event.preventDefault();
    if (onUncollect) onUncollect(event.currentTarget);
  });

  const inCollection = !!currentState.collectStatus[item.id];
  collectItemBtn.style.display = inCollection ? 'none' : 'inline-block';
  uncollectItemBtn.style.display = inCollection ? 'inline-block' : 'none';

  const footer = document.createElement('div');
  footer.className = 'card-footer d-flex justify-content-start align-items-center gap-2 border-top';
  footer.append(viewBtn, collectItemBtn, uncollectItemBtn);

  itemEl.append(header, body, footer);
  
  return itemEl;
}

export function getCollectStatusBtn() {
  const currentState = stateManager.getState();
  const newCollectStatus = {};
  if (currentState.activeCollection && Array.isArray(currentState.activeCollection.items)) {
    currentState.activeCollection.items.forEach(item => { newCollectStatus[item.id] = true; });
  }
  stateManager.updateState({ collectStatus: newCollectStatus });
  
  document.querySelectorAll('.galleryItem').forEach(card => {
    const itemId = card.dataset.item;
    updateGalleryCardButtons(itemId);
  });
}

function updateGalleryCardButtons(itemId) {
  const currentState = stateManager.getState();
  const galleryCard = document.querySelector(`.galleryItem[data-item="${itemId}"]`);
  if (galleryCard) {
    const collectBtn = galleryCard.querySelector('.collectItemBtn');
    const uncollectBtn = galleryCard.querySelector('.uncollectItemBtn');
    const inCollection = !!currentState.collectStatus[itemId];
    if (inCollection) {
      if (collectBtn) collectBtn.style.display = 'none';
      if (uncollectBtn) uncollectBtn.style.display = 'inline-block';
    } else {
      if (collectBtn) collectBtn.style.display = 'inline-block';
      if (uncollectBtn) uncollectBtn.style.display = 'none';
    }
  }
}