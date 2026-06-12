import { DEFAULT_VIEWER_STATE, SCENE_CONFIG } from "./viewerConfig.js";


/**
 * Crea la scena 3DHOP con meshes, istanze e configurazione trackball.
 * @param {Array} object - Array di oggetti modello.
 * @param {string} measure_unit - Unità di misura per la scena.
 * @returns {Object} - Oggetto scena per 3DHOP.
 */
export function createViewerScene(object, measure_unit) {
  // parte dinamica: meshes e istanze dai dati runtime
  const meshes = { ...SCENE_CONFIG.staticMeshes };
  const modelInstances = {};

  object.forEach((element) => {
    const key = 'mesh_' + element.id;
    meshes[key] = { url: 'archive/models/' + element.object };
    modelInstances[key] = {
      mesh: key,
      ...SCENE_CONFIG.instanceDefaults  // spread dei default dalla config
    };
  });

  return {
    meshes,
    modelInstances,
    spots: {},
    trackball: getTrackballConfig(),
    space: {
      ...SCENE_CONFIG.space,
      cameraFOV: DEFAULT_VIEWER_STATE.fov
    },
    config: {
      ...SCENE_CONFIG.rendering
      // clippingBorderSize impostato a runtime, relativo al raggio scena (vedi 3dhop_function.js)
    }
  };
}

/**
 * Polling per sapere quando la scena è pronta.
 * @param {Presenter} presenter - L'istanza del presenter.
 * @param {Function} callback - Funzione da chiamare quando la scena è pronta.
 */
export function waitForSceneReady(presenter, callback) {
  const check = () => {
    if (presenter._isSceneReady?.()) {
      callback();
    } else {
      setTimeout(check, 50);
    }
  };
  check();
}

export function getFirstMeshKey(presenter) {
  return Object.keys(presenter._scene.modelInstances)[0];
}

export function viewFrom(presenter, direction) {
  const distance = DEFAULT_VIEWER_STATE.homeTrackState[5];
  switch(direction) {
    case "default":
      presenter.animateToTrackballPosition(DEFAULT_VIEWER_STATE.homeTrackState);
      break;
    case "front":
      presenter.animateToTrackballPosition([0, 0, 0, 0, 0, distance]);
      break;
    case "back":
      presenter.animateToTrackballPosition([180, 0, 0, 0, 0, distance]);
      break;			
    case "top":
      presenter.animateToTrackballPosition([0, 90, 0, 0, 0, distance]);
      break;
    case "bottom":
      presenter.animateToTrackballPosition([0, -90, 0, 0, 0, distance]);
      break;
    case "left":
      presenter.animateToTrackballPosition([270, 0, 0, 0, 0, distance]);
      break;
    case "right":
      presenter.animateToTrackballPosition([90, 0, 0, 0, 0, distance]);
      break;			
  }
};

/**
 * Restituisce la configurazione della trackball in base allo stato di navigazione.
 * @returns {Object} - Configurazione trackball.
 */
function getTrackballConfig() {
  if (DEFAULT_VIEWER_STATE.navigation === "turntable") {
    return {
      type: TurntablePanTrackball,
      trackOptions: {
        startPhi: DEFAULT_VIEWER_STATE.trackState[0],
        startTheta: DEFAULT_VIEWER_STATE.trackState[1],
        startPanX: DEFAULT_VIEWER_STATE.trackState[2],
        startPanY: DEFAULT_VIEWER_STATE.trackState[3],
        startPanZ: DEFAULT_VIEWER_STATE.trackState[4],
        startDistance: DEFAULT_VIEWER_STATE.trackState[5],
        minMaxPhi: [-180, 180],
        minMaxTheta: [-90, 90],
        minMaxDist: [0.1, 5]
      }
    };
  } else if (DEFAULT_VIEWER_STATE.navigation === "sphere") {
    return {
      type: SphereTrackball,
      trackOptions: {
        startMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        startPanX: 0,
        startPanY: 0,
        startPanZ: 0,
        startDistance: 2,
        minMaxDist: [0.2, 4],
      }
    };
  }
  return {};
}
