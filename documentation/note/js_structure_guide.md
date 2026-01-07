# Guida alla Struttura del Codice JavaScript per Lund

## Introduzione
Questa guida documenta la struttura proposta per la cartella `js/` dell'applicazione Lund. L'obiettivo è organizzare il codice in modo coerente, scalabile e manutenibile, separando chiaramente la logica business dalle interazioni con il backend, e suddividendo le features in layer distinti (API, services, utils, orchestrazione). Questo approccio evita la mescolanza di file vecchi e nuovi, facilita i test e l'aggiunta di nuove funzionalità.

La struttura è ispirata a pattern comuni come **feature-based architecture** e **layered architecture**, con enfasi su modularità e riutilizzo.

## Principi Generali
- **Organizzazione per feature**: Ogni funzionalità principale (es. artifact, model, user) ha la sua cartella in `features/`. Questo raggruppa tutto ciò che riguarda una feature specifica.
- **Separazione dei layer**:
  - **API**: Gestisce le interazioni con il backend (chiamate AJAX/fetch, endpoint). Es. `artifactApi.js` per chiamate relative agli artifact.
  - **Services (Logica business)**: Contiene regole business, validazioni e trasformazioni dati. Usa l'API ma non interagisce direttamente con il DOM.
  - **Orchestrazione**: Coordina gli elementi (event listeners, inizializzazioni). Di solito nel file `index.js` della feature.
  - **Utils/Helpers**: Funzioni generiche riutilizzabili (es. formattazione, validazioni comuni).
  - **Components**: Elementi UI riutilizzabili o specifici per feature.
- **Shared**: Per codice comune a più features (es. componenti trasversali come 3D viewer o timeline).
- **Migrazione graduale**: Sposta i file esistenti in `old_file/` e migra una feature alla volta.
- **Convenzioni**: Usa ES6 modules (import/export). Nomi chiari (es. `artifactService.js`). Aggiungi `index.js` per esportare da ogni cartella.
- **Test e build**: Assicurati che il bundler supporti la struttura. Testa ogni layer separatamente.

## Struttura Dettagliata
Ecco la struttura proposta per `js/`:

```
js/
├── shared/                    # Codice comune a più features
│   ├── api/                   # API comuni (es. autenticazione, logging)
│   │   ├── authApi.js         # Chiamate per login/logout
│   │   └── commonApi.js       # Wrapper per chiamate generiche (es. AJAX)
│   ├── utils/                 # Utility generiche (sostituisce helpers/)
│   │   ├── dateUtils.js       # Formattazione date
│   │   ├── validationUtils.js # Validazioni comuni
│   │   └── domUtils.js        # Manipolazione DOM
│   ├── components/            # Componenti UI riutilizzabili
│   │   ├── modal.js           # Modali generiche
│   │   ├── toast.js           # Notifiche toast
│   │   ├── 3dViewer/          # Visualizzatore 3D (condiviso tra artifact e model)
│   │   │   ├── api/           # Chiamate per caricare modelli 3D
│   │   │   │   └── viewerApi.js
│   │   │   ├── services/      # Logica viewer (rendering, controlli)
│   │   │   │   └── viewerService.js
│   │   │   ├── utils/         # Utility viewer (calcoli)
│   │   │   │   └── viewerUtils.js
│   │   │   ├── components/    # Sottocomponenti viewer
│   │   │   │   └── controls.js
│   │   │   └── index.js       # Esporta init3DViewer()
│   │   └── timeline/          # Timeline (usata da più features)
│   │       ├── api/           # Chiamate per dati timeline
│   │       ├── services/      # Logica timeline (filtri)
│   │       ├── utils/         # Utility timeline
│   │       ├── components/    # Elementi UI timeline
│   │       └── index.js       # Esporta initTimeline()
│   └── config/                # Configurazioni globali
│       └── appConfig.js       # Es. API base URL
├── features/                  # Organizzato per feature
│   ├── artifact/              # Feature "artifact"
│   │   ├── api/               # Interazioni backend per artifact
│   │   │   └── artifactApi.js # getArtifact(), addArtifact()
│   │   ├── services/          # Logica business per artifact
│   │   │   └── artifactService.js # Validazioni, calcolo specs
│   │   ├── utils/             # Utility specifiche per artifact
│   │   │   └── artifactUtils.js # Parsing materiali
│   │   ├── components/        # Componenti UI per artifact
│   │   │   └── artifactForm.js # Gestione form
│   │   └── index.js           # Punto di ingresso: importa shared/, gestisce orchestrazione
│   ├── model/                 # Feature "model" (simile a artifact)
│   │   └── ...
│   ├── user/                  # Feature "user"
│   │   └── ...
│   └── ... (altre features: institution, dashboard, map, ecc.)
├── old_file/                  # File vecchi da migrare
│   ├── artifact_add_old.js    # Rinomina durante migrazione
│   └── ...
└── main.js                    # File principale: importa features necessarie, inizializzazioni globali
```

