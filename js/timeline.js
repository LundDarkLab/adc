timeline('Timeline', 'fetchUserTimeline');

async function timeline(classe, azione, dati = {}) {
  try {
    const body = { class: classe, action: azione, ...dati};
    const risultato = await fetchApi(ENDPOINT, 'POST', {}, body);
    if (risultato && risultato.data) {
      buildTimeSeries(risultato.data);
    } else {
      console.error('Dati utenti non validi:', risultato);
    }
  } catch (error) {
    console.error('Errore in utenti:', error);
    throw error;
  }
}

function buildTimeSeries(series){
  Object.keys(series).forEach(item => {console.log(series[item]);})
}

