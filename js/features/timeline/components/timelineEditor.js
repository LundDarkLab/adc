import { bsAlert, bsConfirm } from "../../../components/bsComponents.js";
import {
  getMacroList,
  checkTimelineName,
  saveTimeline,
  updateTimeline,
  deleteTimeline,
  getTimelineChronoGroups
} from "../api/timelineApi.js";
import { timelineAvailable } from "./timelineAvailable.js";

/*
 * Editor ad albero per la CREAZIONE e la MODIFICA di una timeline.
 *
 * Lo stato in memoria (state.tree) è l'unica fonte di verità: è un albero
 * annidato macro -> generic -> specific. Ogni mutazione aggiorna lo stato e
 * ri-renderizza il solo contenitore #timelineTree. Il payload inviato al
 * backend rispecchia 1:1 questa struttura.
 *
 * Create e update condividono UI e logica: differiscono solo per state.id
 * (null in create) e per l'azione di salvataggio.
 *
 * Regole:
 *  - generic/specific sono opzionali, ma non si possono saltare livelli;
 *  - il range di un figlio deve essere contenuto nel range del padre (rigido);
 *  - fratelli vicini possono sovrapporsi (periodo di transizione), ma devono
 *    restare ordinati: chi inizia prima deve anche finire prima — niente
 *    contenimenti né start/end coincidenti;
 *  - la "definition" di un figlio è univoca fra i fratelli.
 */

let state = null;            // { id, name, state, tree: [...] }
let macroDefinitions = [];   // lista standard da getMacroList: [{id, definition}]
const expanded = new Set();  // uid dei nodi con accordion aperto
const editing = new Set();   // uid dei nodi attualmente in modifica inline

const dataWrap = document.getElementById('dataWrap');
const timelineMetadata = document.getElementById('timelineMetadata');

function uid() {
  return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : '_' + Math.random().toString(36).slice(2, 11);
}

/*
 * Due periodi vicini possono sovrapporsi (transizione storica), ma devono
 * restare ordinati: chi inizia prima deve anche finire prima. È quindi vietato
 * il contenimento di un periodo nell'altro e la condivisione di start o end.
 * Ritorna true se la coppia è ordinata in modo NON valido.
 */
function badOrder(a, b) {
  return (a.start <= b.start && a.end >= b.end) || (a.start >= b.start && a.end <= b.end);
}

/* Valida un nuovo nodo rispetto al padre e ai fratelli. */
function validateNode({ start, end, definition, parent, siblings, needDefinition }) {
  if (isNaN(start) || isNaN(end)) { return 'Start and End must be valid numbers.'; }
  if (start >= end) { return 'Start must be less than End.'; }
  if (parent && (start < parent.start || end > parent.end)) {
    return `Range must be within the parent range (${parent.start} – ${parent.end}).`;
  }
  if (needDefinition && !definition) { return 'Definition is required.'; }
  if (needDefinition && siblings.some(s => s.definition.toLowerCase() === definition.toLowerCase())) {
    return 'Definition must be unique among siblings.';
  }
  if (siblings.some(s => badOrder({ start, end }, s))) {
    return 'Periods may overlap as a transition, but one cannot contain another or share a start/end: whoever starts earlier must also end earlier.';
  }
  return null;
}

/*
 * Valida la MODIFICA di un nodo esistente. Come validateNode, ma:
 *  - esclude il nodo stesso dal confronto coi fratelli (definition/badOrder);
 *  - se il nodo ha figli, il nuovo range deve continuare a contenerli tutti.
 */
function validateEdit({ node, start, end, definition, parent, siblings, needDefinition, children }) {
  if (isNaN(start) || isNaN(end)) { return 'Start and End must be valid numbers.'; }
  if (start >= end) { return 'Start must be less than End.'; }
  if (parent && (start < parent.start || end > parent.end)) {
    return `Range must be within the parent range (${parent.start} – ${parent.end}).`;
  }
  if (children && children.length) {
    const minStart = Math.min(...children.map(c => c.start));
    const maxEnd = Math.max(...children.map(c => c.end));
    if (start > minStart || end < maxEnd) {
      return `Range must still contain all child periods (${minStart} – ${maxEnd}).`;
    }
  }
  if (needDefinition && !definition) { return 'Definition is required.'; }
  const others = siblings.filter(s => s.uid !== node.uid);
  if (needDefinition && others.some(s => s.definition.toLowerCase() === definition.toLowerCase())) {
    return 'Definition must be unique among siblings.';
  }
  if (others.some(s => badOrder({ start, end }, s))) {
    return 'Periods may overlap as a transition, but one cannot contain another or share a start/end: whoever starts earlier must also end earlier.';
  }
  return null;
}

