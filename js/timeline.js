const timeLineTable = document.querySelector('#timeLineTable tbody');
const timeLineSelect = document.getElementById('listTableSelect');
const mainContentText = document.getElementById('mainContentText');
const listInfo = document.getElementById('listInfo');
const toggleAlert = document.getElementById('toggleAlert');
const newTimeLineBtn = document.getElementById('newTimeLineBtn');
const toolbar = document.getElementById('toolbar');
const dataWrap = document.getElementById('dataWrap');

const genericSet = new Set();
const specificSet = new Set();
const rowsData = [];


document.addEventListener('DOMContentLoaded', ()=>{
  buildTimelineList();
  newTimeLineBtn.addEventListener('click', newTimeLine);
  if(timeLineTable){
    timeLineTable.addEventListener('click', function(event) {
      const rows = timeLineTable.querySelectorAll('td');
      rows.forEach(row => { row.classList.remove('selectedRow'); });
      const clickedRow = event.target.closest('tr');
      if (clickedRow) {
        const cells = clickedRow.querySelectorAll('td')
        cells.forEach(td =>{td.classList.add('selectedRow');})
          
        const timelineId = clickedRow.getAttribute('data-id');
        getTimelineDetails(timelineId);
      }
    });
  }
  if(timeLineSelect){
    timeLineSelect.addEventListener('change', ()=>{
      getTimelineDetails(timeLineSelect.value)
    })
  }

  if(toggleAlert){
    toggleAlert.addEventListener('click', function() {
      listInfo.classList.contains('hidden') 
        ? listInfo.classList.remove('hidden')
        : listInfo.classList.add('hidden');
    });
  }
})

function createToggle(){
  const toggleInfoBtn = document.createElement('button');
  toggleInfoBtn.innerText = 'toggle Info';
  toggleInfoBtn.classList.add('btn','btn-sm','btn-light', 'float-end');
  toggleInfoBtn.setAttribute('id', 'toggleAlert');
  toggleInfoBtn.setAttribute('type', 'button');
  toggleInfoBtn.addEventListener('click', function() {
      listInfo.classList.contains('hidden') 
        ? listInfo.classList.remove('hidden')
        : listInfo.classList.add('hidden');
    });
  return toggleInfoBtn;
}
async function buildTimelineList() {
  try {
    const payload = {class: 'Timeline',  action: 'getTimelineList'}
    const result = await fetchApi(ENDPOINT, 'POST', {}, payload);
    if (result && result.data) {
      const timelines = result.data;
      console.log("timelines", timelines);
      
      const rows = timelines.map(timeline => {
        const color = timeline.state === 'draft' ? 'text-danger' : 'text-success';
        return `
          <tr data-id="${timeline.id}">
            <td>${timeline.definition}</td>
            <td class="${color}">${timeline.state}</td>
          </tr>
        `;
      }).join('');
      timeLineTable.innerHTML = rows;

      const options = [
        `<option value="" selected disabled>-- Select an option --</option>`,
        ...timelines.map(timeline => {
          return `<option value="${timeline.id}">${timeline.definition} (${timeline.state})</option>`;
        })
      ];
      timeLineSelect.innerHTML = options.join('');
    } else {
      console.error('No data found in the response');
    }
    
  } catch (error) {
    console.error('Error building timeline list:', error);
    throw error;
  }
}

async function newTimeLine() {
  if(mainContentText){mainContentText.remove()}
  hiddenElement = document.querySelectorAll('.hidden');
  hiddenElement.forEach((element) => { if(element){element.classList.remove('hidden');}});
  
  if(toolbar){
    toolbar.innerHTML='';
    toolbar.append(createToggle());
  }
  if(listInfo){
    listInfo.innerHTML = `Insert user guide for create new timeline.`;
  }
  if(dataWrap){
    dataWrap.innerHTML = '';
    const formElement = await newTimelineForm();
    dataWrap.appendChild(formElement);
  }
  if(timeLineTable){
    const rows = timeLineTable.querySelectorAll('td');
    rows.forEach(row => { row.classList.remove('selectedRow'); });
  }
}

