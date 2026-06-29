<?php
  require 'init.php';
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Dynamic Collection - Institution view page</title>
    <?php require "assets/meta.php"; ?>
  </head>
  <body>
    <?php require "assets/configuration/logged.php"; ?>
    <header id="header"></header>
    <div id="sideMenu"></div>
    <main>
      <div id="logo-banner">
        <div id="banner-title"></div>
      </div>
      <div class="container-fluid">
        <div class="row">
          <div class="col-12 col-lg-5 col-xl-4 mb-3">
            <div class="card">
              <div class="card-header">
                <h5>Institution info</h5>
              </div>
              <ul class="list-group list-group-flush">
                <li class="list-group-item">
                  <span class="label">Name:</span>
                  <span class="value"  data-field="name"></span>
                </li>
                <li class="list-group-item">
                  <span class="label">Code:</span>
                  <span class="value" data-field="abbreviation"></span>
                </li>
                <li class="list-group-item">
                  <span class="label">Category:</span>
                  <span class="value" data-field="category"></span>
                </li>
                <li class="list-group-item">
                  <span class="label">City:</span>
                  <span class="value" data-field="city"></span>
                </li>
                <li class="list-group-item">
                  <span class="label">Address:</span>
                  <span class="value" data-field="address"></span>
                </li>
                <li class="list-group-item">
                  <span class="label">Coordinates</span>
                  <span class="value" data-field="coordinates"></span>
                </li>
                <li class="list-group-item">
                  <span class="label">Website: </span>
                  <a class="value" data-field="url" href="" target="_blank" rel="noopener noreferrer">website</a>
                </li>
                <li class="list-group-item">
                  <span class="label">Artifact available:</span>
                  <span class="value" data-field="artifact_count"></span>
                </li>
              </ul>
            </div>
          </div>
          <div class="col-12 col-lg-7 col-xl-8 mb-3" id="map-container">
            <div id="map"></div>
          </div>
        </div>
      </div>
      <div class="" id="cardContainerWrap">
        <div id="cardContainer" class=""></div>
      </div>
    </main>
    <footer id="footer"></footer>
    <script>window.pageType = "institution_view";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