/* ---------- Avvio editor ---------- */

export async function timelineCreate() {
  if (!(await loadMacroDefinitions())) { return; }
  state = { id: null, name: '', state: 'draft', tree: [] };
  startEditor();
}

export async function timelineUpdate(timelineId, name, currentState) {
  if (!(await loadMacroDefinitions())) { return; }

  const res = await getTimelineChronoGroups(timelineId);
  if (!res || res.error === 1) {
    bsAlert('Unable to load the timeline for editing.', 'danger');
    return;
  }
  state = {
    id: timelineId,
    name: name ?? '',
    state: currentState ?? 'draft',
    tree: buildTree(res.data)
  };
  startEditor();
}

async function loadMacroDefinitions() {
  macroDefinitions = await getMacroList();
  if (!macroDefinitions) {
    bsAlert('Unable to load the standard macro list.', 'danger');
    return false;
  }
  return true;
}

function startEditor() {
  expanded.clear();
  editing.clear();
  if (timelineMetadata) { timelineMetadata.classList.add('d-none'); }
  buildEditorShell();
  renderTree();
}

/* Ricostruisce l'albero dai gruppi piatti restituiti da getTimelineChronoGroups. */
function buildTree({ macro = [], generic = [], specific = [] }) {
  const macroByPk = new Map();
  const tree = macro.map(m => {
    const node = {
      uid: uid(),
      macroId: String(m.macroId),
      definition: m.definition,
      start: Number(m.start),
      end: Number(m.end),
      generics: []
    };
    macroByPk.set(String(m.id), node);
    return node;
  });

  const genericByPk = new Map();
  generic.forEach(g => {
    const parent = macroByPk.get(String(g.macro));
    if (!parent) { return; }
    const node = { uid: uid(), definition: g.definition, start: Number(g.start), end: Number(g.end), specifics: [] };
    parent.generics.push(node);
    genericByPk.set(String(g.id), node);
  });

  specific.forEach(s => {
    const parent = genericByPk.get(String(s.generic));
    if (!parent) { return; }
    parent.specifics.push({ uid: uid(), definition: s.definition, start: Number(s.start), end: Number(s.end) });
  });

  return tree;
}

