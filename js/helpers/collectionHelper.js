export function toggleCollectionListBtn(stateManager,onShowCollection = async () => {}, setActiveCollection = async () => {}) {
  const currentState = stateManager.getState();
  let listCollection = getCollectionList(stateManager);  // Assumi che getCollectionList sia spostata o importata
  let showCollectionBtn = listCollection.length > 1;
  const changeCollectionDropdown = document.getElementById('changeCollectionDropdown');
  if (changeCollectionDropdown) {
    changeCollectionDropdown.style.display = showCollectionBtn ? 'block' : 'none';
  }
  fillCollectionList(listCollection, currentState.activeCollectionKey, stateManager, onShowCollection, setActiveCollection);
}

function fillCollectionList(list, activeKey, stateManager, onShowCollection, setActiveCollection) {
  const collectionListDropdown = document.getElementById('collectionListDropdown');
  if (!collectionListDropdown) return;
  collectionListDropdown.innerHTML = '';
  
  list.forEach((collection) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = collection.title || 'Untitled Collection';
    btn.classList.add('dropdown-item');
    if (collection.key === activeKey) {
      btn.classList.add('active');
      const collectionTitleBtn = document.getElementById('collectionTitleBtn');
      if (collectionTitleBtn) collectionTitleBtn.textContent = collection.title || 'Untitled Collection';
    }
    btn.onclick = async () => {
      document.querySelectorAll('#collectionListDropdown .dropdown-item.active').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      await setActiveCollection(collection.key);
      await onShowCollection();
    };
    li.appendChild(btn);
    collectionListDropdown.appendChild(li);
  });
}

function getCollectionList(stateManager) {
  const currentState = stateManager.getState();
  const obj = currentState.collectionList || {};
  const list = [];
  Object.keys(obj).forEach(key => {
    const collection = currentState.collections[key];
    if (collection && collection.metadata) {
      list.push({key, title: collection.metadata.title});
    }
  });
  return list;
}