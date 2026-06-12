/**
 * ChartComponent.js — ES Module
 *
 * EXPORTS:
 *   render(config)        → Promise<ChartInstance>
 *   renderAll(configs)    → Promise<ChartInstance[]>
 *   destroy(containerId)  → void
 *
 * CONFIG SHAPE:
 * {
 *   type        : 'bar' | 'line' | 'column' | 'pie' | 'donut',  // required
 *   containerId : string,                                         // required
 *   data        : Array<Array> | Array<Object>,                   // required
 *   title       : string,                                         // optional
 *   options     : Object,                                         // optional – override Google Charts options
 *   onSelect    : (payload: SelectPayload) => void                // optional
 * }
 *
 * DATA FORMATS accettati:
 *   - ArrayTable  : [['col1','col2'], [val1,val2], ...]
 *   - ObjectArray : [{key: val, ...}, ...]
 *
 * SELECT PAYLOAD:
 * {
 *   row   : number,
 *   col   : number | null,
 *   value : any,     // getValue(row, 0) – label/chiave primaria
 *   raw   : Object   // intera riga come { [colName]: value }
 * }
 */

// ─── Stato privato del modulo ────────────────────────────────────────────────

/** @type {Map<string, { chart: object, dataTable: object, config: Object }>} */
const _registry = new Map();

let _googleChartsReady = false;
let _readyCallbacks    = [];

// ─── Bootstrap Google Charts ─────────────────────────────────────────────────

/**
 * Inizializza Google Charts una sola volta (lazy).
 * Chiamate concorrenti vengono accodate e risolte insieme al callback.
 * @returns {Promise<void>}
 */
function _ensureGoogleCharts() {
  return new Promise((resolve) => {
    if (_googleChartsReady) return resolve();

    _readyCallbacks.push(resolve);

    if (_readyCallbacks.length === 1) {
      google.charts.load('current', { packages: ['corechart'] });
      google.charts.setOnLoadCallback(() => {
        _googleChartsReady = true;
        _readyCallbacks.forEach(cb => cb());
        _readyCallbacks = [];
      });
    }
  });
}

// ─── Normalizzazione dati ─────────────────────────────────────────────────────

/**
 * Converte ObjectArray → ArrayTable.
 * [{crono:'a', tot:1}] → [['crono','tot'], ['a',1]]
 * @param {Object[]} objects
 * @returns {Array[]}
 */
function _objectArrayToArrayTable(objects) {
  const headers = Object.keys(objects[0]);
  return [
    headers,
    ...objects.map(obj =>
      headers.map(k => {
        const v = obj[k];
        return v !== null && v !== '' && !isNaN(v) ? Number(v) : v;
      })
    )
  ];
}

/**
 * Costruisce un DataTable da ArrayTable.
 * Inferisce i tipi di colonna dal primo valore e gestisce il ruolo 'style'
 * per la colonna 'color' nei column chart.
 * @param {Array[]} arrayTable
 * @param {string} chartType
 * @returns {google.visualization.DataTable}
 */
function _buildDataTable(arrayTable, chartType) {
  const [headers, ...rows] = arrayTable;
  const dt = new google.visualization.DataTable();

  headers.forEach((header, colIdx) => {
    const sample = rows[0]?.[colIdx];
    
    let gType;
    if (typeof sample === 'number') {
      gType = 'number';
    } else if (typeof sample === 'boolean') {
      gType = 'boolean';
    } else {
      gType = 'string';
    }

    // Colonna 'color' in column chart → ruolo style (barre colorate)
    const isStyleRole = header === 'color' && chartType === 'column';

    dt.addColumn(
      isStyleRole ? { type: 'string', role: 'style', label: header } : gType,
      isStyleRole ? undefined : header
    );
  });

  rows.forEach(row => dt.addRow(row));
  return dt;
}

/**
 * Entry point normalizzazione: accetta ArrayTable o ObjectArray.
 * @param {Array[]|Object[]} rawData
 * @param {string} chartType
 * @returns {google.visualization.DataTable}
 */
function _normalizeData(rawData, chartType) {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    throw new Error('ChartComponent: data deve essere un array non vuoto');
  }

  const arrayTable = Array.isArray(rawData[0])
    ? rawData
    : _objectArrayToArrayTable(rawData);

  return _buildDataTable(arrayTable, chartType);
}

// ─── Opzioni di default per tipo ─────────────────────────────────────────────