/* Sezioni statiche: nome, aggiunta macro, albero (vuoto), footer. */
function buildEditorShell() {
  const isEdit = state.id !== null;
  dataWrap.innerHTML = '';

  // --- Nome timeline ---
  const nameCard = document.createElement('div');
  nameCard.className = 'rounded border p-3 mb-3 bg-light';
  const checkBtnHtml = isEdit ? '' :
    '<button type="button" class="btn btn-adc-blue" id="checkNameBtn"><i class="mdi mdi-check"></i> check name</button>';
  nameCard.innerHTML = `
    <label class="form-label fw-bold" for="timelineName">${isEdit ? 'Editing timeline' : 'Timeline name'}</label>
    <div class="input-group">
      <input type="text" class="form-control" id="timelineName" placeholder="e.g. sweden, greece..." value="${state.name}">
      ${checkBtnHtml}
    </div>
    <div class="form-text">The name must be unique. Use the reference cultural area.</div>
  `;
  dataWrap.appendChild(nameCard);

  const nameInput = nameCard.querySelector('#timelineName');
  nameInput.addEventListener('input', () => { state.name = nameInput.value.trim(); });

  const checkBtn = nameCard.querySelector('#checkNameBtn');
  if (checkBtn) {
    nameInput.addEventListener('input', () => { checkBtn.classList.replace('btn-success', 'btn-adc-blue'); });
    checkBtn.addEventListener('click', async () => {
      if (!state.name) { bsAlert('Please enter a timeline name.', 'warning'); return; }
      const res = await checkTimelineName(state.name);
      if (res.error === 0) {
        bsAlert('Timeline name is available.', 'success');
        checkBtn.classList.replace('btn-adc-blue', 'btn-success');
      } else {
        bsAlert(res.message || 'Timeline name already exists.', 'danger');
        checkBtn.classList.replace('btn-success', 'btn-adc-blue');
      }
    });
  }

  // --- Aggiunta macro ---
  const macroCard = document.createElement('div');
  macroCard.className = 'rounded border p-3 mb-3';
  const macroOptions = macroDefinitions
    .map(m => `<option value="${m.id}">${m.definition}</option>`)
    .join('');
  macroCard.innerHTML = `
    <h5 class="mb-3">Add a macro period</h5>
    <div class="d-flex gap-2 align-items-start">
      <select class="form-select" id="macroDefSelect">
        <option value="" selected disabled>-- select macro --</option>
        ${macroOptions}
      </select>
      <input type="number" step="1" class="form-control" id="macroStart" placeholder="start">
      <input type="number" step="1" class="form-control" id="macroEnd" placeholder="end">
      <button type="button" class="btn btn-adc-blue text-nowrap" id="addMacroBtn">+ add</button>
    </div>
    <div class="form-text">Pick a standard macro period and define its time range for this cultural area.</div>
  `;
  dataWrap.appendChild(macroCard);

  macroCard.querySelector('#addMacroBtn').addEventListener('click', () => {
    const sel = macroCard.querySelector('#macroDefSelect');
    const macroId = sel.value;
    const definition = sel.options[sel.selectedIndex]?.textContent ?? '';
    const start = parseInt(macroCard.querySelector('#macroStart').value, 10);
    const end = parseInt(macroCard.querySelector('#macroEnd').value, 10);

    if (!macroId) { bsAlert('Please select a macro period.', 'warning'); return; }
    if (state.tree.some(m => m.macroId === macroId)) {
      bsAlert('This macro period has already been added.', 'warning');
      return;
    }
    const err = validateNode({ start, end, siblings: state.tree, needDefinition: false });
    if (err) { bsAlert(err, 'danger'); return; }

    const node = { uid: uid(), macroId, definition, start, end, generics: [] };
    state.tree.push(node);
    expanded.add(node.uid);
    sel.selectedIndex = 0;
    macroCard.querySelector('#macroStart').value = '';
    macroCard.querySelector('#macroEnd').value = '';
    renderTree();
  });

  // --- Albero ---
  const tree = document.createElement('div');
  tree.id = 'timelineTree';
  dataWrap.appendChild(tree);

  // --- Footer salvataggio ---
  const footer = document.createElement('div');
  footer.className = 'd-flex justify-content-end gap-2 mt-3';
  const deleteBtnHtml = isEdit ?
    '<button type="button" class="btn btn-outline-danger me-auto" id="deleteTimelineBtn">Delete timeline</button>' : '';
  footer.innerHTML = `
    ${deleteBtnHtml}
    <button type="button" class="btn btn-outline-secondary" id="saveDraftBtn">Save as draft</button>
    <button type="button" class="btn btn-adc-blue" id="saveCompleteBtn">Save and publish</button>
  `;
  dataWrap.appendChild(footer);
  footer.querySelector('#saveDraftBtn').addEventListener('click', () => persist('draft'));
  footer.querySelector('#saveCompleteBtn').addEventListener('click', () => persist('complete'));
  const deleteBtn = footer.querySelector('#deleteTimelineBtn');
  if (deleteBtn) { deleteBtn.addEventListener('click', removeTimeline); }
}

/* ---------- Rendering dell'albero ---------- */

function renderTree() {
  const tree = document.getElementById('timelineTree');
  tree.innerHTML = '';

  if (state.tree.length === 0) {
    tree.innerHTML = '<p class="text-muted fst-italic">No macro period yet. Add one above to start building the timeline.</p>';
    return;
  }

  [...state.tree]
    .sort((a, b) => a.start - b.start)
    .forEach(macro => tree.appendChild(renderMacro(macro)));
}

function makeDetails(node, headerHtml, accentClass) {
  const details = document.createElement('details');
  details.className = `border rounded mb-2 ${accentClass}`;
  details.open = expanded.has(node.uid);
  details.addEventListener('toggle', () => {
    if (details.open) { expanded.add(node.uid); } else { expanded.delete(node.uid); }
  });

  const summary = document.createElement('summary');
  summary.className = 'p-2 d-flex justify-content-between align-items-center user-select-none';
  summary.innerHTML = headerHtml;
  details.appendChild(summary);
  return { details, summary };
}

function renderMacro(macro) {
  const { details } = makeDetails(
    macro,
    `<span><strong>${macro.definition}</strong> <span class="text-muted">[${macro.start} – ${macro.end}]</span></span>`,
    'border-primary-subtle'
  );

  const actions = buildNodeActions({
    node: macro,
    onRemove: () => removeMacro(macro.uid)
  });
  details.querySelector('summary').appendChild(actions);

  const body = document.createElement('div');
  body.className = 'p-2 border-top';

  if (editing.has(macro.uid)) {
    body.appendChild(buildEditForm({
      node: macro, parent: null, siblings: state.tree, needDefinition: false, children: macro.generics
    }));
  }

  body.appendChild(buildChildForm({
    parent: macro,
    placeholder: 'generic definition',
    onAdd: ({ definition, start, end }) => {
      const err = validateNode({ start, end, definition, parent: macro, siblings: macro.generics, needDefinition: true });
      if (err) { bsAlert(err, 'danger'); return false; }
      const node = { uid: uid(), definition, start, end, specifics: [] };
      macro.generics.push(node);
      expanded.add(node.uid);
      return true;
    }
  }));

  [...macro.generics]
    .sort((a, b) => a.start - b.start)
    .forEach(generic => body.appendChild(renderGeneric(macro, generic)));

  details.appendChild(body);
  return details;
}

