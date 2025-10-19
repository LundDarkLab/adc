<?php require 'init.php'; ?>

<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI=" crossorigin=""/>
    <link rel="stylesheet" href="js/maps/mousePosition/mousePosition.css">
    <link rel="stylesheet" href="js/maps/mapScale/mapScale.css">
    <link rel="stylesheet" href="css/artifact_view.css">
    <link rel="stylesheet" href="css/my3dhop.css">
    <link rel="stylesheet" href="css/map.css">
  </head>
  <body>
    <?php require("assets/header.php"); ?>
    <div id="itemTool" class="animated mainSection"></div>

    <main class="animated mainSection">
      <input type="hidden" id="artifactId" value="<?php echo $_GET['item']; ?>">
      <input type="hidden" id="activeUsr" value="<?php echo $_SESSION['id'] ?? 'unregistered'; ?>">
      <input type="hidden" id="role" value="<?php echo $_SESSION['role'] ?? 'unregistered'; ?>">

      <div id="mainContent">
        <div id="artifact">
          <div class="artifact-left">
            <div id="status" class="alert text-center" role="alert"></div>
            <div class="accordion accordion-flush accordionArtifact" id="accordionArtifact">
              <?php require('assets/artifact_accordion.html'); ?>
            </div>
          </div>
          <div id="geographic" class="rounded">
            <div id="layerSwitcher" class="card">
              <div id="layerSwitcherToggle" class="">
                <button class="btn btn-sm btn-white m-0 w-100" data-bs-toggle="collapse" data-bs-target="#layerSwitcherContent" aria-expanded="false" aria-controls="layerSwitcherContent"><span class="float-start">Layers</span> <span class="mdi mdi-chevron-double-down float-end"></span></button>
              </div>
              <div id="layerSwitcherContent" class="collapse">
                <p class="card-title">Base Layer</p>
                <div id="baseLayerControl" class="mb-3"></div>
              </div>        
            </div>
          </div>
        </div>

        <div id="model">
          <?php require('assets/canvas.html'); ?>
        </div>

        <div id="secondaryInfo">
          <div id="media"></div>
          <div id="stats">
            <div id="lineChart"></div>
            <div id="columnChart"></div>
          </div>
        </div>
      </div>
    </main>

    <div id="fullScreenImg"></div>
    <?php 
      require("assets/menu.php");
      require("assets/js.html"); 
    ?>
    <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js" integrity="sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM=" crossorigin=""></script>
    <script src="js/artifact.js" type="module" charset="utf-8"></script>
  </body>
</html>
