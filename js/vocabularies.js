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
const deleteModalElement = document.getElementById
('deleteModal');
const deleteModal = new bootstrap.Modal(deleteModalElement);
const listTable = document.getElementById('listTable');
const listTableSelect = document.getElementById('listTableSelect');
const mainContent = document.getElementById('mainContent');
const mainContentText = document.getElementById('mainContentText');
const listValues = document.getElementById('listValues');
const info = document.getElementById('listInfo');
const newValueDiv = document.getElementById('newValueDiv');

const viewItemsDiv = document.getElementById('viewSpecificItems');
const closeItemsList = viewItemsDiv.querySelector('.btn-close');
const viewItemsTitle = viewItemsDiv.querySelector('h5');
closeItemsList.addEventListener('click', () => {viewItemsDiv.classList.remove('show');});

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
    if(viewItemsDiv.classList.contains('show')){
      viewItemsDiv.classList.remove('show');
    }
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
  if(info.classList.contains('d-none')){info.classList.remove('d-none');}
  if(newValueDiv.classList.contains('d-none')){newValueDiv.classList.remove('d-none');}
  try {
    const data = { table: value };
    const body = { class: 'Get', action: 'getVocabulary', ...data };
    const result = await fetchApi(ENDPOINT, 'POST', {}, body);
    if (result && result.data) {
      createTable(item, value, result.data);
    } else {
      console.error('Invalid data:', result);
    }
  } catch (error) {
    console.error('Error during API call:', error);
    throw error;
  }
}

