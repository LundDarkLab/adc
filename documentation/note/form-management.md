# Gestione dei Form - Documentazione

## Panoramica

Il sistema di gestione form fornisce utility per raccogliere, strutturare e inviare dati dai form in modo standardizzato e riutilizzabile. Le funzioni si basano sull'attributo `data-table` per mappare i campi del form alle tabelle del database.

---

## Funzioni Disponibili

### 1. buildFormData()

Raccoglie i dati da tutti i campi con attributo `data-table` e li struttura in un oggetto annidato per tabella.

**Firma:**
```javascript
buildFormData(container = document, options = {})
```

**Parametri:**
- `container` (HTMLElement|string, opzionale): Form o selettore CSS. Default: `document` (cerca in tutta la pagina)
- `options` (Object, opzionale):
  - `includeDisabled` (boolean): Include campi disabilitati. Default: `false`
  - `includeEmpty` (boolean): Include campi vuoti. Default: `false`
  - `dataAttribute` (string): Nome dell'attributo data. Default: `'table'`

**Ritorna:** `Object` con struttura `{tabella: {campo: valore}}`

**Esempio HTML:**
```html
<form id="artifactForm">
  <input type="text" id="name" data-table="artifacts" value="Vase">
  <input type="email" id="email" data-table="users" value="john@example.com">
  <input type="text" id="theme" data-table="settings" value="dark">
</form>
```

**Esempio utilizzo:**
```javascript
import { buildFormData } from './shared/utils/buildFormData.js';

// Cerca in tutto il documento
const allData = buildFormData();

// Solo in un form specifico
const formData = buildFormData('#artifactForm');
// Risultato:
// {
//   artifacts: { name: 'Vase' },
//   users: { email: 'john@example.com' },
//   settings: { theme: 'dark' }
// }

// Con opzioni
const dataWithEmpty = buildFormData('#artifactForm', {
  includeEmpty: true,
  includeDisabled: true
});
```

---

### 2. buildFormDataFlat()

Restituisce i dati come array flat, più facile da iterare.

**Firma:**
```javascript
buildFormDataFlat(container = document, options = {})
```

**Ritorna:** `Array` di oggetti `{table, field, value}`

**Esempio utilizzo:**
```javascript
const flatData = buildFormDataFlat('#artifactForm');
// Risultato:
// [
//   { table: 'artifacts', field: 'name', value: 'Vase' },
//   { table: 'users', field: 'email', value: 'john@example.com' },
//   { table: 'settings', field: 'theme', value: 'dark' }
// ]

// Uso pratico: iterazione e logging
flatData.forEach(item => {
  console.log(`Inserting ${item.field} into ${item.table}`);
});

// Validazione campo per campo
const errors = flatData
  .filter(item => !item.value)
  .map(item => `${item.table}.${item.field} is required`);
```

---

### 3. buildFormDataForSubmit()

Crea un oggetto `FormData` per invio multipart/form-data. **Usare quando ci sono file da caricare.**

**Firma:**
```javascript
buildFormDataForSubmit(container = document, options = {})
```

**Ritorna:** `FormData`

**Esempio utilizzo:**
```javascript
// Form con file upload
const formData = buildFormDataForSubmit('#uploadForm');

// Invio con fetch
fetch('/api/upload', {
  method: 'POST',
  body: formData // Non serve Content-Type header
});
```

---

### 4. buildFormDataJSON()

Converte i dati in stringa JSON per invio API.

**Firma:**
```javascript
buildFormDataJSON(container = document, options = {})
```

**Ritorna:** `string` (JSON)

**Esempio utilizzo:**
```javascript
const jsonData = buildFormDataJSON('#artifactForm');
// Risultato: '{"artifacts":{"name":"Vase"},"users":{"email":"john@example.com"}}'

fetch('/api/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: jsonData
});
```

---

## Gestione Submit Form

### handleFormSubmit()

Gestisce automaticamente il submit del form con validazione, invio dati e feedback UI.

**Workflow automatico:**
1. Validazione HTML5 (`required`, `pattern`, etc.)
2. Validazione custom (se fornita)
3. Disabilita button submit
4. Raccoglie dati con `buildFormData` (default) o `buildFormDataForSubmit` (se `useFormData: true`)
5. Invia dati con `fetchApi` (JSON) o `fetch` nativo (FormData per file)
6. Mostra alert successo/errore
7. Reset form (opzionale)
8. Riabilita button submit