async function getTimelineDetails(timelineId) {
  try {
    const payload = {class: 'Timeline', action: 'getTimelineDetails', timelineId: timelineId};
    const result = await fetchApi(ENDPOINT, 'POST', {}, payload);
    if (result && result.data) {
      const timelineDetails = result.data;
      if(mainContentText){mainContentText.remove()}

      toolbar.innerHTML='';
      
      listInfo.innerHTML = `To make the change effective, press the “Save” button.<br>The “entries” column indicates the records that use that specific value. To permanently delete an entry from the list, there must be no records associated with the entry, so you must edit the records before deleting them.<br>Click the “View” button to display the list of records that are using the selected value.`;

      ['name','macro','generic','specific'].forEach((field) => {
        const button = document.createElement('a');
        button.innerText = field;
        button.classList.add('btn','btn-sm','btn-light');
        button.style.margin = '5px';
        button.setAttribute('href', `#${field}`);
        button.setAttribute('role','button');
        toolbar.append(button);
      });  
      
      toolbar.append(createToggle());
      
      hiddenElement = document.querySelectorAll('.hidden');
      hiddenElement.forEach((element) => { if(element){element.classList.remove('hidden');}});

      timelineComplete(timelineDetails);
    } else {
      console.error('No data found in the response');
    }
  } catch (error) {
    console.error('Error fetching timeline details:', error);
    throw error;
  }
}

// Main function to create the new timeline form
async function newTimelineForm() {
  const newTimelineForm = buildForm();
  const macroSelect = newTimelineForm.querySelector('#macro');
  await populateMacroDropdown(macroSelect);
  newTimelineForm.querySelector('#addTimeRowBtn').addEventListener('click', handleAddRow);
  return newTimelineForm;
}

// Function to fetch and populate the macro dropdown
async function populateMacroDropdown(macroSelect) {
  try {
    const payload = { class: 'Timeline', action: 'getMacroList' };
    const result = await fetchApi(ENDPOINT, 'POST', {}, payload);

    if (result.error === 1) {
      console.error('Error fetching macro list:', result.message);
      throw new Error(result.message);
    }

    const sortedData = result.data.sort((a, b) => a.id - b.id);
    macroSelect.innerHTML = createDropdownOptions(sortedData);
  } catch (error) {
    console.error('Error populating macro dropdown:', error);
    throw error;
  }
}

// Helper function to create dropdown options
function createDropdownOptions(data, defaultOptionText = "-- Select a value --") {
  const options = data.map(item => `<option value="${item.id}">${item.definition}</option>`).join('');
  return `<option value="" selected disabled>${defaultOptionText}</option>${options}`;
}

