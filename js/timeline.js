const timeLineTable = document.querySelector('#timeLineTable tbody');
const timeLineSelect = document.getElementById('listTableSelect');
const newTimeLineBtn = document.getElementById('newTimeLineBtn');
const userGuide = document.getElementById('userGuide');
const dataWrap = document.getElementById('dataWrap');

const definedMacro = [];
const definedGeneric = [];
const definedSpecific = [];

const rowsData = [];


document.addEventListener('DOMContentLoaded', ()=>{
  // new timeline workflow
  newTimeLineBtn.addEventListener('click', newTimeLine);
  
  // edit existing timeline workflow
  buildTimelineList();
  if(timeLineTable){
    timeLineTable.addEventListener('click', timelineTableClick);
  }
  if(timeLineSelect){
    timeLineSelect.addEventListener('change', ()=>{
      getTimelineDetails(timeLineSelect.value)
    })
  }
})

function timelineTableClick(event) {
  const rows = timeLineTable.querySelectorAll('td');
  rows.forEach(row => { row.classList.remove('selectedRow'); });
  const clickedRow = event.target.closest('tr');
  if (clickedRow) {
    const cells = clickedRow.querySelectorAll('td');
    cells.forEach(td => { td.classList.add('selectedRow'); });

    const timelineId = clickedRow.getAttribute('data-id');
    getTimelineDetails(timelineId);
  }
}

async function buildTimelineList() {
  try {
    const payload = {class: 'Timeline',  action: 'getTimelineList'}
    const result = await fetchApi(ENDPOINT, 'POST', {}, payload);
    if (result && result.data) {
      const timelines = result.data;
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
  buildGuide(newTimelineGuide)
  dataWrap.classList.remove('hidden');
  if(dataWrap){
    await newTimelineBuildForm('new');
  }else{
    console.warn('dataWrap element not found');
  }
}

async function newTimelineBuildForm(action) {
  dataWrap.innerHTML = '';
  const newTimelineDiv = document.createElement('div');
  newTimelineDiv.id = 'newTimelineDiv';
  newTimelineDiv.className = 'mb-3';
  dataWrap.appendChild(newTimelineDiv);

  let previewWrap = document.getElementById('timelinePreviewWrap');
  if (!previewWrap) {
    previewWrap = document.createElement('div');
    previewWrap.id = 'timelinePreviewWrap';
    previewWrap.className = 'mb-3';
  }

  newTimelineDiv.append(
    defineTimelineInfo(action),
    defineMacro(),
    defineGeneric(),
    defineSpecific(),
    previewWrap,
  );
}

function defineTimelineInfo(action){
  const row = document.createElement('div');
  row.classList.add('d-flex','flex-row','justify-content-start','gap-3', 'mb-3');
  colName = document.createElement('div');
  colName.classList.add('w-25');
  colState = document.createElement('div');
  colDelete = document.createElement('div');
  row.append(colName, colState, colDelete);

  const nameDiv = document.createElement('div');
  colName.appendChild(nameDiv);
  const nameLabel = document.createElement('label');
  nameLabel.htmlFor = 'timelineName';
  nameLabel.textContent = 'Name';
  nameDiv.appendChild(nameLabel);

  const nameInputGroup = document.createElement('div');
  nameInputGroup.className = 'input-group mb-3';
  nameDiv.appendChild(nameInputGroup);
  const nameInput = document.createElement('input');
  nameInput.className = 'form-control form-control-sm';
  nameInput.id = 'timelineName';
  nameInput.placeholder = 'Timeline name';
  nameInput.required = true;
  const nameCheck = document.createElement('button');
  nameCheck.type = 'button';
  nameCheck.className = 'btn btn-sm btn-adc-blue';
  nameCheck.innerHTML = '<i class="mdi mdi-check"></i>';
  nameInputGroup.append(nameInput, nameCheck);

  nameCheck.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name) {
      const payload = {class: 'Timeline', action: 'checkTimelineName', name: name};
      fetchApi(ENDPOINT, 'POST', {}, payload)
        .then(result => {
          if (result && result.data && result.data.error === 0) {
            showToast('Timeline name is available.', 'success');
            nameCheck.classList.replace('btn-adc-blue', 'btn-success');
            nameCheck.innerHTML = '<i class="mdi mdi-check-all"></i>';
          } else {
            showToast('Timeline name already exists. Please choose a different name.', 'danger');
            nameCheck.classList.replace('btn-success', 'btn-adc-blue');
            nameCheck.innerHTML = '<i class="mdi mdi-check"></i>';
          }
        })
        .catch(error => {
          console.error('Error checking timeline name:', error);
          showToast('Error checking timeline name.', 'danger');
        });
    } else {
      showToast('Please enter a valid timeline name.', 'warning');
    }
  });

  if (action === 'edit') {
    const stateDiv = document.createElement('div');
    colState.appendChild(stateDiv);
    const stateLabel = document.createElement('label');
    stateLabel.className = 'd-block';
    stateLabel.htmlFor = 'timelineState';
    stateLabel.textContent = 'State';
    stateDiv.appendChild(stateLabel);
    
    const btnDiv = document.createElement('div');
    btnDiv.className = 'btn-group mb-3';
    stateDiv.appendChild(btnDiv);
  
    const draftBtn = document.createElement('input');
    draftBtn.type = 'radio';
    draftBtn.className = 'btn-check';
    draftBtn.name = 'timelineState';
    draftBtn.id = 'timelineStateDraft';
    draftBtn.value = 'draft';
    draftBtn.autocomplete = 'off';
    const draftLabel = document.createElement('label');
    draftLabel.className = 'btn btn-sm btn-outline-success';
    draftLabel.htmlFor = 'timelineStateDraft';
    draftLabel.textContent = 'Draft';
  
    const completeBtn = document.createElement('input');
    completeBtn.type = 'radio';
    completeBtn.className = 'btn-check';
    completeBtn.name = 'timelineState';
    completeBtn.id = 'timelineStateComplete';
    completeBtn.value = 'complete';
    completeBtn.autocomplete = 'off';
    const completeLabel = document.createElement('label');
    completeLabel.className = 'btn btn-sm btn-outline-success';
    completeLabel.htmlFor = 'timelineStateComplete';
    completeLabel.textContent = 'Complete';
    btnDiv.append(draftBtn, draftLabel, completeBtn, completeLabel);

    const delLabel = document.createElement('label');
    delLabel.className = 'd-block';
    delLabel.textContent = 'Delete';
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-danger';
    delBtn.textContent = 'delete';
    delBtn.addEventListener('click', () => {
      const timelineId = timeLineSelect.value;
      console.log(`Deleting timeline with ID: ${timelineId}`);
    });
      
    colDelete.append(delLabel, delBtn);
  }
  
  return row;
}

