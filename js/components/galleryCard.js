export function createGalleryItem(item, client, onCollect = null, onUncollect = null, onRemove = null) {
  const itemEl = document.createElement('div');
  itemEl.className = 'galleryItem';
  itemEl.dataset.item = item.id;

  const header = document.createElement('div');
  header.className = 'card-header galleryCardHeader border-bottom';
  const imageUrl = `archive/thumb/${item.thumbnail}`;
  const placeholderUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-image" viewBox="0 0 16 16"><path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/><path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z"/></svg>';
  
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
  
  if(client === 'index' || client === 'collection'){
    let cutLen;
    if (screen.width < 577) { cutLen = 20; } 
    else if (screen.width < 1081) { cutLen = 50; }
    else if (screen.width < 1370) { cutLen = 80; } 
    else { cutLen = 100; }
    
    function cutString(str, len) { 
      return str.length > len ? str.slice(0, len) + '…' : str; 
    }
    body.innerHTML += `<p class="m-0 mb-1">${cutString(item.description, cutLen)}</p>`;
  }

  const footer = document.createElement('div');
  footer.className = 'card-footer d-flex justify-content-start align-items-center gap-2 border-top';

  const viewBtn = document.createElement('a');
  viewBtn.href = `artifact_view.php?item=${item.id}`;
  viewBtn.className = 'btn btn-sm btn-adc-blue text-white';
  viewBtn.textContent = 'View';
  footer.appendChild(viewBtn);


  const uncollectItemBtn = document.createElement('button');
  uncollectItemBtn.className = 'btn btn-sm btn-danger text-white uncollectItemBtn';
  uncollectItemBtn.dataset.item = item.id;
  uncollectItemBtn.textContent = 'Uncollect';

  // Pulsanti diversi per gallery e collection
  if (client === 'index') {
    const collectItemBtn = document.createElement('button');
    collectItemBtn.className = 'btn btn-sm btn-adc-blue text-white collectItemBtn';
    collectItemBtn.dataset.item = item.id;
    collectItemBtn.textContent = 'Collect';
    collectItemBtn.addEventListener('click', (event) => {
      event.preventDefault();
      onCollect(item, event.currentTarget);
    });
    
    uncollectItemBtn.style.display = 'none';
    uncollectItemBtn.addEventListener('click', (event) => {
      event.preventDefault();
      onUncollect(event.currentTarget);
    });

    footer.append(collectItemBtn, uncollectItemBtn);
    
  } else if (client === 'collection' && onUncollect) {
    uncollectItemBtn.addEventListener('click', (event) => {
      event.preventDefault();
      onUncollect(event.currentTarget);
    });

    footer.appendChild(uncollectItemBtn);
  }

  itemEl.append(header, body, footer);
  return itemEl;
}