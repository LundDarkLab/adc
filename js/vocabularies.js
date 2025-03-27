const listArray = {
  "category class": 'list_category_class',
  "category specification": 'list_category_specs',
  "conservation state": 'list_conservation_state',
  "file type": 'list_file_type',
  "institution category":'list_institution_category',
  "license":'license',
  "material class":'list_material_class',
  "material specification":'list_material_specs',
  "model acquisition":'list_model_acquisition',
  "object condition":'list_object_condition',
  "person position":'list_person_position',
  "user role":'list_user_role'
};

const listTable = document.getElementById('listTable');
const listTableSelect = document.getElementById('listTableSelect');
const mainContent = document.getElementById('mainContent');
const mainContentText = document.getElementById('mainContentText');
const listValues = document.getElementById('listValues');

let activeItem = null;

Object.keys(listArray).forEach(function(key) {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = key;
  button.className = 'list-group-item list-group-item-action';
  listTable.appendChild(button);
  button.addEventListener('click', (ev)=>{
    const item = ev.target;
    if (activeItem) {activeItem.classList.remove('active');}
    item.classList.add('active');
    activeItem = item;
    getVocabulary(key,listArray[key]);
  });

  const option = document.createElement('option');
  option.innerHTML = key;
  option.value = listArray[key];
  listTableSelect.appendChild(option);
});

listTableSelect.addEventListener('change', (ev) => {
  const item = ev.target.options[ev.target.selectedIndex].text;
  const value = ev.target.value;
  getVocabulary(item, value);
});

async function getVocabulary(item, value) {
  if (mainContentText) { mainContentText.remove(); }
  try {
    const data = { table: value };
    const body = { class: 'Get', action: 'getVocabulary', ...data };
    const result = await fetchApi(ENDPOINT, 'POST', {}, body);
    if (result && result.data) {
      createTable(value, result.data);
    } else {
      console.error('Invalid data:', result);
    }
  } catch (error) {
    console.error('Error during API call:', error);
    throw error;
  }
}

function createTable(list,data) { 
  listValues.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'table';
  const thead = table.createTHead();
  const thRow = thead.insertRow();
  const tbody = table.createTBody();
  
  if(list === 'license'){ 
    buildLicenseTable(data, table, thRow, tbody);
  }
  else if (list === 'list_category_specs') {
    buildCategorySpecificationTable(data, thRow, tbody);
  }
  else if(list === 'list_material_specs'){
    buildMaterialSpecificationTable(data, thRow, tbody);
  }else{
    buildTable(data, thRow, tbody);
  }

  if (table instanceof Node) {
    listValues.appendChild(table);
  } else {
    console.error('Returned value is not a valid Node:', table);
  }
}

function createThead(data, thRow){
  const keys = new Set();
  data.items.forEach(obj => { 
    Object.keys(obj).forEach(k => {
      if (k !== 'id' && k !== 'tot') { keys.add(k)} 
    }); 
  });
  keys.add('items');
  keys.add('action');
  const arrayKeys = Array.from(keys);

  arrayKeys.forEach(k => {
    const thCell = document.createElement('th');
    thCell.textContent = k;
    thRow.appendChild(thCell);
  });
  return arrayKeys;
}

function buildTable(data, thRow, tbody){
  const arrayKeys = createThead(data, thRow);
  data.items.forEach(obj => {
    const row = tbody.insertRow();
    arrayKeys.forEach(k => {
      const cell = row.insertCell();
      if (obj.hasOwnProperty(k)) {
        const input = createInput(obj[k]);
        cell.appendChild(input);
      }
      else if (k === 'action') {  buildAction(cell, obj) } 
      else if (k === 'items') {  cell.textContent = obj.tot; } 
      else { cell.textContent = ''; }
    });
  });
  return {"thead": thRow, "tbody": tbody};
}