function createInputRow({
  tbody,
  selectClass,
  selectId,
  selectPlaceholder,
  populateSelectFn,
  onChangeSelect,
  onAddClick
}) {
  const inputRow = tbody.insertRow();

  // Select
  const selectCell = inputRow.insertCell();
  const select = document.createElement('select');
  select.className = `form-select form-select-sm ${selectClass}`;
  select.innerHTML = `<option value="" selected disabled>${selectPlaceholder}</option>`;
  select.id = selectId;
  selectCell.appendChild(select);

  // Definition input
  const defCell = inputRow.insertCell();
  const defInput = document.createElement('input');
  defInput.type = 'text';
  defInput.className = 'form-control form-control-sm';
  defInput.placeholder = 'Definition';
  defCell.appendChild(defInput);

  // Start input
  const startCell = inputRow.insertCell();
  const startInput = document.createElement('input');
  startInput.type = 'number';
  startInput.className = 'form-control form-control-sm';
  startInput.placeholder = 'Start';
  startCell.appendChild(startInput);

  // End input
  const endCell = inputRow.insertCell();
  const endInput = document.createElement('input');
  endInput.type = 'number';
  endInput.className = 'form-control form-control-sm';
  endInput.placeholder = 'End';
  endCell.appendChild(endInput);

  // Add button
  const actionCell = inputRow.insertCell();
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-sm btn-adc-blue';
  addBtn.textContent = 'add';
  actionCell.appendChild(addBtn);

  // **Aggiungi qui la creazione del resetBtn**
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-sm btn-danger ms-1 hidden';
  resetBtn.textContent = 'reset';
  actionCell.appendChild(resetBtn);

  // Popola la select
  populateSelectFn();

  // Eventi
  select.addEventListener('change', () => {
    if (onChangeSelect) onChangeSelect({ select, startInput, endInput });
  });

  addBtn.addEventListener('click', () => {
    if (onAddClick) onAddClick({ select, defInput, startInput, endInput, tbody, addBtn, resetBtn });
  });

  resetBtn.addEventListener('click', () => {
    // Qui puoi gestire il reset se serve per generic/specific
    defInput.value = '';
    startInput.value = '';
    endInput.value = '';
    resetBtn.classList.add('hidden');
    addBtn.classList.remove('hidden');
  });
}