**Firma:**
```javascript
handleFormSubmit(form, options = {})
```

**Parametri:**
- `form` (HTMLElement|string): Form o selettore CSS
- `options` (Object):
  - `url` (string, opzionale): URL di destinazione. Default: usa `ENDPOINT` da `apiConfig.js`
  - `method` (string, opzionale): Metodo HTTP. Default: `'POST'`
  - `headers` (Object, opzionale): Headers HTTP custom (es: JWT Bearer token)
  - `onSuccess` (Function): Callback successo, riceve `(data)`
  - `onError` (Function): Callback errore, riceve `(error)`
  - `customValidation` (Function): Validazione custom, riceve `(formElement)`, deve ritornare `boolean`
  - `beforeSubmit` (Function): Modifica dati prima dell'invio, riceve `(data)`, deve restituire `data`
  - `formOptions` (Object): Opzioni per `buildFormData`
  - `useFormData` (boolean): Usa FormData per file upload invece di JSON. Default: `false`
  - `showAlerts` (boolean): Mostra alert automatici. Default: `true`
  - `successMessage` (string): Messaggio successo custom. Default: `'Data saved successfully!'`
  - `errorMessage` (string): Messaggio errore custom. Default: `'Error saving data'`
  - `resetOnSuccess` (boolean): Reset form dopo successo. Default: `true`

**Ritorna:** `Function` - Cleanup per rimuovere listener

**Esempi utilizzo:**

#### Uso base (più semplice)
```javascript
import { handleFormSubmit } from './shared/utils/handleFormSubmit.js';

// Submit automatico - usa ENDPOINT di default
handleFormSubmit('#artifactForm');

// Con URL custom
handleFormSubmit('#artifactForm', {
  url: '/api/artifacts/save'
});

// Con file upload (FormData)
handleFormSubmit('#uploadForm', {
  url: '/api/upload',
  useFormData: true
});
```

#### Con callback
```javascript
handleFormSubmit('#artifactForm', {
  url: '/api/artifacts/save',
  onSuccess: (data) => {
    console.log('Artifact saved with ID:', data.id);
    window.location.href = '/artifacts/list';
  },
  onError: (error) => {
    console.error('Failed to save:', error);
  }
});
```

#### Con validazione custom
```javascript
handleFormSubmit('#artifactForm', {
  url: '/api/artifacts/save',
  customValidation: (form) => {
    const startDate = form.querySelector('#start_date').value;
    const endDate = form.querySelector('#end_date').value;
    
    if (startDate && endDate && startDate > endDate) {
      bsAlert('Start date must be before end date', 'warning', 3000);
      return false;
    }
    return true;
  },
  successMessage: 'Artifact created successfully!',
  onSuccess: (data) => {
    refreshArtifactList();
  }
});
```

#### Con beforeSubmit (aggiungere array)
```javascript
import { getMaterialTechniqueArray, clearMaterialTechniqueArray } from './materialTechniqueComponent.js';

handleFormSubmit('#artifactForm', {
  customValidation: (form) => {
    const materials = getMaterialTechniqueArray();
    if (materials.length === 0) {
      bsAlert('You must add at least one material', 'warning', 3000);
      return false;
    }
    return true;
  },
  beforeSubmit: (data) => {
    // Aggiungi array ai dati del form
    data.artifact_material_technique = getMaterialTechniqueArray();
    data.artifact_images = getImagesArray();
    return data;
  },
  successMessage: 'Artifact saved!',
  onSuccess: (result) => {
    clearMaterialTechniqueArray();
    console.log('Created ID:', result.id);
  }
});
```

#### Con JWT Bearer Token
```javascript
// Helper per JWT
function getJWTToken() {
  return localStorage.getItem('jwt_token');
}

// Form con autenticazione JWT
handleFormSubmit('#artifactForm', {
  headers: {
    'Authorization': `Bearer ${getJWTToken()}`
  },
  beforeSubmit: (data) => {
    data.artifact_material_technique = getMaterialTechniqueArray();
    return data;
  }
});
```