// Function to handle adding a new row to the timeline table
function handleAddRow(event) {
  event.preventDefault();
  
  const timelineForm = document.getElementById('timelineForm');
  const formData = new FormData(timelineForm);
  const macroSelect = document.getElementById('macro');

  //The `?.` operator ensures that the code does not throw an error if `macroSelect.options[macroSelect.selectedIndex]` is `undefined`. If the selected option exists, it proceeds to access the `text` property of that option. If it doesn’t exist, the expression evaluates to `undefined` instead of throwing an error.
  const data = {
    macro_id: formData.get('macro'),
    macro_text: macroSelect.options[macroSelect.selectedIndex]?.text || '', 
    generic: formData.get('generic'),
    specific: formData.get('specific'),
    start: formData.get('start'),
    end: formData.get('end'),
  };

  if(!validateData(data)){return false;}

  const tbody = document.getElementById('newTimeLineTableBody');
  tbody.innerHTML = "";
  rowsData.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.macro_text}</td><td>${row.generic}</td><td>${row.specific}</td><td>${row.start}</td><td>${row.end}</td><td><button class="btn btn-sm btn-adc-blue">remove</button></td>`;

    tr.querySelector('button').addEventListener('click', function() {
      tr.remove();
      const index = rowsData.findIndex(r => r.specific === row.specific);
      if (index !== -1) {
        rowsData.splice(index, 1);
        genericSet.delete(row.generic);
        specificSet.delete(row.specific);
      }
      resetFormAndUpdateDatalist(
        timelineForm,
        [data.generic],
        'genericList',
        'generic'
      );

      countRows();
    });
    tbody.appendChild(tr);
  });

  resetFormAndUpdateDatalist(
    timelineForm,
    [data.generic],
    'genericList',
    'generic'
  );
}

function validateData(data) {
  const { macro_id, macro_text, generic, specific, start, end } = data;

  if (!macro_id || !generic || !specific || !start || !end) {
    showToast('All fields are required. Please fill in Generic, Specific, Start, and End.', 'warning');
    return false;
  }

  if (isNaN(start) || isNaN(end)) {
    showToast('Start and End must be valid numbers.', 'danger');
    return false;
  }

  if (parseInt(start) >= parseInt(end)) {
    showToast('Start must be less than End. Please adjust the values.', 'warning');
    return false;
  }

  if (specificSet.has(specific)) {
    showToast(`The value "${specific}" for Specific must be unique. Please choose a different value.`, 'danger');
    return false;
  }

  // Check for invalid overlaps
  const overlap = rowsData.some(row => {
    const rowStart = parseInt(row.start);
    const rowEnd = parseInt(row.end);

    // Disallow strict overlaps
    if (start === rowStart && end === rowEnd) {
      showToast(`The range ${start}-${end} overlaps exactly with an existing range.`, 'danger');
      return true;
    }

    // Disallow ranges completely within an existing range
    if (start >= rowStart && end <= rowEnd) {
      showToast(`The range ${start}-${end} is completely within an existing range ${rowStart}-${rowEnd}.`, 'danger');
      return true;
    }

    // Disallow start being equal to an existing end
    if (parseInt(start) === parseInt(rowEnd)) {
      showToast(`The Start value ${start} cannot be equal to the End value of an existing range (${rowStart}-${rowEnd}).`, 'danger');
      return true;
    }

    return false;
  });

  if (overlap) { return false; }

  rowsData.push({ macro_id, macro_text, generic, specific, start, end });
  rowsData.sort((a, b) => a.start - b.start);
  genericSet.add(generic);
  specificSet.add(specific);

  countRows();  

  return true;
}

function resetFormAndUpdateDatalist(form, data, datalistId, inputId) {
  form.reset();

  const datalist = document.getElementById(datalistId);
  const input = document.getElementById(inputId);

  // Add unique options to the datalist
  const uniqueOptions = [...new Set(data)];
  datalist.innerHTML = uniqueOptions.map(option => `<option value="${option}">${option}</option>`).join('');

  // Update the input's datalist
  input.innerHTML = '';
  uniqueOptions.forEach(option => {
    const newOption = document.createElement('option');
    newOption.value = option;
    newOption.textContent = option;
    input.appendChild(newOption);
  });
}

function timelineComplete(timelineDetails){
  dataWrap.innerHTML='';
  const tableDiv = document.createElement('div');
  tableDiv.className = 'table-responsive';
  tableDiv.setAttribute('id', 'timelineTableDiv');
  dataWrap.append(tableDiv);

  const table = document.createElement('table');
  table.className = 'table table-striped table-sm table-hover caption-top';

  const caption = document.createElement('caption');
  caption.innerHTML = `<span class='fs-4'>name: <strong>${timelineDetails.timeline[0].definition}</strong></span><span class='float-end fs-5'>entries: <strong>${timelineDetails.specific.length}</strong></span>`;
  table.appendChild(caption);

  const thead = table.createTHead();
  thead.className = 'table-primary';
  const headerRow = thead.insertRow();
  const headers = ['Macro', 'Generic', 'Specific', 'Start', 'End','#'];
  headers.forEach(headerText => {
    const headerCell = document.createElement('th');
    headerCell.textContent = headerText;
    headerRow.appendChild(headerCell);
  });

  const tbody = table.createTBody();
  timelineDetails.specific.forEach((timeline) => {
    const row = tbody.insertRow();
    const macroCell = row.insertCell();
    const genericCell = row.insertCell();
    const specificCell = row.insertCell();
    const startCell = row.insertCell();
    const endCell = row.insertCell();
    const actionCell = row.insertCell();
    macroCell.textContent = timeline.macro;
    genericCell.textContent = timeline.generic;
    specificCell.textContent = timeline.specific;
    startCell.textContent = timeline.start;
    endCell.textContent = timeline.end;
    actionCell.innerHTML = `<button class="btn btn-sm btn-adc-blue" data-id="${timeline.specific_id}">edit</button>`;
    actionCell.querySelector('button').addEventListener('click', function() {
      const timelineId = this.getAttribute('data-id');
      // Call the edit function or perform the desired action here
    });
  });

  const tfooter = table.createTFoot();
  tfooter.className = 'table-primary table-group-divider';
  const footerRow = tfooter.insertRow();
  const footerCell = footerRow.insertCell();
  footerCell.colSpan = headers.length;
  footerCell.innerHTML = `Author: <strong>${timelineDetails.timeline[0].author}</strong>`;

  tableDiv.appendChild(table);
}

function countRows() {
  const tfoot = document.getElementById('newTimeLineTableFoot');
  if (!tfoot) {
    console.warn('tfoot element not found');
    return; // Exit the function if tfoot is null
  }
  rowsData.length > 0
    ? tfoot.classList.remove('hidden')
    : tfoot.classList.add('hidden');
}

function buildForm() {
  // Create a container element to hold the HTML
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="mb-3">
      <label for="name" class="form-label">Timeline name</label>
      <input type="text" class="form-control form-control-sm w-auto" id="name" placeholder="timeline name" required>
    </div>
    <form id="timelineForm" class="row row-cols-lg-auto g-3 align-items-center">
      <div class="col-12 col-lg-auto">
        <label for="macro" class="form-label">Macro:</label>
        <select id="macro" name="macro" class="form-select form-select-sm" required></select>
      </div>
      <div class="col-12 col-lg-auto">
        <label for="generic" class="form-label">Generic:</label>
        <input class="form-control form-control-sm" list="genericList" id="generic" name="generic" required>
        <datalist id="genericList"></datalist>
      </div>
      <div class="col-12 col-lg-auto">
        <label for="specific" class="form-label">Specific:</label>
        <input class="form-control form-control-sm" type="text" id="specific" name="specific" required>
      </div>
      <div class="col-12 col-lg-auto">
        <label for="start" class="form-label">Start:</label>
        <input class="form-control form-control-sm" type="number" id="start" name="start" required>
      </div>
      <div class="col-12 col-lg-auto">
        <label for="end" class="form-label">End:</label>
        <input class="form-control form-control-sm" type="number" id="end" name="end" required>
      </div>
      <div class="col-12 col-lg-auto align-self-end">
        <button class="form-control btn btn-adc-blue btn-sm" type="submit" id="addTimeRowBtn">Add Item</button>
      </div>
    </form>
    <div id="newTimelineTable" class="table-responsive">
      <table class="table table-striped table-sm table-hover caption-top">
        <caption>Timeline</caption>
        <thead class="table-primary">
          <tr>
            <th scope="col">Macro</th>
            <th scope="col">Generic</th>
            <th scope="col">Specific</th>
            <th scope="col">Start</th>
            <th scope="col">End</th>
            <th scope="col">#</th>
          </tr>
        </thead>
        <tbody id="newTimeLineTableBody"></tbody>
        <tfoot id="newTimeLineTableFoot" class="table-primary table-group-divider hidden">
          <tr>
            <td colspan="6">
              <button class="btn btn-sm btn-adc-blue" id="draft">Save as Draft</button>
              <button class="btn btn-sm btn-adc-blue" id="complete">Save and public</button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>`;

  // Add event listeners to the buttons
  const saveDraftBtn = container.querySelector('#draft');
  const saveCompleteBtn = container.querySelector('#complete');

  saveDraftBtn.addEventListener('click', saveRows);
  saveCompleteBtn.addEventListener('click', saveRows);

  return container;
}

async function saveRows(el){
  const name = document.getElementById('name').value;
  if (!name) {
    showToast('Please provide a name for the timeline.', 'warning');
    return false;
  }
  const payload = {
    class: 'Timeline',
    action: 'saveTimeline',
    name: name,
    state: el.target.id,
    data: rowsData
  };
  console.log("save timeline payload",payload);
  
  try {
    const result = await fetchApi(ENDPOINT, 'POST', {}, payload);
    if(result && result.data){
      const toastClass = result.data.error === 0 ? "success" : "danger";
      showToast(result.data.message, toastClass, null);
      console.log("save timeline endpoint result",result);
      
    }else {
      console.error('Invalid data:', result);
      showToast(result, "danger", null);
    }
  } catch (error) {
    showToast('Error during API call:'+error, "danger", null);
    console.error('Error during API call:', error);
    throw error;
  }
}