function validateStartEnd({start, end, startMin, startMax, endMin, endMax, context='', extra = {}}) {
  let hasWarning = false;
  if (isNaN(start) || isNaN(end)) {
    showToast('Start and End must be valid numbers.', 'danger');
    return false;
  }
  if (start >= end) {
    showToast('Start must be less than End. Please adjust the values.', 'danger');
    return false;
  }

  // Scegli l'array giusto in base al context
  let dataArr = [];
  let isSameItem = () => false;
  if (context === 'macro' && extra.macroId) {
    dataArr = definedMacro;
    isSameItem = item => item.id === extra.macroId;
  } else if (context === 'generic' && extra.macroId && extra.definition && typeof extra.start !== 'undefined' && typeof extra.end !== 'undefined') {
    dataArr = definedGeneric.filter(item => item.macro_id == extra.macroId);
    isSameItem = item =>
      item.macro_id == extra.macroId &&
      item.definition === extra.definition &&
      item.start === extra.start &&
      item.end === extra.end;
  } else if (context === 'specific' && extra.genericId && extra.definition && typeof extra.start !== 'undefined' && typeof extra.end !== 'undefined') {
    dataArr = definedSpecific.filter(item => item.generic_id == extra.genericId);
    isSameItem = item =>
      item.generic_id == extra.genericId &&
      item.definition === extra.definition &&
      item.start === extra.start &&
      item.end === extra.end;
  }

  // Controllo duplicati (tutti i valori uguali)
  const duplicate = dataArr.some(item =>
    item.definition === extra.definition &&
    item.start === start &&
    item.end === end &&
    ((context === 'macro' && item.id === extra.macroId) ||
     (context === 'generic' && item.macro_id == extra.macroId) ||
     (context === 'specific' && item.generic_id == extra.genericId))
  );
  if (duplicate) {
    showToast('Cannot insert two identical rows.', 'danger');
    return false;
  }

  // Controllo definition univoca
  if (context === 'macro') {
    if (definedMacro.some(item => item.definition === extra.definition && item.id !== extra.macroId)) {
      showToast('Definition must be unique.', 'danger');
      return false;
    }
  } else if (context === 'generic') {
    if (definedGeneric.some(item => item.definition === extra.definition && item.macro_id == extra.macroId)) {
      showToast('Definition must be unique for the selected macro.', 'danger');
      return false;
    }
  } else if (context === 'specific') {
    if (definedSpecific.some(item => item.definition === extra.definition && item.generic_id == extra.genericId)) {
      showToast('Definition must be unique for the selected generic.', 'danger');
      return false;
    }
  }

  // Warning per overlap/contenimento (non blocca)
  if (dataArr.length > 0) {
    const overlap = dataArr.some(item => {
      if (isSameItem(item)) return false;
      return (start < item.end && end > item.start);
    });
    if (overlap) {
      showToast('Warning: this period overlaps with another.', 'warning');
      hasWarning = true;
    }

    const contained = dataArr.some(item => {
      if (isSameItem(item)) return false;
      if (start >= item.start && end <= item.end) return true;
      if (item.start >= start && item.end <= end) return true;
      return false;
    });
    if (contained) {
      showToast('Warning: this period is contained in or contains another.', 'warning');
      hasWarning = true;
    }
  }

  return { valid: true, hasWarning };
}

function defineMacro(){
  const { div, tbody } = createCategoryCardAndTable({
    title: 'Define Macro category',
    tbodyId: 'macroCategoryBodyCard',
    headers: ['Definition', 'Start', 'End', '#'],
    hintsHtml: `
      <p class='mb-1'>Here you can define the <strong>macro category</strong>, which is the largest chronological period. The system provides a list of commonly accepted macro categories (e.g., Stone Age, Bronze Age, Iron Age, Classical Age, Middle Age, Modern Age).</p>
      <p class='mb-1'>After choosing the period from those available, you will be asked to define the time range for the specific period in your cultural area. This range will be used as a "control range" for subsequent subcategories.</p>
      <p class='mb-1'>The system does not allow the creation of overlapping periods, so it is necessary to pay attention to the ranges defined in the various categories. The system will warn you if you try to create an element that overlaps with an existing one.</p>
      <p class="mb-1">When you have defined a range for a specific macro period, click the "add" button to add the category to the timeline</p>
    `
  });
  const payload = {class: 'Timeline', action: 'getMacroList'};
  fetchApi(ENDPOINT, 'POST', {}, payload)
    .then(result => {
      if (result && result.data) {
        result.data.forEach(macro => {
          const row = tbody.insertRow();
          
          const cell = row.insertCell();
          cell.textContent = macro.definition;
          
          const startCell = row.insertCell();
          const startInput = document.createElement('input');
          startInput.type = 'number';
          startInput.className = 'form-control form-control-sm';
          startInput.placeholder = 'Start';
          startCell.appendChild(startInput); 
          
          const endCell = row.insertCell();
          const endInput = document.createElement('input');
          endInput.type = 'number';
          endInput.className = 'form-control form-control-sm';
          endInput.placeholder = 'End';
          endCell.appendChild(endInput);

          const actionCell = row.insertCell();
          const addBtn = document.createElement('button');
          addBtn.className = 'btn btn-sm btn-adc-blue';
          addBtn.textContent = 'add';
          addBtn.setAttribute('data-id', macro.id);
          
          const resetBtn = document.createElement('button');
          resetBtn.className = 'btn btn-sm btn-danger ms-1 hidden';
          resetBtn.textContent = 'reset';
          resetBtn.setAttribute('data-id', macro.id);
          actionCell.append(addBtn, resetBtn);

          addBtn.addEventListener('click', () => {
            const start = parseInt(startInput.value.trim());
            const end = parseInt(endInput.value.trim());
            const isValid = validateStartEnd({start, end, context: 'macro', extra: { macroId: macro.id }});
            if (!isValid || isValid.valid === false) return;

            const macroItem = {id: macro.id, definition: macro.definition, start: start, end: end};

            // avoid duplicated
            const exists = definedMacro.some(item => item.id === macro.id);
            if (!exists) {
              definedMacro.push(macroItem);
              startInput.disabled = true;
              endInput.disabled = true;
              addBtn.classList.add('hidden');
              resetBtn.classList.remove('hidden');
              populateMacroSelect();
              timelinePreviewTable();
              
              const showSuccess = () => showToast('Macro period added!', 'success');
              if (isValid.hasWarning) {
                setTimeout(showSuccess, 3000);
              } else {
                showSuccess();
              }
            } else {
              showToast('This macro period has already been added.', 'warning');
            }
          });
          
          resetBtn.addEventListener('click', () => {
            const index = definedMacro.findIndex(item => item.id === macro.id);
            if (index !== -1) {
              definedMacro.splice(index, 1);
              startInput.disabled = false;
              endInput.disabled = false;
              addBtn.classList.remove('hidden');
              resetBtn.classList.add('hidden');
              startInput.value = '';
              endInput.value = '';
              
              // Trova tutti i generic collegati a questo macro
              const removedGenericIds = definedGeneric
              .filter(g => g.macro_id == macro.id)
                .map(g => g.id);

                // Rimuovi i generic collegati
                for (let i = definedGeneric.length - 1; i >= 0; i--) {
                  if (definedGeneric[i].macro_id == macro.id) {
                    definedGeneric.splice(i, 1);
                  }
                }
                
                // Rimuovi tutti gli specific collegati ai generic eliminati
                for (let i = definedSpecific.length - 1; i >= 0; i--) {
                  if (removedGenericIds.includes(definedSpecific[i].generic_id)) {
                    definedSpecific.splice(i, 1);
                  }
                }
                
                // Aggiorna le select e le tabelle
                const genericTbody = document.getElementById('genericCategoryBodyCard');
                const specificTbody = document.getElementById('specificCategoryBodyCard');
                const genericSelect = document.getElementById('genericMacro');
                const specificSelect = document.getElementById('specificGeneric');
                refreshCategoryRows(genericTbody, definedGeneric, 'generic', genericSelect);
                refreshCategoryRows(specificTbody, definedSpecific, 'specific', specificSelect);
                populateMacroSelect();
                populateGenericSelect();
                timelinePreviewTable();
                showToast('Macro period reset!', 'success');
            } else {
              showToast('This macro period was not added yet.', 'warning');
            }
          });

        });
        
      } else {
        console.error('No data found in the response');
      }
    })
    .catch(error => {
      console.error('Error fetching macro list:', error);
    });
  return div;
}

