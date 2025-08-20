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
  <?php require("assets/header.php"); ?>
  <main class="animated mainSection" id="mapWrap">
    <div id="loadingDiv"><p>...loading</p></div>
    <div id="map" class="mainSection">
      <div id="mapGalleryWrap" class="card">
        <h5 class="card-title" id="mapGalleryTitle"><span id="titleText">title</span> <button class="btn-close float-end" id="closeGallery"></button></h5>
        
        <div id="mapGalleryContent">
        <?php 
          for ($i = 1; $i <= 100; $i++) {
            echo "<div class='mapGalleryItem' id='mapGalleryItem$i'>Item $i</div>";
          }
        ?>

        </div>
      </div>
      <div id="layerSwitcher" class="card">
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
  <script src="js/map.js" charset="utf-8"></script>
</body>
</html>