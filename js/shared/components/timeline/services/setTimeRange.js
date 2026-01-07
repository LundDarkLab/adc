const startInput = document.getElementById('start');
const endInput = document.getElementById('end');

// Memorizza i range globali per la validazione
let globalFrom = null;
let globalTo = null;

function setValue(from,to){
  if (startInput) {
    startInput.value = from;
    startInput.min = from;
    startInput.max = to;
    startInput.disabled = false;
  }
    
  // Imposta end
  if (endInput) {
    endInput.value = to;
    endInput.min = from;
    endInput.max = globalTo;
    endInput.disabled = false;
  }
}

export function setTimeRange(from, to, isLower = null, buttonName = null) {
  
  const lowerBoundBtn = document.getElementById('lowerBoundBtn');
  const upperBoundBtn = document.getElementById('upperBoundBtn');
  
  if (!startInput || !endInput) {
    console.error('Start or End input element not found');
    return;
  }
  
  // Aggiorna i range globali
  if (globalFrom === null || from < globalFrom) {
    globalFrom = from;
  }
  if (globalTo === null || to > globalTo) {
    globalTo = to;
  }
  
  console.log(`from: ${from}, globalFrom: ${globalFrom}, to: ${to}, globalTo: ${globalTo}, isLower: ${isLower}, buttonName: ${buttonName}`);

  if(isLower === null && buttonName === null) {
    setValue(from, to);
    return;
  }

  if (isLower) {
    // Lower bound: aggiorna il testo del pulsante
    if (lowerBoundBtn) {
      const icon = lowerBoundBtn.querySelector('i');
      const iconHTML = icon ? icon.outerHTML : '';
      lowerBoundBtn.innerHTML = `${buttonName} ${iconHTML}`;
      upperBoundBtn1.innerHTML = `${buttonName} ${iconHTML}`;
    }
    setValue(from, to);
    
    // Disabilita i button di upper bound che hanno 'to' minore del 'to' selezionato
    disableUpperBoundsBelow(to);
    
  } else {
    // Upper bound: verifica che from non sia minore dello start attuale
    const currentStart = parseInt(startInput.value);
    
    if (currentStart && to < currentStart) {
      console.warn(`Upper bound end (${to}) cannot be less than current start (${currentStart})`);
      alert(`Il valore finale del limite superiore (${to}) non può essere minore del valore iniziale già impostato (${currentStart})`);
      return;
    }
    
    // Aggiorna il testo del pulsante upper
    if (upperBoundBtn) {
      const icon = upperBoundBtn.querySelector('i');
      const iconHTML = icon ? icon.outerHTML : '';
      upperBoundBtn.innerHTML = `${buttonName} ${iconHTML}`;
    }
    
    // Aggiorna solo end
    if (endInput) {
      endInput.value = to;
      endInput.max = to;
      if (currentStart) {
        endInput.min = currentStart;
      }
    }
    
    if (startInput && currentStart) {
      startInput.max = to;
    }
  }
  
  // Aggiungi event listeners solo se non esistono già
  if (!startInput.dataset.listenerAdded) {
    startInput.addEventListener('change', validateRange);
    startInput.addEventListener('blur', validateRange);
    startInput.dataset.listenerAdded = 'true';
  }
  if (!endInput.dataset.listenerAdded) {
    endInput.addEventListener('change', validateRange);
    endInput.addEventListener('blur', validateRange);
    endInput.dataset.listenerAdded = 'true';
  }
}

function disableUpperBoundsBelow(minValue) {
  // Trova tutti i button di upper bounds
  const upperButtons = document.querySelectorAll('[id^="macroBtn_upper_"], [id^="genericBtn_upper_"], [id^="specificBtn_upper_"]');
  
  upperButtons.forEach(btn => {
    const btnTo = parseInt(btn.dataset.to);
    if (btnTo < minValue) {
      btn.disabled = true;
      btn.classList.add('disabled');
      btn.title = `This value (${btnTo}) is less than the lower bound end (${minValue})`;
    } else {
      btn.disabled = false;
      btn.classList.remove('disabled');
      btn.title = btn.textContent;
    }
  });
}

