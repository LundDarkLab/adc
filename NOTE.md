### 250917
# Gestione dello stato con l'oggetto `state`

## Perché è stato introdotto l'oggetto `state`

L'oggetto `state` è stato introdotto per centralizzare e semplificare la gestione dei dati dell'applicazione in memoria (RAM), rendendo il codice più leggibile, reattivo e facilmente manutenibile. In precedenza, molte funzioni interrogavano direttamente il `localStorage` per leggere o scrivere dati, causando ridondanza, possibili incoerenze e rallentamenti nell'interfaccia.

## Perché è utile

- **Performance**: riduce le chiamate ripetute a `localStorage`, mantenendo i dati più usati direttamente in RAM.
- **Coerenza**: tutte le funzioni lavorano su una "fonte unica di verità", evitando dati duplicati o non sincronizzati.
- **Reattività**: la UI può aggiornarsi istantaneamente leggendo dallo stato, senza attendere operazioni asincrone sullo storage.
- **Manutenibilità**: il flusso dei dati è chiaro e centralizzato, facilitando debug e refactoring.

## Come interagisce con localStorage

- **All'avvio**: lo stato viene popolato leggendo i dati da `localStorage` (collections, lista delle collection, ecc.).
- **Durante l'uso**: tutte le modifiche alle collection e agli items aggiornano sia lo stato che il `localStorage`, mantenendo sincronizzati i dati persistenti e quelli in RAM.
- **Alla cancellazione**: quando si eliminano collection o items, lo stato viene ripulito e il `localStorage` aggiornato di conseguenza.

## Variabili principali dell'oggetto `state`

- `collectionList`: oggetto che tiene le chiavi delle collection e lo stato attivo (`true`/`false`).
- `collections`: oggetto che contiene tutte le collection caricate, indicizzate per chiave.
- `activeCollectionKey`: chiave della collection attualmente attiva.
- `activeCollection`: oggetto della collection attiva (con metadati e items).
- `collectionItems`: array degli items della collection attiva.
- `collectStatus`: oggetto che tiene traccia dello stato di raccolta degli items (es. `{ [itemId]: true/false }`).
- `filters`: oggetto con i filtri attivi applicati alla gallery o alle collection.
- `galleryItems`: array degli items attualmente visualizzati nella gallery.
- `collectionFormMode`, `editingCollectionKey`: variabili di stato per la gestione del form di creazione/modifica collection.

## Come funzionano le variabili

- Quando si crea, aggiorna o elimina una collection, le variabili dello stato vengono aggiornate e sincronizzate con il `localStorage`.
- Quando si aggiunge o rimuove un item, `collectionItems` e `collectStatus` vengono aggiornati per riflettere la situazione corrente.
- La UI legge sempre dallo stato per mostrare dati aggiornati e coerenti.

---
### 250914
# Nuova struttura

Organizzazione dei file per l'integrazione in un bundler tipo vite.

I file js devono essere divisi logicamente in:
- **entrypoint o file di orchestration**: tutti i file che gestiscono l'UI di una specifica pagina e orchestrano le funzioni dei moduli importati (es. index.js)
- **modules**: gestiscono funzioni e metodi di una specifica classe di oggetti, es. gallery.js, collection.js ...
- **components**: funzioni/factory per creare elementi UI riutilizzabili (es. card, toast, ecc).
- **helpers**: funzioni di utilità generiche, come chiamate API, ecc.

La struttura del file system dovrebbe essere una roba tipo:
- **/**
- **index.html**: i file html/php vanno nella cartella radice
- **src/**: cartella di sviluppo, contiene tutti i file di sviluppo
  - **index.js**: tutti gli entrypoint javascript
  - **modules/**
  - **components/**
  - **helpers/**
  - **assets/**: immagini, font ecc. che vengono importati nei file JS/CSS e processati dal bundler (ottimizzazione, hash, ecc).
  - **styles/**: usata per file CSS/SCSS che vengono importati e processati
- **public/**: usata per raccogliere file  che **NON** vengono processati dal bundler o importati nei moduli, come ad esempio favicon.ico, logo.png, manifest.json ecc. Viene usata da Vite o altri bundler per i file statici che devono essere copiati direttamente nella build finale.
  
-------------------------------------------------------------
### 230108
# 3DHOP
Marco salva i parametri scelti dall'utente nella variabile "view" e per il settaggio,la modifica o l'eliminazione di una view utilizza le funzioni:
1. addView
2. updateView
3. gotoVIew
4. deleteView

e utilizza i seguenti oggetti Json per gestire i valori:
1. OBJECT_ANNOTATION
2. VIEW_STATE

per catturare la posizione del modello e passarla alla variabile di OBJECT_ANNOTATION, utilizza la posizione della trackBall:
OBJECT_ANNOTATION.views[viewID].view = track2view(presenter.getTrackballPosition());

mentre il processo inverso (leggere dalla variabile e impostare la scene) utilizza:
presenter.animateToTrackballPosition(view2track(OBJECT_ANNOTATION.views[viewID].view));

ATTENZIONE! Sono gestiti quasi tutti i parametri, ad esempio la visibilità degli assi xyz non è gestita, nel senso che se vengono attivati per una view poi restano visibili


https://visual.ariadne-infrastructure.eu/
