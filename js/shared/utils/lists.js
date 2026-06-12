import { fetchApi } from "./fetch.js";

let vocabularyManagerInstance = null;

async function vocabularies(){
  if (!vocabularyManagerInstance) {
    const cache = new Map();
    const loading = new Map();

    async function loadVocabulary(type, payload) {
      if (!type || !payload) {
        throw new Error(`Unknown vocabulary type: ${type}`);
      }
      
      return await fetchApi({ body: payload });
    }

    async function get(type, payload) {
      // Crea una cache key che include sia type che payload
      const cacheKey = `${type}:${JSON.stringify(payload)}`;
      
      // Se è già in cache, ritorna immediatamente
      if (cache.has(cacheKey)) { return cache.get(cacheKey); }

      // Se è in caricamento, aspetta la promise esistente
      if (loading.has(cacheKey)) { return loading.get(cacheKey); }

      // Carica i dati
      const promise = loadVocabulary(type, payload);
      loading.set(cacheKey, promise);

      try {
        const data = await promise;
        cache.set(cacheKey, data);
        return data;
      } finally {
        loading.delete(cacheKey);
      }
    }

    function invalidate(type) {
      if (type) {
        // Invalida tutte le cache key che iniziano con il type
        for (const key of cache.keys()) {
          if (key.startsWith(`${type}:`)) {
            cache.delete(key);
          }
        }
      } else {
        cache.clear();
      }
    }

    // Crea l'istanza singleton
    vocabularyManagerInstance = {
      get,
      invalidate
    };
  }
  
  return vocabularyManagerInstance;
}

export async function usersList(filters={}){
  const payload = {
    class: 'User',
    action: 'usersList'
  };
  if(filters.institution){ payload.institution = filters.institution; }

  const vocab = await vocabularies();
  return vocab.get('users', payload);
}

export async function institutionsList(filters={}){
  const payload = { class: 'Institution', action: 'institutionsList' };
  if(filters.id){ payload.id = filters.id; }

  const vocab = await vocabularies();
  return vocab.get('institutions', payload);
}

export async function licensesList(filters={}){
  const payload = { class: 'Vocabulary', action: 'getLicenses' };

  const vocab = await vocabularies();
  return await vocab.get('licenses', payload);
}

export async function genericVocabulariesList(table, orderBy='value', filters={}) {
  const payload = { class: 'Vocabulary', action: 'genericVocabulariesList', table:table, order_by: orderBy, ...filters };
  const vocab = await vocabularies();
  return await vocab.get(table, payload);
}

export async function preloadForModel(filters = {}) {
  const { users = {}, institutions = {} } = filters;
  const [
    usersData, 
    institutionsData, 
    licensesData, 
    acquisitionMethodsData, 
    measureUnitsData
  ] = await Promise.all([
    usersList(users),
    institutionsList(institutions),
    genericVocabulariesList('license', 'acronym'),
    genericVocabulariesList('list_model_acquisition'),
    genericVocabulariesList('list_measure_unit', 'id')
  ]);
  
  return {
    author: usersData,
    owner: institutionsData,
    license: licensesData,
    acquisition_method: acquisitionMethodsData,
    measure_unit: measureUnitsData
  };
}