#### Con opzioni avanzate
```javascript
const cleanup = handleFormSubmit('#artifactForm', {
  url: '/api/artifacts/update.php',
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${getJWTToken()}`,
    'X-API-Key': 'your-api-key'
  },
  formOptions: {
    includeEmpty: true,
    includeDisabled: false
  },
  beforeSubmit: (data) => {
    data.artifact_material_technique = getMaterialTechniqueArray();
    data.metadata = { timestamp: new Date().toISOString() };
    return data;
  },
  customValidation: (form) => {
    return validateComplexLogic(form);
  },
  successMessage: 'Artifact updated!',
  resetOnSuccess: false,
  onSuccess: (data) => {
    console.log('Updated:', data);
  }
});

// Cleanup quando necessario (es. unmount component)
// cleanup();
```

---

### quickFormSubmit()

Versione semplificata per uso rapido. Usa ENDPOINT di default.

**Firma:**
```javascript
quickFormSubmit(form, onSuccess)
```

**Esempio:**
```javascript
import { quickFormSubmit } from './shared/utils/handleFormSubmit.js';

// Usa ENDPOINT di default
quickFormSubmit('#simpleForm', (data) => {
  console.log('Saved!', data);
});
```

---

## Best Practices

### 1. Struttura HTML

Ogni campo deve avere:
- `id` o `name` (identificatore campo)
- `data-table` (tabella di destinazione)

```html
<form id="artifactForm">
  <!-- Campo obbligatorio -->
  <input type="text" 
         id="title" 
         data-table="artifacts" 
         required>
  
  <!-- Campo con pattern -->
  <input type="email" 
         id="email" 
         data-table="users" 
         pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
         required>
  
  <!-- Select -->
  <select id="category" data-table="artifacts">
    <option value="">Select...</option>
    <option value="1">Ceramic</option>
  </select>
  
  <!-- Checkbox -->
  <input type="checkbox" 
         id="is_public" 
         data-table="artifacts">
  
  <!-- Radio -->
  <input type="radio" 
         name="status" 
         id="active" 
         value="active" 
         data-table="artifacts">
  
  <button type="submit">Save</button>
</form>
```

### 2. Listener sul form, non sul button

```javascript
// ✅ CORRETTO - cattura tutti i submit (Enter, click, etc.)
form.addEventListener('submit', handler);

// ❌ SBAGLIATO - non cattura Enter key
button.addEventListener('click', handler);
```

### 3. Validazione progressiva

```javascript
// HTML5 validation
if (!form.checkValidity()) {
  form.reportValidity();
  return;
}

// Business logic validation
if (!customValidation()) {
  return;
}
```

### 4. Gestione tipi di dato

```javascript
// Checkbox: 1 o 0
checkbox.checked ? 1 : 0

// Radio: solo se checked
if (radio.checked) value = radio.value

// Select multiple: array
Array.from(select.selectedOptions).map(opt => opt.value)
```

### 5. Quando usare quale funzione

| Funzione | Quando usarla |
|----------|---------------|
| `buildFormData()` | Accesso diretto ai valori per tabella |
| `buildFormDataFlat()` | Iterazione sequenziale, logging, validazione |
| `buildFormDataForSubmit()` | Upload file, multipart/form-data |
| `buildFormDataJSON()` | Invio JSON API, no file |
| `handleFormSubmit()` | Submit automatico completo |
| `quickFormSubmit()` | Submit semplice e veloce |

---

## Esempio Completo

```html
<!-- HTML -->
<form id="artifactForm" action="/api/artifacts/save">
  <input type="text" id="title" data-table="artifacts" required>
  <input type="date" id="start_date" data-table="chronology">
  <input type="date" id="end_date" data-table="chronology">
  <select id="category" data-table="artifacts" required>
    <option value="">Select...</option>
    <option value="1">Ceramic</option>
  </select>
  <button type="submit">Save Artifact</button>
</form>
```

```javascript
// JavaScript
import { handleFormSubmit } from './shared/utils/handleFormSubmit.js';
import { getMaterialTechniqueArray, clearMaterialTechniqueArray } from './materialTechniqueComponent.js';