function defineGeneric() {
  const { div, tbody } = createCategoryCardAndTable({
    title: 'Define Generic category',
    tbodyId: 'genericCategoryBodyCard',
    headers: ['Macro', 'Definition', 'Start', 'End', '#'],
    inputRowBuilder: (tbody) => {
      createInputRow({
        tbody,
        selectClass: 'macroSelect',
        selectId: 'genericMacro',
        selectPlaceholder: 'Choose...',
        populateSelectFn: populateMacroSelect,
        onChangeSelect: ({ select, startInput, endInput }) => {
          const selectedOption = select.options[select.selectedIndex];
          if (!selectedOption) return;
          const start = selectedOption.dataset.start;
          const end = selectedOption.dataset.end;
          startInput.value = start;
          startInput.min = start;
          startInput.max = parseInt(end) - 1;
          endInput.value = end;
          endInput.min = parseInt(start) + 1;
          endInput.max = end;
        },
        onAddClick: ({ select, defInput, startInput, endInput, tbody }) => {
          const macroId = select.value;
          const definition = defInput.value.trim();
          const start = parseInt(startInput.value.trim());
          const startMin = parseInt(startInput.min);
          const startMax = parseInt(startInput.max);
          const end = parseInt(endInput.value.trim());
          const endMin = parseInt(endInput.min);
          const endMax = parseInt(endInput.max);

          if (!macroId || !definition || isNaN(start) || isNaN(end)) {      
            showToast('Please fill in all fields.', 'warning');
            return;
          }

          const isValid = validateStartEnd({ 
            start, 
            end, 
            startMin, 
            startMax, 
            endMin, 
            endMax, 
            context: 'generic', 
            extra: { macroId, definition, start, end } });
          if (!isValid || isValid.valid === false) return;

          // Definition deve essere univoco
          const duplicateDef = definedGeneric.some(item => item.definition === definition);
          if (duplicateDef) {
            showToast('Definition must be unique for the selected generic item.', 'danger');
            return;
          }   

          // Se tutto ok, aggiungi la riga
          const genericItem = {
            id: generateId(),
            macro_id: macroId, 
            definition: definition, 
            start: start, 
            end: end
          };
          definedGeneric.push(genericItem);

          // Ordina l'array per start
          definedGeneric.sort((a, b) => a.start - b.start);
          
          // Reset inputs
          defInput.value = '';
          startInput.value = '';
          endInput.value = '';
          
          populateMacroSelect();
          populateGenericSelect();
          refreshCategoryRows(tbody, definedGeneric, 'generic', select);
          timelinePreviewTable();
          
          const showSuccess = () => showToast('Generic period added!', 'success');
          if (isValid.hasWarning) {
            setTimeout(showSuccess, 3000);
          } else {
            showSuccess();
          }
        }
      });
    },
    hintsHtml: `
      <p class='mb-1'>Here you can define the <strong>generic category</strong></p>
      <p class='mb-1'>The “macros” list will be populated with the value of the previously defined macro category, by resetting a macro entry any generic entry related to the macro will be deleted.</p>
      <p class='mb-1'>The system does not allow the creation of overlapping periods, so it is necessary to pay attention to the ranges defined in the various categories. The system will warn you if you try to create an element that overlaps with an existing one.</p>
    `
  });

  return div;
}