### Spiegazione dei Layer
- **API**: Solo chiamate al backend. Non logica business. Esempio:
  ```javascript
  // features/artifact/api/artifactApi.js
  export async function getArtifact(id) {
    return fetch(`${API_BASE}/artifact.php`, { method: 'POST', body: JSON.stringify({ trigger: 'getArtifact', id }) });
  }
  ```
- **Services**: Logica specifica. Usa API, applica regole. Esempio:
  ```javascript
  // features/artifact/services/artifactService.js
  import { getArtifact } from '../api/artifactApi.js';
  export function validateArtifact(data) { /* regole business */ }
  ```
- **Orchestrazione (index.js)**: Coordina. Esempio:
  ```javascript
  // features/artifact/index.js
  import { init3DViewer } from '../../shared/components/3dViewer/index.js';
  document.addEventListener('DOMContentLoaded', () => { init3DViewer(); });
  ```
- **Utils**: Funzioni pure, riutilizzabili.
- **Components**: UI. Per condivisi, usa `shared/components/`.

## Esempi di Migrazione
- Da `artifact_add.js`: Sposta chiamate AJAX in `api/`, validazioni in `services/`, event listeners in `index.js`.
- Componenti condivisi: Importa da `shared/` (es. `import { initTimeline } from '../../shared/components/timeline/index.js';`).

## Schema Modello per una Nuova Feature
Quando aggiungi una feature (es. "vocabulary"):
1. Crea `features/vocabulary/`.
2. Aggiungi sottocartelle: `api/`, `services/`, `utils/`, `components/`, `index.js`.
3. In `index.js`, importa shared se necessario.
4. In `main.js`, importa la feature.
5. Testa layer per layer.

## Ruolo di main.js e index.js
- **main.js**: È il file principale dell'app, punto di ingresso globale. Gestisce inizializzazioni globali (es. configurazione API), importa componenti shared sempre necessari (es. menu header), e carica dinamicamente le feature basandosi sulla pagina corrente (usando `window.pageType`). Viene incluso in ogni pagina HTML/PHP.
- **index.js (per feature/componente)**: Punto di ingresso per una feature o componente shared. Esporta funzioni pubbliche, gestisce orchestrazione specifica (event listeners, coordinamento tra layer interni). Non contiene logica globale.

## Come Usarli
- **Inclusione nelle pagine**: In ogni pagina PHP (es. `artifact_add.php`), includi sempre `<script src="js/main.js"></script>`. Imposta `window.pageType` nel PHP per condizionare gli import.
- **Flusso**: `main.js` importa shared globali, poi carica la feature specifica via dynamic import. Esempio:
  ```javascript
  // main.js
  import { initHeaderMenu } from './shared/components/headerMenu/index.js';
  initHeaderMenu();  // Sempre attivo

  if (window.pageType === 'artifact_add') {
    import('./features/artifact/index.js').then(module => module.initArtifactPage());
  }
  ```
- **Vantaggi**: Lazy loading, modularità, evita duplicazioni.

## Cosa Inserire in main.js
- Inizializzazioni globali: Configurazione API, setup librerie.
- Componenti shared globali: Menu header, menu utenti.
- Non inserire logica specifica di feature (va negli index.js).

## Configurazioni Generali (Menu Utenti, Header, ecc.)
- Trattale come componenti shared in `shared/components/` (es. `headerMenu/`, `userMenu/`).
- Struttura interna: api/, services/, utils/, components/, index.js.
- Importa e inizializza sempre in `main.js` (sono globali).

Questa struttura mantiene l'app coerente e funzionale man mano che cresce.