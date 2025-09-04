<?php require 'init.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <?php require("assets/meta.php"); ?>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI=" crossorigin=""/>
  <link rel="stylesheet" href="js/maps/mousePosition/mousePosition.css">
  <link rel="stylesheet" href="js/maps/mapScale/mapScale.css">
  <link rel="stylesheet" href="css/map.css">
</head>
<body>
  <?php 
    require("assets/header.php"); 
    require("assets/loadingDiv.html");
  ?>
  <!-- <div id="loadingDiv">
    <p>
      <span class="dot dot1">.</span>
      <span class="dot dot2">.</span>
      <span class="dot dot3">.</span>
      Loading
    </p>
  </div> -->
  <main class="animated mainSection" id="mapWrap">
    <div id="mapGuide" class="card">
      <div class="card-body">
        <div class="card-title">
          <h3 class="border-bottom">How to read the map <button class="btn-close fs-5 float-end" id="closeGuide"></button></h3>
        </div>
        <div id="legend">
          <p>The map displays various layers of information. You can toggle these layers using the controls on the right.</p>
          <h4>Points of interest</h4>
          <p>These are precisely located objects on the map that represent significant locations or features.</p>
  
          <h5><img src="img/ico/storagePlace.png" height="30px" alt="Institution Marker"> Institutions</h5>
          <p>These are organisations or institutions that own or hold some kind of right to both the original artefacts and the 3D models. In some cases, they may also be responsible for the conservation and maintenance of these objects. If it is a museum, the original artefact may be on exhibit within its collections.</p>
          <p class="fw-bold">Click on Institution's marker to view its collection</p>
  
          <h5><img src="img/ico/findPlace.png" height="30px" alt="Find Place Marker"> Find Place</h5>
          <p>This markers represent the exact location where the original artefact was found.<br>
          Precise geolocation was possible for artefacts that came from professional archaeological excavations or from occasional finds geolocated with GPS.</p>
          <p class="fw-bold">Click on Find Place marker to view a brief description of the artifact, the card contains a direct link to the complete record.</p>
  
          <h4>Admin boundaries</h4>
          <p>Unfortunately, not all artefacts have precise geolocation. Many come from private collections, donations or occasional finds, and it has not been possible to locate them exactly.<br>
          Administrative boundaries represent the smallest portion of territory in which it is possible to geolocate an artefact. In the most fortunate cases, it is possible to trace the artefact back to the municipal area, for others to the district area, and for many the only geographical data available is the Country.</p>
          <p class="fw-bold">Click on administrative area to view all the artifacts found within its boundaries, even those with exact geolocation</p>
          <h4>Base Layer</h4>
          <p>You can choose the base layer that best suits your needs. Options include OpenStreetMap, Google Street, Satellite, and Terrain views.</p>
        </div>
  
      </div>

    </div>
    <div id="map" class="mainSection">
      <div id="mapGalleryWrap" class="card">
        <h5 class="card-title" id="mapGalleryTitle">
          <div id="mapGalleryText"></div>
          <button class="btn-close float-end" id="closeGallery"></button></h5>
        <p id="countItems"></p>
        <div id="wrapGallery" class="mapGallery"></div>
      </div>
      <div id="layerSwitcher" class="card">
        <div id="layerSwitcherToggle" class="">
          <button class="btn btn-sm btn-white m-0 w-100" data-bs-toggle="collapse" data-bs-target="#layerSwitcherContent" aria-expanded="false" aria-controls="layerSwitcherContent"><span class="float-start">Layers</span> <span class="mdi mdi-chevron-double-down float-end"></span></button>
        </div>
        <div id="layerSwitcherContent" class="collapse">
          <div id="poi" class="mb-3">
            <h5 class="card-title">Points of Interest</h5>
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="institutions" checked>
              <label class="form-check-label" for="institutions">Institutions</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="findPlace" checked>
              <label class="form-check-label" for="findPlace">Find Place</label>
            </div>
          </div>
          <div id="overlay" class="mb-3">
            <h5 class="card-title">Admin boundaries</h5>
          </div>
          <div id="baseLayer" class="mb-3">
            <h5 class="card-title">Base Layer</h5>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="baselayer" id="osm" value="osm" checked>
              <label class="form-check-label" for="osm">OpenStreetMap</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="baselayer" id="gStreets" value="gStreets">
              <label class="form-check-label" for="gStreets">Google Street</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="baselayer" id="gSat" value="gSat">
              <label class="form-check-label" for="gSat">Satellite</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="baselayer" id="gTerrain" value="gTerrain">
              <label class="form-check-label" for="gTerrain">Terrain</label>
            </div>
          </div>
          <div>
            <button class="btn btn-primary btn-sm form-control btn-adc-blue" id="mapGuideBtn">Map Guide</button>
          </div>
        </div>        
      </div>
    </div>
  </main>
  <?php
    require("assets/toastDiv.html");
    require("assets/menu.php");
    require("assets/js.html");
  ?>
  <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js" integrity="sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM=" crossorigin=""></script>
  <script src="js/maps/geo_config.js" charset="utf-8"></script>
  <script src="js/maps/mapScale/mapScale.js"></script>
  <script src="js/maps/mousePosition/mousePosition.js"></script>
  <script src="js/map.js" charset="utf-8" type="module"></script>
</body>
</html>