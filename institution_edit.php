<?php
  require 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Dynamic Collection - Institution edit page</title>
    <?php require "assets/meta.php"; ?>
  </head>
  <body>
    <?php require "assets/configuration/logged.php"; ?>
    <header id="header"></header>
    <div id="sideMenu"></div>
    <main>
      <div class="container">
        <form name="editInstitutionForm" enctype="multipart/form-data">
          <div class="row mb-3">
            <h3 class="border-bottom txt-adc-dark fw-bold">Edit Institution information</h3>
            <div class="form-text">* mandatory field</div>
          </div>
          <div class="row mb-3">
            <div class="col">
              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" value="" id="is_storage_place">
                <label class="form-check-label" for="is_storage_place">Is it an artifact storage place?</label>
              </div>
              <div id="colorPicker">
                <label for="color">Color</label>
                <div class="input-group">
                  <input type="color" name="color" id="color" class="form-control form-control-color" value=""/>
                  <button class="btn btn-outline-secondary" type="button" id="randomColor">generate</button>
                </div>
                <small id="helpId" class="text-muted">choose a color or generate it randomly, this will identify the Institution in the charts</small>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-3 mb-3">
              <label for="category">* Category</label>
              <select name="category" id="category" class="form-select" required></select>
            </div>
            <div class="col-md-6 mb-3">
              <label for="name">* Name</label>
              <input type="text" class="form-control" name="name" id="name" autocomplete="off" required>
            </div>
            <div class="col-md-3 mb-3">
              <label for="abbreviation">* Abbreviation</label>
              <input type="text" class="form-control" name="abbreviation" id="abbreviation" required>
            </div>
          </div>
          <div class="row">
            <div class="col-md-3 mb-3">
              <label for="city">* City</label>
              <input id="city" type="text" name="city" class="form-control" value="" placeholder="digit city name" data-cityid='' required>
              <div id="osmAttribution" class="form-text"><a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap, ODbL 1.0</a></div>
              <div class="list-group" id="citySuggested"></div>
            </div>
            <div class="col-md-5 mb-3">
              <label for="address">* Address</label>
              <input type="text" id="address" name="address" class="form-control" placeholder="enter street and number" autocomplete="off" required>
            </div>
            <div class="col-md-2 mb-3">
              <label for="longitude">* Longitude</label>
              <input type="text" id="longitude" class="form-control" value="" readonly required>
            </div>
            <div class="col-md-2 mb-3">
              <label for="latitude">* Latitude</label>
              <input type="text" id="latitude" class="form-control" value="" readonly required>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col" id="map-container">
              <div id="map">
                <div class="alert alert-warning" id="mapAlert">To put a marker on map you have to zoom in</div>
                <div id="resetMapDiv">
                  <button type="button" class="btn btn-sm btn-light" data-bs-toggle="tooltip" title="remove all elements from map, reset field value and restore the initial zoom extent" name="resetMap">reset map value</button>
                </div>
              </div>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-8">
              <label for="url">Institution web site</label>
              <input type="url" name="url" id="url" class="form-control" placeholder="https://">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label for="logo">upload an image to replace the current logo</label>
              <input type="file" name="logo" id="logo" class="form-control" accept="image/*">
              <div id="imgPlaceholder" class="my-3">
                <img src="" alt="" class="img-fluid" id="logoPreview">
              </div>
            </div>
          </div>
          <button type="submit" name="newInstitution" class="btn btn-warning">save item</button>
        </form>
      </div>
    </main>
    <footer id="footer"></footer>
    <script>window.pageType = "institution_edit";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