/**
 * Opzioni base per tipo di chart, mergeate con gli override del chiamante.
 * @param {string} type
 * @param {string} [title]
 * @returns {Object}
 */
function _defaultOptions(type, title) {
  const base = { title: title || '', width: '100%' };

  const byType = {
    bar: {
      chartArea: { width: '70%', height: '80%', top: 60, left: 100, right: 20, bottom: 60 },
      legend: { position: 'top' },
      height: '400px',
      hAxis: { title: 'Total', titleTextStyle: { color: '#333' } },
      vAxis: { minValue: 0, textStyle: { fontSize: 12 } },
    },
    line: {
      curveType: 'function',
      legend: { position: 'bottom' },
      pointsVisible: true,
      height: '300px',
    },
    column: {
      legend: { position: 'none' },
      height: '300px',
    },
    pie: {
      chartArea: { width: '100%', height: '300px' },
      height: '300px',
    },
    donut: {
      chartArea: { width: '100%', height: '300px' },
      pieHole: 0.4,
      height: '300px',
    },
  };

  return { ...base, ...(byType[type]) };
}

// ─── Select event ─────────────────────────────────────────────────────────────

/**
 * Registra il listener 'select' e normalizza l'evento in un SelectPayload
 * indipendente dal tipo di chart.
 * @param {object} chartInstance
 * @param {google.visualization.DataTable} dataTable
 * @param {Function} onSelect
 */
function _bindSelectEvent(chartInstance, dataTable, onSelect) {
  google.visualization.events.addListener(chartInstance, 'select', () => {
    const [selectedItem] = chartInstance.getSelection();
    if (!selectedItem || selectedItem.row === null) return;

    const { row, column } = selectedItem;

    const raw = {};
    for (let c = 0; c < dataTable.getNumberOfColumns(); c++) {
      raw[dataTable.getColumnLabel(c)] = dataTable.getValue(row, c);
    }

    onSelect({
      row,
      col: column ?? null,
      value: dataTable.getValue(row, 0),
      raw,
    });
  });
}

// ─── Factory chart ────────────────────────────────────────────────────────────

/**
 * Istanzia il tipo corretto di Google Chart.
 * @param {string} type
 * @param {HTMLElement} container
 * @returns {object}
 */
function _createChartInstance(type, container) {
  const ctors = {
    bar:    google.visualization.BarChart,
    line:   google.visualization.LineChart,
    column: google.visualization.ColumnChart,
    pie:    google.visualization.PieChart,
    donut:  google.visualization.PieChart,  // donut = PieChart con pieHole
  };

  const Ctor = ctors[type];
  if (!Ctor) throw new Error(`ChartComponent: tipo '${type}' non supportato`);
  return new Ctor(container);
}

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Renderizza un singolo chart.
 * @param {Object} config
 * @returns {Promise<{ chart, dataTable, config }>}
 */
export async function render(config) {
  const { type, containerId, data, title, options: overrides = {}, onSelect } = config;

  if (!type || !containerId || !data) {
    throw new Error('ChartComponent.render: type, containerId e data sono obbligatori');
  }

  await _ensureGoogleCharts();

  const container = document.getElementById(containerId);
  if (!container) throw new Error(`ChartComponent: elemento #${containerId} non trovato`);

  const dataTable = _normalizeData(data, type);
  const options   = { ..._defaultOptions(type, title), ...overrides };
  const chart     = _createChartInstance(type, container);

  if (typeof onSelect === 'function') {
    _bindSelectEvent(chart, dataTable, onSelect);
  }

  chart.draw(dataTable, options);

  const instance = { chart, dataTable, config };
  _registry.set(containerId, instance);
  return instance;
}

/**
 * Renderizza più chart in parallelo.
 * @param {Object[]} configs
 * @returns {Promise<Array>}
 */
export async function renderAll(configs) {
  return Promise.all(configs.map(render));
}

/**
 * Distrugge un chart e lo rimuove dal registry.
 * @param {string} containerId
 */
export function destroy(containerId) {
  const instance = _registry.get(containerId);
  if (instance) {
    instance.chart.clearChart();
    _registry.delete(containerId);
  }
}

// ─── Resize listener ──────────────────────────────────────────────────────────

let _resizeTimer = null;

window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    _registry.forEach(({ chart, dataTable, config }) => {
      const { type, title, options: overrides = {} } = config;
      const options = { ..._defaultOptions(type, title), ...overrides };
      chart.draw(dataTable, options);
    });
  }, 150);
});