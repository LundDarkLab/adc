import { ENDPOINT } from '../config/apiConfig.js';
export async function fetchApi({url = ENDPOINT, method = 'POST', headers = {}, body = null}) {
  try {
    const options = { method, headers: { ...headers }};
    const hasClass = body instanceof FormData ? body.get('class') : body?.class;
    const hasAction = body instanceof FormData ? body.get('action') : body?.action;
    if (!hasClass || !hasAction) {
      throw new Error('Body must contain "class" and "action" parameters');
    }
    if (body instanceof FormData) {
      // Non impostare Content-Type, lo fa il browser
      options.body = body;
    } else if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) { throw new Error(data.message || `HTTP error! status: ${response.status}`); }
    return data;
  } catch (error) {
    console.error('Error during API call:', error);
    throw error;
  }
}