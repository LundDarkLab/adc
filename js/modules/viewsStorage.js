const VIEWS_STORAGE_KEY = 'DC_ViewsStorage';
let viewsManagerInstance = null;

/**
 * Manages viewer annotations storage in localStorage
 * Each artifact has its own annotations object with views, spots, and notes
 * Storage structure: { "artifact_123": annotationsObject, "artifact_456": annotationsObject, ... }
 */
export async function viewsStorage(){
  if (!viewsManagerInstance) {
    let state = {};
    
    function load() {
      const savedState = localStorage.getItem(VIEWS_STORAGE_KEY);
      if (savedState) {
        try {
          state = JSON.parse(savedState);
        } catch (e) {
          console.error('Error loading viewsStorage:', e);
          state = {};
        }
      } else {
        state = {};
        localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(state));
      }
    }

    function sync() {
      try {
        localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Error syncing viewsStorage to localStorage (quota exceeded?):', e);
      }
    }
    
    /**
     * Get annotations for a specific artifact
     * @param {string} artifactId - The artifact ID
     * @returns {object|null} The annotations object or null if not found
     */
    function getAnnotations(artifactId) {
      return state[artifactId] ? { ...state[artifactId] } : null;
    }
    
    /**
     * Save annotations for a specific artifact
     * @param {string} artifactId - The artifact ID
     * @param {object} annotations - The annotations object to save
     */
    function setAnnotations(artifactId, annotations) {
      if (!artifactId) {
        console.error('Cannot save annotations: artifactId is required');
        return;
      }
      state[artifactId] = annotations;
      sync();
    }
    
    /**
     * Delete annotations for a specific artifact
     * @param {string} artifactId - The artifact ID
     */
    function deleteAnnotations(artifactId) {
      if (state[artifactId]) {
        delete state[artifactId];
        sync();
      }
    }
    
    /**
     * Get all stored annotations
     * @returns {object} All annotations keyed by artifactId
     */
    function getAllAnnotations() {
      return { ...state };
    }
    
    /**
     * Clear all annotations from storage
     */
    function clearAll() {
      state = {};
      sync();
    }

    viewsManagerInstance = {
      getAnnotations,
      setAnnotations,
      deleteAnnotations,
      getAllAnnotations,
      clearAll,
      load,
      sync
    };

    load();
  }
  return viewsManagerInstance;
}