function renderGeneric(macro, generic) {
  const { details } = makeDetails(
    generic,
    `<span>${generic.definition} <span class="text-muted">[${generic.start} – ${generic.end}]</span></span>`,
    'border-info-subtle ms-3'
  );

  const actions = buildNodeActions({
    node: generic,
    onRemove: () => {
      macro.generics = macro.generics.filter(g => g.uid !== generic.uid);
      expanded.delete(generic.uid);
      editing.delete(generic.uid);
      renderTree();
    }
  });
  details.querySelector('summary').appendChild(actions);

  const body = document.createElement('div');
  body.className = 'p-2 border-top';

  if (editing.has(generic.uid)) {
    body.appendChild(buildEditForm({
      node: generic, parent: macro, siblings: macro.generics, needDefinition: true, children: generic.specifics
    }));
  }

  body.appendChild(buildChildForm({
    parent: generic,
    placeholder: 'specific definition',
    onAdd: ({ definition, start, end }) => {
      const err = validateNode({ start, end, definition, parent: generic, siblings: generic.specifics, needDefinition: true });
      if (err) { bsAlert(err, 'danger'); return false; }
      generic.specifics.push({ uid: uid(), definition, start, end });
      return true;
    }
  }));

  [...generic.specifics]
    .sort((a, b) => a.start - b.start)
    .forEach(specific => body.appendChild(renderSpecific(generic, specific)));

  details.appendChild(body);
  return details;
}

function renderSpecific(generic, specific) {
  if (editing.has(specific.uid)) {
    const wrap = document.createElement('div');
    wrap.className = 'ms-4 mb-1';
    wrap.appendChild(buildEditForm({
      node: specific, parent: generic, siblings: generic.specifics, needDefinition: true, children: null
    }));
    return wrap;
  }

  const row = document.createElement('div');
  row.className = 'd-flex justify-content-between align-items-center p-2 ms-4 border rounded mb-1 bg-light';
  row.innerHTML = `<span>${specific.definition} <span class="text-muted">[${specific.start} – ${specific.end}]</span></span>`;

  const actions = buildNodeActions({
    node: specific,
    onRemove: () => {
      generic.specifics = generic.specifics.filter(s => s.uid !== specific.uid);
      renderTree();
    }
  });
  row.appendChild(actions);
  return row;
}

/* Form inline per aggiungere un figlio (generic o specific), pre-limitato al range del padre. */
function buildChildForm({ parent, placeholder, onAdd }) {
  const form = document.createElement('div');
  form.className = 'd-flex gap-2 align-items-start mb-2';

  const defInput = document.createElement('input');
  defInput.type = 'text';
  defInput.className = 'form-control form-control-sm';
  defInput.placeholder = placeholder;

  const startInput = document.createElement('input');
  startInput.type = 'number';
  startInput.step = '1';
  startInput.className = 'form-control form-control-sm';
  startInput.placeholder = 'start';
  startInput.min = parent.start;
  startInput.max = parent.end - 1;

  const endInput = document.createElement('input');
  endInput.type = 'number';
  endInput.step = '1';
  endInput.className = 'form-control form-control-sm';
  endInput.placeholder = 'end';
  endInput.min = parent.start + 1;
  endInput.max = parent.end;

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-sm btn-adc-blue text-nowrap';
  addBtn.textContent = '+ add';
  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const ok = onAdd({
      definition: defInput.value.trim(),
      start: parseInt(startInput.value, 10),
      end: parseInt(endInput.value, 10)
    });
    if (ok) { renderTree(); }
  });

  form.append(defInput, startInput, endInput, addBtn);
  return form;
}

/*
 * Coppia di pulsanti (modifica + rimuovi) per l'header di un nodo.
 * preventDefault evita che il click apra/chiuda il <details> contenitore.
 */