function defineSpecific() {
  const { div, tbody } = createCategoryCardAndTable({
    title: 'Define Specific category',
    tbodyId: 'specificCategoryBodyCard',
    headers: ['Generic', 'Definition', 'Start', 'End', '#'],
    inputRowBuilder: (tbody) => {
      createInputRow({
        tbody,
        selectClass: 'genericSelect',
        selectId: 'specificGeneric',
        selectPlaceholder: 'Choose...',
        populateSelectFn: populateGenericSelect,
        onChangeSelect: ({ select, startInput, endInput }) => {
          const selectedOption = select.options[select.selectedIndex];
          const selectedId = select.value;
          const selectedGeneric = definedGeneric.find(g => g.id === selectedId);
          if (!selectedGeneric) return;
          const start = selectedOption.dataset.start;
          const end = selectedOption.dataset.end;
          startInput.value = start;
          startInput.min = start;
          startInput.max = parseInt(end) - 1;
          endInput.value = end;
          endInput.min = parseInt(start) + 1;
          endInput.max = end;
        },
        onAddClick: ({ select, defInput, startInput, endInput, tbody }) => {
          const genericId = select.value;
          const selectedGeneric = definedGeneric.find(g => g.id === genericId);
          if (!selectedGeneric) return;
          const definition = defInput.value.trim();
          const start = parseInt(startInput.value.trim());
          const startMin = parseInt(startInput.min);
          const startMax = parseInt(startInput.max);
          const end = parseInt(endInput.value.trim());
          const endMin = parseInt(endInput.min);
          const endMax = parseInt(endInput.max);

          if (!genericId || !definition || isNaN(start) || isNaN(end)) {      
            showToast('Please fill in all fields.', 'warning');
            return;
          }
          const isValid = validateStartEnd({ 
            start, 
            end, 
            startMin, 
            startMax, 
            endMin, 
            endMax, 
            context: 'specific', 
            extra: { genericId,definition,start,end } });
          if (!isValid || isValid.valid === false) return;

          // Definition deve essere univoco
          const duplicateDef = definedSpecific.some(item => item.definition === definition);
          if (duplicateDef) {
            showToast('Definition must be unique for the selected specific item.', 'danger');
            return;
          }

          // Se tutto ok, aggiungi la riga
          const specificItem = {
            id: generateId(),
            generic_id: genericId, 
            generic: selectedGeneric.definition,
            definition: definition, 
            start: start, 
            end: end
          };
          definedSpecific.push(specificItem);

          // Ordina l'array per start
          definedSpecific.sort((a, b) => a.start - b.start);

          // Reset inputs
          defInput.value = '';
          startInput.value = '';
          endInput.value = '';
          populateGenericSelect();
          refreshCategoryRows(tbody, definedSpecific, 'specific', select);
          timelinePreviewTable();
          const showSuccess = () => showToast('Specific period added!', 'success');
          if (isValid.hasWarning) {
            setTimeout(showSuccess, 3000);
          } else {
            showSuccess();
          }          
        }
      });
    }
  });
  return div;
}

function createCategoryCardAndTable({ 
  title, 
  tbodyId,
  headers, 
  inputRowBuilder, 
  hintsHtml 
}) {
  const div = document.createElement('div');
  div.className = 'rounded border mb-3 p-3 w-auto';

  const h5 = document.createElement('h5');
  h5.className = 'card-title mb-3';
  h5.textContent = title;
  div.appendChild(h5);

  const table = document.createElement('table');
  table.className = 'table';
  const thead = table.createTHead();
  thead.insertRow();
  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.textContent = headerText;
    th.scope = 'col';
    thead.rows[0].appendChild(th);
  });
  const tbody = table.createTBody();
  tbody.id = tbodyId;

  if (typeof inputRowBuilder === 'function') { inputRowBuilder(tbody); }

  div.appendChild(table);

  if (hintsHtml) {
    const compileHints = document.createElement('div');
    compileHints.className = 'form-text';
    compileHints.innerHTML = hintsHtml;
    div.appendChild(compileHints);
  }

  return { div, tbody, table };
}

function setMacroValue(){
  console.log(definedMacro);
  

}

function resetMacroCard() {
  const macroTbody = document.getElementById('macroCategoryBodyCard');
  if (macroTbody) {
    for (let row of macroTbody.rows) {
      // Salta la riga di input se presente
      // if (row.rowIndex === 0) continue;
      // Riabilita gli input
      Array.from(row.cells).forEach(cell => {
        const input = cell.querySelector('input');
        if (input) {
          input.disabled = false;
          input.value = '';
        };
      });
      // Mostra add, nascondi reset
      const addBtn = row.querySelector('.btn-adc-blue');
      const resetBtn = row.querySelector('.btn-danger');
      if (addBtn) addBtn.classList.remove('hidden');
      if (resetBtn) resetBtn.classList.add('hidden');
    }
  }
}

