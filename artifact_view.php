<?php require 'init.php';?>

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
    <div id="itemTool" class="animated mainSection">
      <div class="btn-group" role="group">
      <?php if (isset($_SESSION['id'])) { ?>
            <div class="btn-group" role="group">
              <button class="btn btn-light dropdown-toggle rounded-0" type="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="mdi mdi-plus-thick"></i> add</button>
              <ul class="dropdown-menu">
                <li id="addModelBtn"><a href="models.php?item=<?php echo $_GET['item']; ?>" class="dropdown-item">model</a></li>
                <li><a href="media_add.php?item=<?php echo $_GET['item']; ?>&t=image" class="dropdown-item">image</a></li>
                <li><a href="media_add.php?item=<?php echo $_GET['item']; ?>&t=document" class="dropdown-item">document</a></li>
                <li><a href="media_add.php?item=<?php echo $_GET['item']; ?>&t=video" class="dropdown-item">video</a></li>
              </ul>
            </div>
            <div class="btn-group" role="group">
              <button class="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="mdi mdi-pencil"></i> edit</button>
              <ul class="dropdown-menu">
                <li><a href="artifact_edit.php?item=<?php echo $_GET['item']; ?>" class="dropdown-item">artifact metadata</a></li>
                <li id="editModelBtn"><a href="" class="dropdown-item">model metadata</a></li>
              </ul>
            </div>
            <button type="button" name="delete" id="delete" class="btn btn-light rounded-0" data-bs-toggle="modal" data-bs-target="#deleteModal"><i class="mdi mdi-delete-forever"></i> delete</button>
      <?php } ?>
      </div>  
    </div>

    <main class="animated mainSection">
      <input type="hidden" id="artifactId" value="<?php echo $_GET['item']; ?>">
      <input type="hidden" id="activeUsr" value="<?php echo $_SESSION['id'] ?? 'unregistered'; ?>">
      <input type="hidden" id="role" value="<?php echo $_SESSION['role'] ?? 'unregistered'; ?>">

      <div id="mainContent">
        <div id="artifact">
          <div class="artifact-left">
            <div id="status" class="alert text-center p-1" role="alert"></div>
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
          <div id="media">
            <nav>
              <div class="nav nav-tabs" id="nav-tab" role="tablist">
                <button class="nav-link active" id="nav-image-tab" data-bs-toggle="tab" data-bs-target="#nav-image" type="button" role="tab" aria-controls="nav-image" aria-selected="true">Image</button>

                <button class="nav-link" id="nav-document-tab" data-bs-toggle="tab" data-bs-target="#nav-document" type="button" role="tab" aria-controls="nav-document" aria-selected="false">Document</button>

                <button class="nav-link" id="nav-references-tab" data-bs-toggle="tab" data-bs-target="#nav-references" type="button" role="tab" aria-controls="nav-references" aria-selected="false">References</button>

                <button class="nav-link" id="nav-video-tab" data-bs-toggle="tab" data-bs-target="#nav-video" type="button" role="tab" aria-controls="nav-video" aria-selected="false">Video</button>
              </div>
            </nav>

            <div class="tab-content" id="nav-tabContent">
              <div class="tab-pane fade show active" id="nav-image" role="tabpanel" aria-labelledby="nav-image-tab" tabindex="0">
                <h4 class="p-4">No image available for this artifact</h4>
              </div>
              <div class="tab-pane fade" id="nav-document" role="tabpanel" aria-labelledby="nav-document-tab" tabindex="0">
                <h4 class="p-4">No document available for this artifact</h4>
              </div>
              <div class="tab-pane fade" id="nav-references" role="tabpanel" aria-labelledby="nav-references-tab" tabindex="0">
                <h4 class="p-4">No references available for this artifact</h4>
              </div>
              <div class="tab-pane fade" id="nav-video" role="tabpanel" aria-labelledby="nav-video-tab" tabindex="0">
                <h4 class="p-4">No video available for this artifact</h4>
              </div>
            </div>
          </div>
          <div id="stats">
            <div id="statsTitle" class="border-bottom">Statistics</div>
            <div id="statsContent">
              <div id="lineChart" class="chart-container border rounded"></div>
              <div id="columnChart" class="chart-container border rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div id="fullScreenImg">
      <div id="fullScreenContent">
        <div id="fullScreenHeader" class="bg-light">
          <h5 class="modal-title" id="fullScreenTitle"></h5>
          <button type="button" id="closeFullScreenImage" class="btn-close" aria-label="Close"></button>
        </div>
        <div id="fullScreenBody">
          <div id="fullImageContainer">
            <img src="" alt="" id="modalImg">
          </div>
          <div id="fullImageDescription" class="bg-light border-start">
            <div>
              <h4>Image description</h4>
              <p id="imageDescriptionText"></p>
            </div>
            <div id="fullScreenFooter" class="border-top">
              <div class="d-block mb-3">
                <p class="fw-bold m-0">Image licensed under:</p>
                <a href="" id="licenseLink" title="view license properties [new tab]" target="_blank"></a>
              </div>
              <button type="button" class="btn btn-sm btn-adc-blue form-control" id="downloadImg"><span class="mdi mdi-download"></span> download</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <?php 
      require("assets/menu.php");
      require("assets/js.html"); 
    ?>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js" integrity="sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM=" crossorigin=""></script>
    <script src="https://www.gstatic.com/charts/loader.js"></script>
    <script type="text/javascript" src="assets/3dhop/spidergl.js"></script>
    <script type="text/javascript" src="assets/3dhop/presenter.js"></script>
    <script type="text/javascript" src="assets/3dhop/nexus.js"></script>
    <script type="text/javascript" src="assets/3dhop/ply.js"></script>
    <script type="text/javascript" src="assets/3dhop/trackball_turntable.js"></script>
    <script type="text/javascript" src="assets/3dhop/trackball_turntable_pan.js"></script>
    <script type="text/javascript" src="assets/3dhop/trackball_sphere.js"></script>
    <script src="js/artifact.js" type="module" charset="utf-8"></script>
  </body>
</html>
