import { getTimelineSeries, getBounds } from "../api/getTimelineData.js";
import { setBounds } from "./boundsSelector.js";
import { setTimeRange } from "../services/setTimeRange.js";

export async function initTimelineSelector(state=''){
  const timelineSeries = document.getElementById('timeline');
  if (!timelineSeries) {
    console.error(`timeline element not found`);
    return;
  }

  try {
    const seriesData = await getTimelineSeries(state);
    if (!seriesData) {
      console.error('Nessun dato ricevuto per la timeline');
      return;
    }

    buildTimelineOptions(timelineSeries, seriesData);
    
    timelineSeries.addEventListener('change', async (event) => {
      const selectedValue = event.target.value;
      const selectedOption = event.target.selectedOptions[0];
      const from = selectedOption.dataset.from;
      const to = selectedOption.dataset.to;
      const startInput = document.getElementById('start');
      const endInput = document.getElementById('end');
      startInput.disabled = false;
      endInput.disabled = false;

      const lowerWrap = document.getElementById('lowerBoundsWrap');
      const upperWrap = document.getElementById('upperBoundsWrap');
      if (lowerWrap) lowerWrap.classList.add('d-none');
      if (upperWrap) upperWrap.classList.add('d-none');

      const bounds = await getBounds(selectedValue);
      await setBounds(bounds);
      setTimeRange(from, to);
    });

  } catch (error) {
    console.error('Errore durante l\'inizializzazione della timeline:', error);
  }
}

function buildTimelineOptions(el, data) {
  data.forEach(series => {
    const option = document.createElement('option');
    option.value = series.id;
    option.textContent = series.timeline;
    option.dataset.from = series.from;
    option.dataset.to = series.to;
    el.appendChild(option);
  });
}