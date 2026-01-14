import { fetchApi } from "../../../../shared/utils/fetch.js";
import { createBoundItem } from '../services/createBoundItem.js';
import { setTimeRange, resetTimeRange } from '../services/setTimeRange.js';

export async function setBounds(bounds) {
  // Resetta i pulsanti e gli input quando cambia la timeline
  resetTimeRange();
  
  function initLevel(obj, level = 0, path = [], parentElement, macroId = null, isLower = true) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const currentPath = [...path, key];
      
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if (level === 0) {
            const macroCollapse = setMacro(value.macro_id, value.macro, value.start, value.end, parentElement, isLower);
            initLevel(value, level + 1, currentPath, macroCollapse, value.macro_id, isLower);
          } else if (level === 1) {
            const genericCollapse = setGeneric(value.generic_id, value.generic, value.start, value.end, parentElement, macroId, isLower);
            initLevel(value, level + 1, currentPath, genericCollapse, macroId, isLower);
          } else if (level === 2) {
            setSpecific(value.specific_id, value.specific, value.start, value.end, parentElement, isLower);
          }
        }
      }
    }
  }

  const lowerBoundsAccordion = document.getElementById('lowerBoundsAccordion');
  const upperBoundsAccordion = document.getElementById('upperBoundsAccordion');
  if (!lowerBoundsAccordion || !upperBoundsAccordion) {
    console.error('lowerBoundsAccordion or upperBoundsAccordion element not found');
    return;
  }
  
  const lowerBound = document.getElementById('lowerBoundBtn');
  const upperBound = document.getElementById('upperBoundBtn');
  lowerBound.disabled = false;
  upperBound.disabled = false;

  // Svuota i contenitori prima di popolarli
  lowerBoundsAccordion.innerHTML = '';
  upperBoundsAccordion.innerHTML = '';

  initLevel(bounds, 0, [], lowerBoundsAccordion, null, true);
  initLevel(bounds, 0, [], upperBoundsAccordion, null, false);
}

function setMacro(macroId, macroName, start, end, parentElement, isLower) {
  return createBoundItem(macroId, macroName, start, end, parentElement, isLower, true);
}

function setGeneric(genericId, genericName, start, end, parentElement, macroId, isLower) {
  return createBoundItem(genericId, genericName, start, end, parentElement, isLower, false, macroId);
}

function setSpecific(specificId, specificName, start, end, parentElement, isLower) {
  const suffix = isLower ? 'lower' : 'upper';
  const specificBtn = document.createElement('button');
  specificBtn.id = `specificBtn_${suffix}_${specificId}`;
  specificBtn.className = 'btn btn-outline-secondary boundsSelectBtn boundsSpecificBtn';
  specificBtn.type = 'button';
  specificBtn.title = `Select ${specificName} value`;
  specificBtn.textContent = specificName;
  specificBtn.dataset.from = start;
  specificBtn.dataset.to = end;
  specificBtn.addEventListener('click', () => { 
    setTimeRange(start, end, isLower, specificName); 
  });
  parentElement.appendChild(specificBtn);
}

// Funzione per fetchare il bound più specifico per un valore dato
export async function fetchBoundForValue(timelineId, value) {
  try {
    const payload = {
      class: 'Timeline',
      action: 'getTimelineList',
      table: 'time_series_complete',
      conditions: {
        timeline_id: timelineId,
        start: [value, '<='],
        end: [value, '>='],
      },
      columns: ['`specific`', '`generic`', '`macro`', '`start`', '`end`'],
      orderBy: { '`end` - `start`': 'ASC' },
      limit: 1
    };
    const response = await fetchApi({ body: payload });
    if (response.error === 1 || !response.data || response.data.length === 0) {
      return null;
    }
    return response.data[0];
  } catch (error) {
    console.error('Error fetching bound for value:', error);
    return null;
  }
}