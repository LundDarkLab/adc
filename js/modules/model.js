import { collectionState } from "./collectionStorage.js";
import { bsAlert } from "../components/bsComponents.js";

const stateManager = await collectionState();

export async function model(model){
  const currentState = stateManager.getState();
  const DEFAULT_VIEWER_STATE = {
    grid: 'gridBase', //'none' 'gridBase' 'gridBox' 'gridBB'
    axes: false,
    view: {
      navigation: "turntable", //turntable or sphere
      homeTrackState: [15,15,0,0,0,3.0],
      trackState: [15,15,0,0,0,3.0],
      fov: 40,
      ortho: false,
    },
    shading:{
      texture: true,
      transparent: false,
      specular: false,
    },
    light:{
      lighting: true,
      lightDir: [-0.17, 0.17], //initial lighting is top-left lighting
    },
    activeMeasurement: {}, //active measurement tool, an object whose content depends on the tool
    sections: {
      clipping: [false, false, false], //active x,y,z
      clippingDir: [1, 1, 1], //direction x,y,z
      clippingPoint: [0.5, 0.5, 0.5], //x,y,z
      clippingRender: [true, true], //render planes, render border
    },
  };
  
  const VIEWER_STATE = {}
}