function buildCategorySpecificationTable(data, thRow, tbody) {
  const arrayKeys = createThead(data, thRow);
  data.items.forEach(obj => {
    const row = tbody.insertRow();
    arrayKeys.forEach(k => {
      const cell = row.insertCell();
      if (obj.hasOwnProperty(k)) {
        if (k === 'value') {
          const input = createInput(obj[k]);
          cell.appendChild(input);
        }
        if (k === 'category_class') {
          const select = document.createElement('select');
          select.className = 'form-select form-select-sm';
          select.id = 'category_class';
          select.required = true;
          data.lists.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.value;
            if (item.id === obj.category_class) { option.selected = true;}
            select.appendChild(option);
          });
          cell.appendChild(select);
        }
      } 
      else if (k === 'action') { buildAction(cell, obj); } 
      else if (k === 'items') {  cell.textContent = obj.tot; }
      else { cell.textContent = ''; }
    });
  });
  return { thead: thRow, tbody: tbody };
}

function buildLicenseTable(data, table, thRow, tbody){
  const arrayKeys = createThead(data, thRow);
  const th = thRow.querySelectorAll('th');
  if (th.length > 0) {
    th[0].style.width = '120px';
    th[1].style.width = '300px';
    th[2].style.width = '400px';
    th[3].style.width = '250px';
    th[5].style.width = '180px';
  } else {
    console.warn('No <th> elements found in thead row.');
  }
  table.style.width = '1250px';
  data.items.forEach(obj => {
    const row = tbody.insertRow();
    arrayKeys.forEach(k => {
      const cell = row.insertCell();
      if (obj.hasOwnProperty(k)) {
        const input = createInput(obj[k]);
        if(k === 'link'){
          const div = document.createElement('div');
          div.className = 'input-group';
          div.appendChild(input);
          const a = document.createElement('a');
          a.className = 'btn btn-sm btn-outline-secondary';
          a.href = obj[k];
          a.textContent = 'link';
          div.appendChild(a);
          cell.appendChild(div);
        }else{
          cell.appendChild(input);
        }
      } 
      else if (k === 'action') { buildAction(cell, obj);} 
      else if (k === 'items') { cell.textContent = obj.tot; }
      else { cell.textContent = ''; }
    });
  });
}
function buildMaterialSpecificationTable(data, thRow, tbody){
  const arrayKeys = createThead(data, thRow);
  data.items.forEach(obj => {
    const row = tbody.insertRow();
    arrayKeys.forEach(k => {
      const cell = row.insertCell();
      if (obj.hasOwnProperty(k)) {
        if (k === 'value') {
          const input = createInput(obj[k]);
          cell.appendChild(input);
        }
        if (k === 'material_class') {
          const select = document.createElement('select');
          select.className = 'form-select form-select-sm';
          select.id = 'material_class';
          select.required = true;
          data.lists.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.value;
            if (item.id === obj.material_class) { option.selected = true;}
            select.appendChild(option);
          });
          cell.appendChild(select);
        }
      } 
      else if (k === 'action') { buildAction(cell, obj); } 
      else if (k === 'items') {  cell.textContent = obj.tot; }
      else { cell.textContent = ''; }
    });
  });
  return { thead: thRow, tbody: tbody };
}

function updateVocabulary(data){
  console.log('updateVocabulary:', data);
}

function deleteVocabulary(data){
  console.log('deleteVocabulary:', data);
}

function buildAction(cell, obj){
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-sm btn-primary';
  saveBtn.textContent = 'save';
  saveBtn.addEventListener('click', () => { updateVocabulary(obj);});
  cell.appendChild(saveBtn);
  if(obj.tot === 0){
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-danger ms-2';
    delBtn.textContent = 'delete';
    delBtn.addEventListener('click', () => { deleteVocabulary(obj);});
    cell.appendChild(delBtn);
  }else{
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-sm btn-success ms-2';
    viewBtn.textContent = `view`;
    viewBtn.addEventListener('click', () => { console.log('view:', obj);});
    cell.appendChild(viewBtn);
  }
}

function createInput(v){
  const input = document.createElement('input');
  input.className = 'form-control form-control-sm';
  input.type = 'text';
  input.value = v;
  return input;
}