function refreshCategoryRows(tbody, data, type, select) {
  // Rimuovi tutte le righe tranne la prima (input)
  while (tbody.rows.length > 1) { tbody.deleteRow(1); }

  // Ricrea le righe dei dati
  data.forEach(item => {
    const newRow = tbody.insertRow();
    if (type === 'generic') {
      newRow.dataset.macro = item.macro_id;
      const macroCell = newRow.insertCell();
      const macroOption = Array.from(select.options).find(opt => opt.value == item.macro_id);
      macroCell.textContent = macroOption ? macroOption.textContent : 'N/A';
      const defCell = newRow.insertCell();
      defCell.textContent = item.definition;
      const startCell = newRow.insertCell();
      startCell.textContent = item.start;
      const endCell = newRow.insertCell();
      endCell.textContent = item.end;
      const actionCell = newRow.insertCell();
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn btn-sm btn-danger ms-1';
      resetBtn.textContent = 'reset';
      resetBtn.addEventListener('click', () => {
        const index = definedGeneric.findIndex(g =>
          g.definition === item.definition &&
          g.start === item.start &&
          g.end === item.end &&
          g.macro_id === item.macro_id
        );
        if (index !== -1) {
          // Rimuovi tutti gli specific collegati a questo generic
          for (let i = definedSpecific.length - 1; i >= 0; i--) {
            if (definedSpecific[i].generic_id == item.id) {
              definedSpecific.splice(i, 1);
            }
          }
          definedGeneric.splice(index, 1);

          const specificTbody = document.getElementById('specificCategoryBodyCard');
          const specificSelect = document.getElementById('specificGeneric');
          refreshCategoryRows(tbody, definedGeneric, 'generic', select);
          refreshCategoryRows(specificTbody, definedSpecific, 'specific', specificSelect);
          timelinePreviewTable()
          showToast('Generic period reset!', 'success');
        } else {
          showToast('This generic period was not added yet.', 'warning');
        }
      });
      actionCell.appendChild(resetBtn);
    } else if (type === 'specific') {
      newRow.dataset.generic = item.generic_id;
      const genericCell = newRow.insertCell();
      const genericObj = definedGeneric.find(g => g.id === item.generic_id);
      genericCell.textContent = genericObj.definition;
      const defCell = newRow.insertCell();
      defCell.textContent = item.definition;
      const startCell = newRow.insertCell();
      startCell.textContent = item.start;
      const endCell = newRow.insertCell();
      endCell.textContent = item.end;
      const actionCell = newRow.insertCell();
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn btn-sm btn-danger ms-1';
      resetBtn.textContent = 'reset';
      resetBtn.addEventListener('click', () => {
        const index = definedSpecific.findIndex(s =>
          s.definition === item.definition &&
          s.start === item.start &&
          s.end === item.end &&
          s.generic_id === item.generic_id
        );
        if (index !== -1) {
          definedSpecific.splice(index, 1);
          refreshCategoryRows(tbody, definedSpecific, 'specific', select);
          timelinePreviewTable();
          showToast('Specific period reset!', 'success');
        } else {
          showToast('This specific period was not added yet.', 'warning');
        }
      });
      actionCell.appendChild(resetBtn);
    }
  });
}

function generateId() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : '_' + Math.random().toString(36).slice(2, 11); }

function populateMacroSelect() {
  document.querySelectorAll('.macroSelect').forEach(select => {
    select.innerHTML = `<option value="" selected disabled>Choose...</option>`;
    if (definedMacro.length === 0) {return;}
    list = definedMacro.sort((a, b) => a.id - b.id);
    list.forEach(macro => {
      const opt = document.createElement('option');
      opt.value = macro.id;
      opt.textContent = macro.definition;
      opt.dataset.start = macro.start;
      opt.dataset.end = macro.end;
      select.appendChild(opt);
    });
  });
}

function populateGenericSelect() {
  document.querySelectorAll('.genericSelect').forEach(select => {
    select.innerHTML = `<option value="" selected disabled>Choose...</option>`;
    if (definedGeneric.length === 0) {return;}
    definedGeneric.forEach((generic) => {
      const opt = document.createElement('option');
      opt.value = generic.id;
      opt.textContent = generic.definition;
      opt.dataset.start = generic.start;
      opt.dataset.end = generic.end;
      select.appendChild(opt);
    });
  });
}


