import { handleCollapse } from '../utils/toggleAccordion.js';
import { setTimeRange } from '../services/setTimeRange.js';
export function createBoundItem(id, name, start, end, parentElement, isLower, isMacro, macroId = null) {
  const suffix = isLower ? 'lower' : 'upper';
  const itemId = `${isMacro ? 'macro' : 'generic'}Group_${suffix}_${id}`;
  const itemClass = `btn-group ${isMacro ? 'macroGroup' : 'genericGroup'}`;
  const selectBtnId = `${isMacro ? 'macro' : 'generic'}Btn_${suffix}_${id}`;
  const selectBtnClass = `btn btn-outline-secondary boundsSelectBtn ${isMacro ? 'boundsMacroBtn' : 'boundsGenericBtn'}`;
  const toggleBtnId = `open${isMacro ? 'Macro' : 'Generic'}Btn_${suffix}_${id}`;
  const collapseId = `collapse${isMacro ? 'Macro' : 'Generic'}_${suffix}_${id}`;
  const collapseClass = `collapse ${isMacro ? 'collapseMacro' : 'collapseGeneric'}`;

  const item = document.createElement('div');
  item.id = itemId;
  item.className = itemClass;
  if (!isMacro) item.dataset.macroId = macroId;

  const selectBtn = document.createElement('button');
  selectBtn.id = selectBtnId;
  selectBtn.className = selectBtnClass;
  selectBtn.type = 'button';
  selectBtn.textContent = name;
  selectBtn.title = `Select ${name} value`;
  selectBtn.dataset.from = start;
  selectBtn.dataset.to = end;
  selectBtn.addEventListener('click', () => { setTimeRange(start, end, isLower, name); });
  item.appendChild(selectBtn);

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'btn btn-outline-secondary dropdown-toggle dropdown-toggle-split';
  toggleBtn.id = toggleBtnId;
  toggleBtn.title = `Toggle ${name} details`;
  toggleBtn.setAttribute('data-bs-toggle', 'collapse');
  toggleBtn.setAttribute('data-bs-target', `#${collapseId}`);

  const icon = document.createElement('i');
  icon.className = 'mdi mdi-menu-down';
  toggleBtn.appendChild(icon);

  const visuallyHiddenSpan = document.createElement('span');
  visuallyHiddenSpan.className = 'visually-hidden';
  visuallyHiddenSpan.textContent = 'Toggle';
  toggleBtn.appendChild(visuallyHiddenSpan);
  item.appendChild(toggleBtn);

  parentElement.appendChild(item);

  const collapse = document.createElement('div');
  collapse.id = collapseId;
  collapse.className = collapseClass;
  parentElement.appendChild(collapse);
  collapse.classList.remove('show');

  handleCollapse(icon, collapse, parentElement, isLower, isMacro);

  return collapse;
}
