<?php require 'init.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <?php require("assets/meta.php"); ?>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI=" crossorigin=""/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />

  <link rel="stylesheet" href="js/maps/mousePosition/mousePosition.css">
  <link rel="stylesheet" href="js/maps/mapScale/mapScale.css">
  <link rel="stylesheet" href="css/map.css">
</head>
<body>
  <?php 
    require("assets/header.php"); 
    // require("assets/loadingDiv.html");
  ?>
  <main class="animated mainSection" id="mapWrap">
    <div id="mapGuide" class="card">
      <div class="card-body">
        <div class="card-title">
          <h3 class="border-bottom">How to read the map <button class="btn-close fs-5 float-end" id="closeGuide"></button></h3>
        </div>
        <div id="legend">
          <p>The map displays various layers of information. You can toggle these layers using the controls on the right.</p>
          <p>The number next to the level name indicates the number of artefacts present on the map for that specific level.</p>
          
          <h4>My collections</h4>
          <p>This section will show a list of all the collections you have created. Only artefacts with precise geolocation will be visible on the map. For example, if your collection has 20 artefacts, but only 5 have declared coordinates, the map will only show those 5 artefacts. Also, if you have created a collection that has no georeferenced artefacts, this list will not be shown in this section.</p>

          <h4>Finds and Institutions</h4>
          <h5>Finds</h5>
          <p>This markers represent the exact location where the original artefact was found.<br>
          Precise geolocation was possible for artefacts that came from professional archaeological excavations or from occasional finds geolocated with GPS.</p>
          <p class="fw-bold">Click on Find marker to view a brief description of the artifact, the card contains a direct link to the complete record.</p>
  
          <h5>Institutions</h5>
          <p>These are organisations or institutions that own or hold some kind of right to both the original artefacts and the 3D models. In some cases, they may also be responsible for the conservation and maintenance of these objects. If it is a museum, the original artefact may be on exhibit within its collections.</p>
          <p class="fw-bold">Click on Institution's marker to view its collection</p>
  
  
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
        <div id="mapGalleryTitle">
          <h5 class="card-title m-0 p-0" id="mapGalleryText"></h5>
          <button class="btn-close float-end" id="closeGallery"></button>
        </div>
        <p id="countItems"></p>
        <div id="wrapGallery" class="mapGallery"></div>
      </div>
      <div id="collectionDiv" class="card d-none">
        <div class="card-body p-0">
          <div class="collectionSwitchContent p-1">
            <span id="activeCollectionTitle"></span>
            <button class="btn btn-sm btn-white dropdown-toggle invisible" id="collectionListDropdownBtn" type="button" data-bs-toggle="dropdown" aria-expanded="false"></button>
            <ul class="dropdown-menu dropdown-menu-end" id="collectionListDropdown"></ul>
          </div>
        </div>
      </div>  
      <div id="layerSwitcher" class="card">
        <div id="layerSwitcherToggle" class="">
          <button class="btn btn-sm btn-white m-0 w-100" data-bs-toggle="collapse" data-bs-target="#layerSwitcherContent" aria-expanded="false" aria-controls="layerSwitcherContent"><span class="float-start">Layers</span> <span class="mdi mdi-chevron-double-down float-end"></span></button>
        </div>
        <div id="layerSwitcherContent" class="collapse">
          <p class="card-title myCollectionControl d-none">My Collections</p>
          <div id="collectionsControl" class="mb-3 myCollectionControl d-none"></div>
          <p class="card-title">Find and Institutions</p>
          <div id="poiControl" class="mb-3"></div>
          <p class="card-title">Admin boundaries</p>
          <div id="adminControl" class="mb-3"></div>
          <p class="card-title">Base Layer</p>
          <div id="baseLayerControl" class="mb-3"></div>
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
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
  <script src='https://unpkg.com/@turf/turf/turf.min.js'></script>

  <script src="js/map.js" charset="utf-8" type="module"></script>
</body>
</html>