// Funzione per resettare i button quando cambia la timeline
export function resetTimeRange() {
  globalFrom = null;
  globalTo = null;
  
  const lowerBoundBtn = document.getElementById('lowerBoundBtn');
  const upperBoundBtn = document.getElementById('upperBoundBtn');
  
  if (lowerBoundBtn) {
    // Rimuovi il contenuto esistente e ricrea con testo e icona
    lowerBoundBtn.innerHTML = '';
    lowerBoundBtn.appendChild(document.createTextNode('select a lower value '));
    const lowerIcon = document.createElement('i');
    lowerIcon.id = 'lowerBoundIcon';
    lowerIcon.className = 'mdi mdi-menu-down';
    lowerBoundBtn.appendChild(lowerIcon);
  }
  
  if (upperBoundBtn) {
    // Rimuovi il contenuto esistente e ricrea con testo e icona
    upperBoundBtn.innerHTML = '';
    upperBoundBtn.appendChild(document.createTextNode('select an upper value '));
    const upperIcon = document.createElement('i');
    upperIcon.id = 'upperBoundIcon';
    upperIcon.className = 'mdi mdi-menu-down';
    upperBoundBtn.appendChild(upperIcon);
  }
  
  if (startInput) {
    startInput.value = '';
    startInput.min = '';
    startInput.max = '';
    startInput.disabled = true;
  }
  if (endInput) {
    endInput.value = '';
    endInput.min = '';
    endInput.max = '';
    endInput.disabled = true;
  }
  
  // Riabilita tutti i button di upper bounds
  const upperButtons = document.querySelectorAll('[id^="macroBtn_upper_"], [id^="genericBtn_upper_"], [id^="specificBtn_upper_"]');
  upperButtons.forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('disabled');
  });
}

function validateRange() {  
  const startErrorDiv = document.getElementById('validateStart');
  const endErrorDiv = document.getElementById('validateEnd');
  
  if (!startErrorDiv || !endErrorDiv) {
    console.warn('Validation error divs not found');
    return;
  }
  
  const startValue = parseInt(startInput.value);
  const endValue = parseInt(endInput.value);
  let startError = '';
  let endError = '';

  if (!startValue) {
    startError = 'Start date is required';
  }
  if (!endValue) {
    endError = 'End date is required';
  }

  if (isNaN(startValue)) {
    startError = 'Start date must be a valid number';
  }
  if (isNaN(endValue)) {
    endError = 'End date must be a valid number';
  }
  
  if (!isNaN(startValue) && !isNaN(endValue)) {
    if (globalFrom !== null && (startValue < globalFrom || startValue > globalTo)) {
      startError = (startError ? startError + '<br> ' : '') + `Start date must be between ${globalFrom} and ${globalTo}`;
    }
    if (globalTo !== null && (endValue < globalFrom || endValue > globalTo)) {
      endError = (endError ? endError + '<br> ' : '') + `End date must be between ${globalFrom} and ${globalTo}`;
    }
    if (startValue > endValue) {
      startError = (startError ? startError + '<br> ' : '') + 'Start date cannot be greater than End date';
      endError = (endError ? endError + '<br> ' : '') + 'End date cannot be less than Start date';
    }
  }

  if (startError) {
    startErrorDiv.innerHTML = startError;
    startErrorDiv.style.display = 'block';
  } else {
    startErrorDiv.innerHTML = '';
    startErrorDiv.style.display = 'none';
  }

  if (endError) {
    endErrorDiv.innerHTML = endError;
    endErrorDiv.style.display = 'block';
  } else {
    endErrorDiv.innerHTML = '';
    endErrorDiv.style.display = 'none';
  }

  if (!startError && !endError && globalFrom !== null && globalTo !== null) {
    startInput.min = globalFrom;
    startInput.max = endValue;
    endInput.min = startValue;
    endInput.max = globalTo;
  }

  startInput.setCustomValidity(startError);
  endInput.setCustomValidity(endError);
}