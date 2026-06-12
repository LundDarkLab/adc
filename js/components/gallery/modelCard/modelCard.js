import { cutStringByWords } from "../../../helpers/utils.js";
import { bsPopovers } from "../../bsComponents.js";

const DESCRIPTION_MAX_WORDS = 20;

/**
 * Crea l'elemento per la descrizione:
 * - se corta: span semplice
 * - se lunga: ancora con popover Bootstrap
 */
function createDescriptionElement(text) {
  if (!text) {
    const span = document.createElement('span');
    span.textContent = '—';
    return span;
  }

  const wordCount = text.trim().split(/\s+/).length;

  if (wordCount <= DESCRIPTION_MAX_WORDS) {
    const span = document.createElement('span');
    span.textContent = text;
    return span;
  }

  // Descrizione lunga: tronca e aggiunge popover
  const anchor = document.createElement('a');
  anchor.className = 'd-inline-block text-black';
  anchor.style.cursor = 'pointer';
  anchor.tabIndex = 0;
  anchor.textContent = cutStringByWords(text, DESCRIPTION_MAX_WORDS);

  // Attributi Bootstrap popover
  anchor.dataset.bsToggle     = 'popover';
  anchor.dataset.bsTrigger    = 'focus';
  anchor.dataset.bsPlacement  = 'top';
  anchor.dataset.bsContent    = text;
  anchor.title = 'Full description';

  return anchor;
}

function createModelCard(model, config = {}) {
  const { fields = [], buttons = [] } = config;

  const card = document.createElement('div');
  card.className = 'card model-card';
  card.dataset.id = model.id;

  // --- HEADER: immagine ---
  const img = document.createElement('img');
  img.className = 'card-img-top';
  img.loading = 'lazy';
  img.alt = model.name ?? 'model thumbnail';
  if (model.thumbnail) {
    img.src = `/archive/thumb/${model.thumbnail}`;
  } else {
    img.classList.add('no-thumb');
  }

  img.onerror = function () {
    this.removeAttribute('src');
    this.classList.add('no-thumb');
    this.onerror = null;
  };
  card.appendChild(img);

  // --- BODY: metadati ---
  const body = document.createElement('div');
  body.className = 'card-body';

  fields.forEach(({ label, key, render }) => {
    const row = document.createElement('div');
    row.className = 'd-flex justify-content-start gap-2 mb-2 border-bottom';

    const strong = document.createElement('strong');
    strong.style.cssText = 'flex-basis:80px; flex-shrink:0;';
    strong.textContent = `${label}:`;
    row.appendChild(strong);

    let valueEl;
    if (key === 'description') {
      // logica dedicata: tronca + popover
      valueEl = createDescriptionElement(model[key]);
    } else if (render) {
      // render custom passato dalla config (casi eccezionali)
      valueEl = document.createElement('span');
      valueEl.innerHTML = render(model[key], model);
    } else {
      valueEl = document.createElement('span');
      valueEl.textContent = model[key] ?? '—';
    }

    row.appendChild(valueEl);
    body.appendChild(row);
  });

  card.appendChild(body);

  // --- FOOTER: pulsanti ---
  const footer = document.createElement('div');
  footer.className = 'card-footer d-flex gap-2';

  buttons.forEach(({ label, variant = 'btn-adc-blue', onClick, href }) => {
    const btn = href
      ? document.createElement('a')
      : document.createElement('button');

    btn.className = `btn btn-sm ${variant}`;
    btn.textContent = label;

    if (href) {
      btn.href = typeof href === 'function' ? href(model) : href;
    } else {
      btn.addEventListener('click', () => onClick(model));
    }

    footer.appendChild(btn);
  });

  card.appendChild(footer);
  return card;
}

/**
 * Popola un contenitore con le cards e inizializza i popover.
 * Centralizza il fragment + bsPopovers così nessuna pagina deve ricordarselo.
 *
 * @param {HTMLElement} container  - il div .card-wrap
 * @param {Array}       modelsList - array di model objects
 * @param {Object}      config     - config della pagina (fields + buttons)
 */
export function renderModelCards(container, modelsList, config, artifact) {
  container.innerHTML = '';

  if (!modelsList?.length) {
    container.innerHTML = `<p class="text-muted text-center w-100 pt-4">No models available.</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  modelsList.forEach(model => fragment.appendChild(createModelCard(model, config)));
  container.appendChild(fragment);

  // inizializza i popover DOPO che le card sono nel DOM
  bsPopovers('[data-bs-toggle="popover"]');
}