// Inizializza gestione form
handleFormSubmit('#artifactForm', {
  // URL opzionale (usa ENDPOINT di default se omesso)
  // url: '/api/artifacts/save',
  
  // Validazione custom
  customValidation: (form) => {
    const start = form.querySelector('#start_date').value;
    const end = form.querySelector('#end_date').value;
    
    if (start && end && start > end) {
      bsAlert('Invalid date range', 'warning', 3000);
      return false;
    }
    
    // Verifica array materiali
    if (getMaterialTechniqueArray().length === 0) {
      bsAlert('You must add at least one material', 'warning', 3000);
      return false;
    }
    
    return true;
  },
  
  // Aggiungi array prima dell'invio
  beforeSubmit: (data) => {
    data.artifact_material_technique = getMaterialTechniqueArray();
    return data;
  },
  
  // Opzioni build data
  formOptions: {
    includeEmpty: false
  },
  
  // Messaggi custom
  successMessage: 'Artifact created successfully!',
  errorMessage: 'Failed to create artifact',
  
  // Callback successo
  onSuccess: (data) => {
    console.log('Created artifact ID:', data.id);
    clearMaterialTechniqueArray();
    window.location.href = `/artifacts/view/${data.id}`;
  },
  
  // Callback errore
  onError: (error) => {
    console.error('Error:', error);
    // Gestione errore custom
  }
});
```

---

## Note Tecniche

### Gestione Errori

`fetchApi` gestisce automaticamente:
- Response non OK (status >= 400)
- Errori di rete
- JSON parsing errors
- Logging console

`handleFormSubmit` aggiunge:
- Alert automatici
- UI feedback (disable button)
- Callback custom per gestione errori specifici

### Invio Dati

**Default (JSON):**
- Usa `buildFormData()` → oggetto JavaScript
- `fetchApi` fa automaticamente `JSON.stringify()`
- Content-Type: `application/json`
- **Non serve** usare `buildFormDataJSON()` (evita doppia conversione)

**Con file (useFormData: true):**
- Usa `buildFormDataForSubmit()` → oggetto FormData
- Fetch nativo (non `fetchApi`)
- Content-Type: `multipart/form-data` (automatico del browser)
- Necessario per upload file

### Tipi di Input Supportati

- `text`, `email`, `password`, `number`, `date`, `time`, etc.
- `checkbox` → valore `1` o `0`
- `radio` → valore solo se checked
- `select` → singolo valore
- `select[multiple]` → array di valori
- `textarea` → testo

### Performance

- Le funzioni usano `querySelectorAll` con selettore specifico `[data-table]`
- Non ci sono chiamate ricorsive o loop annidati
- La validazione HTML5 è nativa del browser
- Il DOM viene letto una sola volta per submit

---

## Troubleshooting

### Il form non invia

✓ Verifica che `type="submit"` sia sul button  
✓ Controlla la validazione HTML5  
✓ Verifica che `data-table` e `id` siano presenti  
✓ Controlla la console per errori

### Valori non raccolti

✓ Verifica presenza attributo `data-table`  
✓ Verifica che il campo abbia `id` o `name`  
✓ Per radio, verifica che uno sia `checked`  
✓ Usa `includeEmpty: true` se vuoi anche valori vuoti

### Alert non appare

✓ Verifica import di `bsAlert`  
✓ Usa `showAlerts: true` (default)  
✓ Controlla che Bootstrap Toast sia inizializzato

---

## Changelog

**v1.1.0** - 12 gennaio 2026
- Aggiunto supporto `beforeSubmit` per modificare dati prima dell'invio
- Parametri `url`, `method`, `headers` ora opzionali (usa default da `fetchApi`)
- Supporto JWT Bearer token tramite parametro `headers`
- Aggiornato `quickFormSubmit` (rimossa url obbligatoria)
- Migliorata flessibilità per app in crescita

**v1.0.0** - 12 gennaio 2026
- Implementazione iniziale
- Funzioni: `buildFormData`, `buildFormDataFlat`, `buildFormDataForSubmit`, `buildFormDataJSON`
- Gestione submit: `handleFormSubmit`, `quickFormSubmit`
- Supporto validazione HTML5 e custom
- Integrazione con `fetchApi` e `bsAlert`