function createTable(item, list,data) {  
  if(listValues.classList.contains('d-none')){listValues.classList.remove('d-none');}
  listValues.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'table';
  const thead = table.createTHead();
  const thRow = thead.insertRow();
  const tbody = table.createTBody();
  
  if(list === 'license'){ 
    buildLicenseTable(item,list, data, table, thRow, tbody);
  }
  else if (list === 'list_category_specs') {
    buildCategorySpecificationTable(item,list, data, thRow, tbody);
  }
  else if(list === 'list_material_specs'){
    buildMaterialSpecificationTable(item,list, data, thRow, tbody);
  }else{
    buildTable(item,list, data, thRow, tbody);
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
    Object.keys(obj).forEach(k => { if (k !== 'id' && k !== 'tot') { keys.add(k)} }); 
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

function buildTable(item, list, data, thRow, tbody){
  createNewValueForm(list);
  const arrayKeys = createThead(data, thRow);
  data.items.forEach((obj,i) => {
    const row = tbody.insertRow();
    arrayKeys.forEach(k => {
      const cell = row.insertCell();
      if (obj.hasOwnProperty(k)) {
        const input = createInput(obj[k],list, k, i);
        cell.appendChild(input);
      }
      else if (k === 'action') {  buildAction(item, list, cell, obj, i) } 
      else if (k === 'items') {  cell.textContent = obj.tot; } 
      else { cell.textContent = ''; }
    });
  });
  return {"thead": thRow, "tbody": tbody};
}

function buildCategorySpecificationTable(item,list, data, thRow, tbody) {
  createNewValueForm(list, data.lists);
  const arrayKeys = createThead(data, thRow);
  data.items.forEach((obj,i) => {
    const row = tbody.insertRow();
    arrayKeys.forEach(k => {
      const cell = row.insertCell();
      if (obj.hasOwnProperty(k)) {
        if (k === 'value') {
          const input = createInput(obj[k], list, 'value', i);
          cell.appendChild(input);
        }
        if (k === 'category_class') {
          const select = document.createElement('select');
          select.className = `form-select form-select-sm ${list}_input_${i}`;
          select.setAttribute('data-name','category_class');
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
      else if (k === 'action') { buildAction(item, list, cell, obj,i); } 
      else if (k === 'items') {  cell.textContent = obj.tot; }
      else { cell.textContent = ''; }
    });
  });
  return { thead: thRow, tbody: tbody };
}

function buildLicenseTable(item, list, data, table, thRow, tbody){
  data.items.forEach(item => { delete item.file; });
  createNewValueForm(list);
  const arrayKeys = createThead(data, thRow);
  table.style.width = '1250px';
  data.items.forEach((obj,i) => {
    const row = tbody.insertRow();
    arrayKeys.forEach(k => {
      const cell = row.insertCell();
      if (obj.hasOwnProperty(k)) {
        const input = createInput(obj[k], list, k, i);
        if(k === 'link'){
          const div = document.createElement('div');
          div.className = 'input-group';
          div.appendChild(input);
          const a = document.createElement('a');
          a.className = 'btn btn-sm btn-outline-secondary';
          a.href = obj[k];
          a.textContent = 'check link';
          a.setAttribute("target", "_blank");
          div.appendChild(a);
          cell.appendChild(div);
        }else{
          cell.appendChild(input);
        }
      } 
      else if (k === 'action') { buildAction(item, list, cell, obj, i);} 
      else if (k === 'items') { cell.textContent = obj.tot; }
      else { cell.textContent = ''; }
    });
  });
}
function buildMaterialSpecificationTable(item, list, data, thRow, tbody){
  createNewValueForm(list, data.lists);
  const arrayKeys = createThead(data, thRow);
  data.items.forEach((obj,i) => {
    const row = tbody.insertRow();
    arrayKeys.forEach(k => {
      const cell = row.insertCell();
      if (obj.hasOwnProperty(k)) {
        if (k === 'value') {
          const input = createInput(obj[k], list, k, i);
          cell.appendChild(input);
        }
        if (k === 'material_class') {
          const select = document.createElement('select');
          select.className = `form-select form-select-sm ${list}_input_${i}`;
          select.setAttribute('data-name', 'material_class');
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
      else if (k === 'action') { buildAction(item, list, cell, obj, i); } 
      else if (k === 'items') {  cell.textContent = obj.tot; }
      else { cell.textContent = ''; }
    });
  });
  return { thead: thRow, tbody: tbody };
}

function createNewValueForm(list, options = []){
  const form = document.querySelector('#newValueDiv form');
  form.innerHTML = '';
  const divCol = document.createElement('div');
  divCol.className = 'col-12';
  switch (list) {
    case 'list_category_specs':
      const lcsClass = divCol.cloneNode();
      const lcsValue = divCol.cloneNode();
      lcsClass.appendChild(createInputElement('form-select form-select-sm', 'category_class', '', true, 'select', options));
      lcsValue.appendChild(createInputElement('form-control form-control-sm', 'value', 'Enter new value', true, 'text' ));
      form.append(lcsClass,lcsValue);
      break;
      case 'license':
        const acronym = divCol.cloneNode();
        const license = divCol.cloneNode();
        const link = divCol.cloneNode();
        acronym.appendChild(createInputElement('form-control form-control-sm', 'acronym', 'new acronym', true, 'text' ));
        license.appendChild(createInputElement('form-control form-control-sm', 'license', 'new license', true, 'text' ));
        link.appendChild(createInputElement('form-control form-control-sm', 'link', 'new link', true, 'url' ));
        form.append(acronym,license,link);
        break;
    case 'list_material_specs':
      const lmsClass = divCol.cloneNode();
      const lmsValue = divCol.cloneNode();
      lmsClass.appendChild(createInputElement('form-select form-select-sm', 'material class', '', true, 'select', options));
      lmsValue.appendChild(createInputElement('form-control form-control-sm', 'value', 'new value', true, 'text' ));
      form.append(lmsClass,lmsValue);
      break;
    default:
      divCol.appendChild(createInputElement('form-control form-control-sm', 'value', 'Enter new value', true, 'text' ));
      form.appendChild(divCol);
      break;
  }

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn btn-sm btn-primary';
  submit.textContent = 'add value';
  const divSubmit = divCol.cloneNode();
  divSubmit.appendChild(submit);
  form.appendChild(divSubmit);

  submit.addEventListener('click', (e) => {
    e.preventDefault(); 
    if (form.reportValidity()) {
      const payload = {};
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach((input) => {
        const name = input.getAttribute('data-name');
        payload[name] = input.value;
      });

      addNewItem(list, payload);
    } else {
      console.warn('Form validation failed. Please fill out all required fields.');
    }
  });
}

async function addNewItem(list, payload){
  try {
    const body = { class: 'Vocabulary', action: 'addItem', table: list, ...payload };
    const result = await fetchApi(ENDPOINT, 'POST', {}, body);
    if (result && result.data) {
      const key = Object.keys(listArray).find(k => listArray[k] === list);
      getVocabulary(key, list);
      const toastClass = result.data.error === 0 ? "success" : "danger";
      showToast(result.data.message, toastClass, null);
    } else {
      console.error('Invalid data:', result);
    }
  } catch (error) {
    console.error('Error during API call:', error);
    throw error;
  }
}

async function updateVocabulary(data, list, index){
  try {
    const payload = {id: data.id, table: list};
    const input = document.querySelectorAll(`.${list}_input_${index}`);
    input.forEach((el,i) => {
      let name = el.getAttribute('data-name');
      payload[name] = el.value;
    });
    const body = { class: 'Vocabulary', action: 'updateItem', ...payload };
    const result = await fetchApi(ENDPOINT, 'POST', {}, body);
    if (result && result.data) {
      const key = Object.keys(listArray).find(k => listArray[k] === list);
      getVocabulary(key, list);
      const toastClass = result.data.error === 0 ? "success" : "danger";
      showToast(result.data.message, toastClass, null);
    } else {
      console.error('Invalid data:', result);
   }
  } catch (error) {
    console.error('Error during API call:', error);
    throw error;
  }
}

function deleteVocabularyItem(table,id){
  deleteModal.show();
  const delBtn = document.getElementById('deleteConfirmButton');
  delBtn.addEventListener('click', async () => {
    try {
      const data = { table:table, id:id };
      const body = { class: 'Vocabulary', action: 'deleteItem', ...data };
      const result = await fetchApi(ENDPOINT, 'POST', {}, body);
      if (result && result.data) {
        const key = Object.keys(listArray).find(k => listArray[k] === table);
        getVocabulary(key,table);
        deleteModal.hide();
        deleteModalElement.addEventListener('hidden.bs.modal', event => {
          const toastClass = result.data.error === 0 ? "success" : "danger";
          showToast(result.data.message, toastClass, null);
        })
      } else {
        console.error('Invalid data:', result);
      }
    } catch (error) {
      console.error('Error during API call:', error);
      throw error;
    }
  });
}

function buildAction(item, list, cell, obj, index){
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-sm btn-primary';
  saveBtn.textContent = 'save';
  saveBtn.addEventListener('click', (e) => { 
    e.preventDefault();
    updateVocabulary(obj, list, index); 
  });
  cell.appendChild(saveBtn);
  if(obj.tot === 0){
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-danger ms-2';
    delBtn.textContent = 'delete';
    delBtn.addEventListener('click', () => { deleteVocabularyItem(list,obj.id);});
    cell.appendChild(delBtn);
  }else{
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-sm btn-success ms-2';
    viewBtn.textContent = `view`;
    viewBtn.addEventListener('click', () => { getItemsFromValue(item, list, obj); });
    cell.appendChild(viewBtn);
  }
}

function createInput(value, className, dataName, index){
  const input = document.createElement('input');
  input.className = `form-control form-control-sm ${className}_input_${index}`;
  input.setAttribute('data-name',dataName);
  input.required = true;
  input.type = 'text';
  input.value = value;
  return input;
}

function createInputElement(className, dataName, placeholder = '', required = true, type = 'text', options = []) {
  let element;
  const setCommonAttributes = (el) => {
    el.className = className;
    el.setAttribute('data-name', dataName);
    if (required) { el.required = true; }
  };

  if (type === 'select') {
    element = document.createElement('select');
    setCommonAttributes(element);

    options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.id;
      opt.textContent = option.value;
      if (option.selected) { opt.selected = true;}
      element.appendChild(opt);
    });
  } else {
    element = document.createElement('input');
    setCommonAttributes(element);
    element.type = type;
    element.placeholder = placeholder;
  }
  return element;
}

async function getItemsFromValue(item, list, obj){
  try {
    const data = { object: list, value: obj.id };
    const body = { class: 'Get', action: 'getItemsFromValue', ...data };
    const result = await fetchApi(ENDPOINT, 'POST', {}, body);
    if (result && result.data) {
      const val = obj.value || obj.acronym;
      viewItemsTitle.textContent = `Items with "${val}" value for "${item}" list`;
      viewItemsDiv.classList.add('show');
      createTableFromValue(list, result.data.items);
    } else {
      console.error('Invalid data:', result);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('Response is not valid JSON. Check the API response:', error);
    } else {
      console.error('Error during API call:', error);
    }
    throw error;
  }
}

function createTableFromValue(list,items){    
  const thead = document.getElementById('listSpecificItemsThead');
  thead.innerHTML=''
  const tbody = document.getElementById('listSpecificItems');
  tbody.innerHTML=''
  const keys = new Set();
  items.forEach(obj => { Object.keys(obj).forEach(k => { if (k !== 'id' && k !== 'object_id') { keys.add(k)} }); });
  keys.add('link');
  const arrayKeys = Array.from(keys);
  arrayKeys.forEach(k => {
    const thCell = document.createElement('th');
    thCell.textContent = k;
    thead.appendChild(thCell);
  });
  items.forEach(obj => {
    const row = tbody.insertRow();
    arrayKeys.forEach(k => {
      const cell = row.insertCell();
      
      if(k === 'link') {
        const a = document.createElement('a');
        let link = '';
        if(list === 'list_institution_category'){ link = `institution_edit.php?item=${obj.id}`;}
        else if(list === 'list_model_acquisition'){link = `object_edit.php?model=${obj.id}&item=${obj.object_id}`;}
        else if(list === 'list_user_role' || list === 'list_person_position'){link = `person_edit.php?item=${obj.id}`;}
        else{link = `artifact_edit.php?item=${obj.id}`;}
        a.href = link;
        a.textContent = 'edit';
        a.className = 'btn btn-sm btn-adc-blue';
        cell.appendChild(a);
      } 
      else if(k === 'status') {
        cell.textContent = obj.status == 1 ? 'under processing' : 'complete data';
        cell.style.width = '150px';
      }
      else if (obj.hasOwnProperty(k)) { cell.textContent = obj[k]; }
      else { cell.textContent = ''; }
    });
  });
}