function timelinePreviewTable(){
  const wrap = document.getElementById('timelinePreviewWrap');
  wrap.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'table table-striped table-sm table-hover caption-top';
  const caption = document.createElement('caption');
  caption.textContent = 'Timeline Preview';
  table.appendChild(caption);

  const thead = table.createTHead();
  thead.className = 'table-primary';
  const headerRow = thead.insertRow();
  const headers = ['Macro', 'Generic', 'Specific', 'Start', 'End'];
  headers.forEach(headerText => {
    const headerCell = document.createElement('th');
    headerCell.textContent = headerText;
    headerRow.appendChild(headerCell);
  });

  const tbody = table.createTBody();
  tbody.id = 'timelinePreviewBody';

  const tfoot = document.createElement('tfoot');
  tfoot.id = 'timelinePreviewFoot';
  tfoot.className = 'table-primary table-group-divider';
  const footRow = tfoot.insertRow();
  const footCell = footRow.insertCell();
  footCell.colSpan = headers.length;

  const saveDraftBtn = document.createElement('button');
  saveDraftBtn.className = 'btn btn-sm btn-adc-blue';
  saveDraftBtn.id = 'draft';
  saveDraftBtn.textContent = 'Save as Draft';
  saveDraftBtn.addEventListener('click', () => { saveTimeline('draft'); });

  const completeBtn = document.createElement('button');
  completeBtn.className = 'btn btn-sm btn-adc-blue ms-1';
  completeBtn.id = 'complete';
  completeBtn.textContent = 'Save and public';
  completeBtn.addEventListener('click', () => { saveTimeline('complete'); });
  footCell.append(saveDraftBtn, completeBtn);
  table.append(tfoot);

  // 2. Prepara una mappa per trovare macro/generic per id
  const macroMap = Object.fromEntries(definedMacro.map(m => [m.id, m]));
  const genericMap = Object.fromEntries(definedGeneric.map(g => [g.id, g]));

  // 3. Inserisci tutti gli items di specific
  const rows = [];
  if(definedSpecific.length > 0){
    definedSpecific.forEach(specific => {
      const generic = genericMap[specific.generic_id];
      const macro = generic ? macroMap[generic.macro_id] : null;
     
      rows.push({
        macro: macro ? macro.definition : '',
        macroStart: macro ? macro.start : Number.NEGATIVE_INFINITY,
        generic: generic ? generic.definition : '',
        specific: specific.definition,
        start: specific.start,
        end: specific.end
      });
    });
  }

  // 4. Inserisci generic NON presenti in specific
  const specificGenericIds = new Set(definedSpecific.map(s => s.generic_id));
  definedGeneric.forEach(generic => {
    if (!specificGenericIds.has(generic.id)) {
      const macro = macroMap[generic.macro_id];
      rows.push({
        macro: macro ? macro.definition : '',
        macroStart: macro ? macro.start : Number.NEGATIVE_INFINITY,
        generic: generic.definition,
        specific: '',
        start: generic.start,
        end: generic.end
      });
    }
  });

  // 5. Inserisci macro NON presenti in generic
  const genericMacroIds = new Set(definedGeneric.map(g => String(g.macro_id)));
  definedMacro.forEach(macro => {
    if (!genericMacroIds.has(String(macro.id))) {
      rows.push({
        macro: macro.definition,
        macroStart: macro.start,
        generic: '',
        specific: '',
        start: macro.start,
        end: macro.end
      });
    }
  });

  // Se non ci sono righe, mostra alert e non creare la tabella
  if (rows.length === 0) {
    showToast('You must enter at least one item in one of the categories to preview it.', 'warning');
    return null;
  }

  // 6. Ordina le righe per macro, poi per start
  rows.sort((a, b) => {
  if (a.macroStart === b.macroStart) { return a.start - b.start; }
  return a.macroStart - b.macroStart;
});
  // 7. Popola la tabella
  tbody.innerHTML = ''; // Pulisci il tbody esistente
  rows.forEach(row => {
    const tr = tbody.insertRow();
    tr.insertCell().textContent = row.macro;
    tr.insertCell().textContent = row.generic;
    tr.insertCell().textContent = row.specific;
    tr.insertCell().textContent = row.start;
    tr.insertCell().textContent = row.end;
  });

  wrap.appendChild(table);
}

function saveTimeline(state){
  const name = document.getElementById('timelineName').value.trim();
  if (!name) {
    showToast('Please enter a name for the timeline.', 'warning');
    return;
  }
  const payload = {
    class: 'Timeline',
    action: 'saveTimeline',
    name: name,
    state: state,
    macro: definedMacro,
    generic: definedGeneric,
    specific: definedSpecific
  };
  fetchApi(ENDPOINT, 'POST', {}, payload).then(result => {
    if (result && result.data) {
      // Reset the defined arrays and UI elements
      definedMacro.length = 0;
      definedGeneric.length = 0;
      definedSpecific.length = 0;
      const timelineNameInput = document.getElementById('timelineName');
      timelineNameInput.value = '';
      const timelinePreviewWrap = document.getElementById('timelinePreviewWrap');
      timelinePreviewWrap.innerHTML = '';
      buildTimelineList();
      
      const genericTbody = document.getElementById('genericCategoryBodyCard');
      const specificTbody = document.getElementById('specificCategoryBodyCard');
      const genericSelect = document.getElementById('genericMacro');
      const specificSelect = document.getElementById('specificGeneric');
      refreshCategoryRows(genericTbody, [], 'generic', genericSelect);
      refreshCategoryRows(specificTbody, [], 'specific', specificSelect);
      resetMacroCard();

      showToast('Timeline saved successfully!', 'success');
    } else {
      console.error('No data found in the response');
      showToast('Error saving timeline. Please try again.', 'danger');
    }
  }).catch(error => {
    console.error('Error saving timeline:', error);
    showToast('Error saving timeline. Please try again.', 'danger');
  });
}

function buildGuide(callback){
  userGuide.classList.remove('text-center','fs-3');
  userGuide.innerHTML = callback();
  if(!userGuide.classList.contains('show')){
    userGuide.classList.add('show');
  }
}

