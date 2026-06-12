export const DEFAULT_VIEWER_STATE = {
  grid : 'gridBase',
  axes : false,
  navigation : "turntable",
  homeTrackState : [15,15,0,0,0,3],
  trackState : [15,15,0,0,0,3],
  fov : 40,
  ortho : false,
  texture : true,
  transparent : false,
  specular : false,
  lighting : true,
  lightDir : [-0.17, 0.17],
  activeMeasurement : null,
  clipping : [false, false, false],
  clippingDir : [1, 1, 1],
  clippingPoint : [0.5, 0.5, 0.5],
  clippingRender : [true, true],
};

export const VIEWER_ANNOTATIONS = {
  type: "DC_SO_ANN",
  version: "2.0",
  object: null,
  user: null,
  time: new Date().toISOString(),
  notes: {text:""},
  views: {},
  spots: {}
};

export const SCENE_CONFIG = {
  staticMeshes: {
    sphere: { url: "archive/models/sphere.ply" },
    cube:   { url: "archive/models/cube.ply" }
  },
  instanceDefaults: {
    tags: ['Group'],
    color: [0.5, 0.5, 0.5],
    backfaceColor: [0.5, 0.5, 0.5, 3],
    specularColor: [0, 0, 0, 256]
  },
  space: {
    centerMode: "scene",
    radiusMode: "scene",
    cameraNearFar: [0.01, 10],
    // cameraFOV omesso — dipende da DEFAULT_VIEWER_STATE.fov
  },
  rendering: {
    pickedpointColor: [1, 0, 1],
    measurementColor: [0.5, 1, 0.5],
    showClippingPlanes: true,
    showClippingBorder: true,
    clippingBorderColor: [0, 1, 1]
  }
};

// Spessore del bordo del piano di taglio, come frazione del raggio reale della
// scena (non più un valore assoluto legato a measure_unit, inaffidabile su
// modelli non scalati metricamente). Applicato dopo che la scena è pronta.
export const CLIPPING_BORDER_FACTOR = 0.005; // ~0.5% del raggio della scena

export const GRID_STEP = {
  mm: 10,
  m:  0.01,
  cm: 1
};

// Campi mostrati nella modale object metadata (usato in showObjectMetadata)
export const OBJECT_METADATA_FIELDS = new Set([
  'id', 'thumbnail', 'author', 'owner', 'license',
  'license_acronym', 'license_link', 'description', 'note',
  'acquisition_method', 'software', 'points', 'polygons',
  'textures', 'scans', 'pictures', 'encumbrance', 'measure_unit'
]);