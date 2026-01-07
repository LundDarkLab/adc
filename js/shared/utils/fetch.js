import { ENDPOINT } from '../config/apiConfig.js';
export async function fetchApi({url = ENDPOINT, method = 'POST', headers = {}, body = null}) {
  try {
    const options = { 
      method, headers: {'Content-Type': 'application/json', ...headers, }, 
    };
    if (body) { options.body = JSON.stringify(body); }
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) { throw new Error(data.message || `Errore HTTP! stato: ${response.status}`); }
    return data;
  } catch (error) {
    console.error('Errore durante la chiamata API:', error);
    throw error;
  }
}