const newTimelineGuide = ()=>{
  return `<p class='mb-1'>Creating a timeline is a very strict operation, subject to several checks before it is published. The system provides a “default” timeline that is generally applicable to all cultural areas. For saving artifacts you can use the one proposed, otherwise you can create one specific to the area of interest in your project.</p>
  <p class='mb-1'>The following will describe the various steps to be taken and how to do them while limiting possible errors.</p>
  <p class='mb-1'>A timeline consists of the following elements:</p>
  <ol>
    <li>
      <span class='d-block fw-bold'>name</span>
      <span>Here you can enter the name of the timeline, it is mandatory to fill in this field before proceeding with the next steps. The reference name, must be unique, used to add the reference timeline to an artifact or to perform precise searches. It is recommended to use the name of the cultural area of reference (e.g., sweden, greece...)</span>
    </li>
    <li>
      <span class='d-block fw-bold'>macro chronology</span>
      <span>Here the larger chronological periods are defined, according to a commonly accepted list (Stone Age, Bronze Age, Iron Age, Classical Age, Middle Age, Modern Age). After choosing the period from those available, you will be asked to define the time range for the specific period in your cultural area. This range will be used as a "control range" for subsequent subcategories</span>
    </li>
    <li>
      <span class='d-block fw-bold'>generic chronology</span>
      <span>Here more specific periods are defined, each element must refer to a previously created macro chronology element. Again, a time range will be asked for, which must be within the range of the chosen macro category element. It is not mandatory to include elements in this category, but it becomes necessary if you want to add more specific elements (item 3)</span>
    </li>
    <li>
      <span class='d-block fw-bold'>specific chronology</span>
      <span>Here the most specific periods are defined, each element must refer to a previously created generic chronology element. Again, a time range will be asked for, which must be within the range of the chosen generic category element. It is not mandatory to include elements in this category.</span>
    </li>
  </ol>
  <p class="fw-bold">Important hints</p>
  <ul>
  <li>The system does not allow the creation of overlapping periods, so it is necessary to pay attention to the ranges defined in the various categories. The system will warn you if you try to create an element that overlaps with an existing one.</li>
  <li>The system allows you to create a timeline in draft mode, so you can save it and continue working on it later. The timeline will not be visible to other users until it is published.</li>
  </ul>`;
}

const editTimelineGuide = ()=>{
  return `<p class='mb-1'>Here you can view the details of the timeline, including the name, author, and all the elements defined in the timeline.</p>
  <p class='mb-1'>You can also edit the timeline by clicking on the "edit" button next to each element. This will allow you to modify the element's details, including the time range and the associated macro or generic category.</p>
  <p class='mb-1'>If you want to add a new element to the timeline, you can use the form at the top of the page. The form will allow you to select the macro or generic category, enter the specific period, and define the time range.</p>
  <p class='mb-1'>Once you have made the necessary changes, you can save the timeline by clicking on the "Save as Draft" or "Save and Publish" button. The timeline will be saved and will be visible to other users if it is published.</p>
  <p class='mb-1'>If you want to delete the timeline, you can use the "Delete" button at the bottom of the page. This will permanently delete the timeline and all its associated elements.</p>
  <p>By deleting an item or the whole timeline, the artefacts related to the deleted element will be automatically related to "default" timeline</p>`;
}

async function getTimelineDetails(timelineId) {
  try {
    const payload = {class: 'Timeline', action: 'getTimelineDetails', timelineId: timelineId};
    const result = await fetchApi(ENDPOINT, 'POST', {}, payload);
    if (result && result.data) {
      const timelineDetails = result.data;
      // console.log('Timeline details:', timelineDetails);
      buildGuide(editTimelineGuide)
      dataWrap.classList.remove('hidden');
      if(dataWrap){
        await newTimelineBuildForm('edit');
        // 1. Svuota gli array globali
        definedMacro.length = 0;
        definedGeneric.length = 0;
        definedSpecific.length = 0;

        // 2. Riempili con i dati caricati
        if (timelineDetails.macro) definedMacro.push(...timelineDetails.macro);
        if (timelineDetails.generic) definedGeneric.push(...timelineDetails.generic);
        if (timelineDetails.specific) definedSpecific.push(...timelineDetails.specific);
        // console.log(definedMacro, definedGeneric, definedSpecific);
        

        // 3. Compila i campi della UI
        // Nome timeline
        const timelineNameInput = document.getElementById('timelineName');
        // console.log('timelineNameInput:', timelineDetails.timeline[0]);
        
        if (timelineNameInput && timelineDetails.timeline[0] && timelineDetails.timeline[0].definition) {
          timelineNameInput.value = timelineDetails.timeline[0].definition;
        }

        // Stato timeline (radio)
        if (timelineDetails.timeline[0] && timelineDetails.timeline[0].state) {
          const state = timelineDetails.timeline[0].state;
          const draftBtn = document.getElementById('timelineStateDraft');
          const completeBtn = document.getElementById('timelineStateComplete');
          if (draftBtn && completeBtn) {
            draftBtn.checked = state === 'draft';
            completeBtn.checked = state === 'complete';
          }
        }

        // 4. Aggiorna select e tabelle
        populateMacroSelect();
        populateGenericSelect();
        setMacroValue();
        const genericTbody = document.getElementById('genericCategoryBodyCard');
        const specificTbody = document.getElementById('specificCategoryBodyCard');
        const genericSelect = document.getElementById('genericMacro');
        const specificSelect = document.getElementById('specificGeneric');
        refreshCategoryRows(genericTbody, definedGeneric, 'generic', genericSelect);
        refreshCategoryRows(specificTbody, definedSpecific, 'specific', specificSelect);

        // 5. Aggiorna la preview
        timelinePreviewTable();
      }else{
        console.warn('dataWrap element not found');
      }
    } else {
      console.error('No data found in the response');
    }
  } catch (error) {
    console.error('Error fetching timeline details:', error);
    throw error;
  }
}