function buildNodeActions({ node, onRemove }) {
  const group = document.createElement('div');
  group.className = 'btn-group btn-group-sm';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-outline-secondary';
  editBtn.innerHTML = '<i class="mdi mdi-pencil"></i> edit';
  editBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (editing.has(node.uid)) { editing.delete(node.uid); }
    else { editing.add(node.uid); expanded.add(node.uid); }
    renderTree();
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-outline-danger';
  delBtn.textContent = 'remove';
  delBtn.addEventListener('click', (e) => {
    e.preventDefault();
    onRemove();
  });

  group.append(editBtn, delBtn);
  return group;
}

/*
 * Form inline per modificare un nodo esistente. La "definition" è editabile
 * solo per generic/specific (per i macro è legata alla definizione standard).
 * Salva sullo stato dopo validateEdit, poi esce dalla modalità modifica.
 */
function buildEditForm({ node, parent, siblings, needDefinition, children }) {
  const form = document.createElement('div');
  form.className = 'd-flex gap-2 align-items-start mb-2 p-2 border rounded bg-warning-subtle';

  let defInput = null;
  if (needDefinition) {
    defInput = document.createElement('input');
    defInput.type = 'text';
    defInput.className = 'form-control form-control-sm';
    defInput.value = node.definition;
  }

  const startInput = document.createElement('input');
  startInput.type = 'number';
  startInput.step = '1';
  startInput.className = 'form-control form-control-sm';
  startInput.value = node.start;

  const endInput = document.createElement('input');
  endInput.type = 'number';
  endInput.step = '1';
  endInput.className = 'form-control form-control-sm';
  endInput.value = node.end;

  if (parent) {
    startInput.min = parent.start;
    startInput.max = parent.end - 1;
    endInput.min = parent.start + 1;
    endInput.max = parent.end;
  }

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-sm btn-success text-nowrap';
  saveBtn.textContent = 'save';
  saveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const start = parseInt(startInput.value, 10);
    const end = parseInt(endInput.value, 10);
    const definition = needDefinition ? defInput.value.trim() : node.definition;
    const err = validateEdit({ node, start, end, definition, parent, siblings, needDefinition, children });
    if (err) { bsAlert(err, 'danger'); return; }
    node.start = start;
    node.end = end;
    if (needDefinition) { node.definition = definition; }
    editing.delete(node.uid);
    renderTree();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-sm btn-outline-secondary text-nowrap';
  cancelBtn.textContent = 'cancel';
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    editing.delete(node.uid);
    renderTree();
  });

  if (defInput) { form.append(defInput); }
  form.append(startInput, endInput, saveBtn, cancelBtn);
  return form;
}

function removeMacro(macroUid) {
  state.tree = state.tree.filter(m => m.uid !== macroUid);
  expanded.delete(macroUid);
  renderTree();
}

/* ---------- Salvataggio / eliminazione ---------- */

function serializeTree() {
  return state.tree.map(m => ({
    macroId: m.macroId,
    start: m.start,
    end: m.end,
    generics: m.generics.map(g => ({
      definition: g.definition,
      start: g.start,
      end: g.end,
      specifics: g.specifics.map(s => ({ definition: s.definition, start: s.start, end: s.end }))
    }))
  }));
}

function resetAfterWrite() {
  state = { id: null, name: '', state: 'draft', tree: [] };
  expanded.clear();
  editing.clear();
  dataWrap.innerHTML = '';
  if (timelineMetadata) { timelineMetadata.classList.add('d-none'); }
  timelineAvailable(); // ricarica la lista delle timeline disponibili
}

async function persist(targetState) {
  if (!state.name) { bsAlert('Please enter a timeline name.', 'warning'); return; }
  if (state.tree.length === 0) { bsAlert('Add at least one macro period.', 'warning'); return; }

  if (targetState === 'complete') {
    const confirmed = await bsConfirm('Publishing makes the timeline available to all users. Continue?');
    if (!confirmed) { return; }
  }

  const tree = serializeTree();
  const res = state.id
    ? await updateTimeline({ timelineId: state.id, name: state.name, state: targetState, tree })
    : await saveTimeline({ name: state.name, state: targetState, tree });

  if (res.error === 0) {
    bsAlert(state.id ? 'Timeline updated successfully!' : 'Timeline saved successfully!', 'success');
    resetAfterWrite();
  } else {
    bsAlert(res.message || 'Error saving timeline.', 'danger');
  }
}

async function removeTimeline() {
  const confirmed = await bsConfirm('Delete this timeline permanently? This cannot be undone.');
  if (!confirmed) { return; }

  const res = await deleteTimeline(state.id);
  if (res.error === 0) {
    bsAlert('Timeline deleted successfully!', 'success');
    resetAfterWrite();
  } else {
    bsAlert(res.message || 'Error deleting timeline.', 'danger');
  }
}
