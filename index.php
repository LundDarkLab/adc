<?php
  require 'init.php';
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Dynamic Collection - Home</title>
    <?php require "assets/meta.php"; ?>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==" crossorigin="" media="screen"/>
    <link href="https://cdn.maptiler.com/maptiler-sdk-js/v1.2.0/maptiler-sdk.css" rel="preconnect" />
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

    <link rel="stylesheet" href="css/index.css">
  </head>
  <body>
    <?php
      require "assets/header.php";
      require "assets/loadingDiv.html";
      require "assets/itemtool.html";
    ?>
    <div id="statToggle" class="">
      <button type="button" class="btn btn-lg btn-dark" id="statToggleBtn">
        <span class="mdi mdi-chevron-left"></span>
      </button>
    </div>
    <div id="backToTop">
      <button class="btn btn-dark btn-lg" type="button" id="scrollToTopBtn">
        <span class="mdi mdi-chevron-up"></span>
      </button>
    </div>

    <div id="statWrap" class="bg-light border-bottom">

      <div id="itemsCount" class="">
        <div class="statSection text-center" id="institutionTot" >
          <h5 class="m-0 pt-2 fw-bold">Institutions</h5>
          <h2 class="fs-1 fw-bold"><span class="visually-hidden">Institution count: </span><span id="institutionCount"></span></h2>
        </div>
        <div class="statSection text-center" id="artifactTot" >
          <h5 class="m-0 pt-2 fw-bold">Artifacts</h5>
          <h2 class="fs-1 fw-bold"><span class="visually-hidden">Artifact count: </span><span id="artifactCount"></span></h2>
        </div>
        <div class="statSection text-center" id="modelTot" >
          <h5 class="m-0 pt-2 fw-bold">Models</h5>
          <h2 class="fs-1 fw-bold"><span class="visually-hidden">Model count: </span><span id="modelCount"></span></h2>
        </div>
        <div class="statSection text-center" id="filesTot" >
          <h5 class="m-0 pt-2 fw-bold">Media</h5>
          <h2 class="fs-1 fw-bold"><span class="visually-hidden">Media count: </span><span id="mediaCount"></span></h2>
        </div>
      </div>
      
      <div id="institution_chart" class="statSection"></div>

      <div id="mapChart" class="statSection">
        <div id="mapInfo" class="border rounded shadow">
          <h6 id="mapInfoTitle" class="m-0 text-secondary">Map info</h6>
          <div id="geomProp" class="text-center">
            <p class="mb-1 fw-bold" id="nameProp"></p>
            <p class="m-0" id="totProp"></p>
          </div>
        </div>
      </div>
      
      <div id="crono_chart" class="statSection"></div>
     
    </div>

    <main class="animated mainSection tab-content">

      <div class="tab-pane fade show active" id="gallery-pane" role="tabpanel">
        <div id="wrapGallery" class="card-wrap indexGallery"></div>
      </div>

      <div class="tab-pane fade" id="collection-pane" role="tabpanel">
        <input type="file" id="ifileJSON" accept=".json" style="display:none">
        <div id="noCollection" class="">
          <div class="col text-center txt-adc-dark mb-5">
            <h2>Your collection is empty!</h2>
          </div>
          <div id="noCollectionBody">
            <p>The dynamic collection you create resides in your browser's LocalStorage area and is not stored on the server or shared with others.</p>
            <p>To create a new collection, you can:</p>
            <ul>
              <li>click on the "collect" button on each artefact's card</li>
              <li>perform a search and add all the artefacts by clicking on the "create collection" button</li>
              <li>click on the "import collection" button and upload a JSON file previously exported</li>
              <li>click on the "new collection" button to create a new empty collection. If you choose this method, please fill the metadata collection form to export your collection correctly.</li>
            </ul>
            <p>Once you have added the artefacts, you can download the collection as a <span class="tipText" data-bs-toggle="popover" data-bs-html="true" data-bs-content="<span class='fw-bold'>JSON</span> (<span class='fw-bold'>JavaScript Object Notation</span>, pronounced /'dʒeIsən/ or /'dʒeIˌsɒn/) is an open standard file format and data interchange format that uses human-readable text to store and transmit data objects consisting of name-value pairs and arrays (or other serializable values). It is a commonly used data format with diverse uses in electronic data interchange, including that of web applications with servers. <a href='https://en.wikipedia.org/wiki/JSON' target='_blank' rel='noopener noreferrer' class='d-block'>Read more on Wikipedia <span class='mdi mdi-open-in-new'></span></a>">json file <span class="mdi mdi-help-circle-outline"></span></span>.<br>The downloaded file can be used to upload your collection from any device by clicking on the "upload your collection" button, or share it with colleagues and students as you see fit.</p>
            <button id="btImportCollection" type="button" class="btn btn-adc-blue mt-3 btImportCollection" data-bs-toggle="tooltip" title="Import collection from JSON">
              <span class="mdi mdi-upload"></span> import new collection
            </button>
            <button type="button" class="btn btn-adc-blue mt-3 btNewCollection" data-bs-toggle="tooltip" title="Create a new collection">
              <span class="mdi mdi-plus"></span> new collection
            </button>
          </div>
        </div>
        <div id="collectionContainer">
          <div id="collectionTitleWrap">
            <h2 id="collectionTitle" class="txt-adc-dark border-bottom p-3 m-0 collectionTitle"><span class="visually-hidden">Collection Title</span></h2>
            <div id="collectionBtnWrap" class="bg-light border-bottom">
              <fieldset class="btn-group">
                <legend class="visually-hidden">Collection actions</legend>
                <div class="dropdown">
                  <button type="button" class="btn btn-light rounded-0 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="mdi mdi-code-json"></span> json file
                  </button>
                  <ul class="dropdown-menu">
                    <button class="dropdown-item btImportCollection" id="btImportJson"><span class="mdi mdi-import"></span> import new collection</button>
                    <button class="dropdown-item" id="btExportActive"><span class="mdi mdi-export"></span> export active collection</button>
                    <button class="dropdown-item" id="btExportAll"><span class="mdi mdi-card-multiple-outline"></span> export all collections</button>
                  </ul>
                </div>
                
                <button type="button" class="btn btn-light btNewCollection">
                  <span class="mdi mdi-plus"></span> new
                </button>
                <button type="button" class="btn btn-light" id="btUpdateMetadata">
                  <span class="mdi mdi-information-outline"></span> metadata
                </button>
                <div class="dropdown" id="changeCollectionDropdown">
                  <button type="button" class="btn btn-light rounded-0 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="mdi mdi-swap-horizontal"></span> collections
                  </button>
                  <ul class="dropdown-menu" id="collectionListDropdown"></ul>
                </div>
                <div class="dropdown">
                  <button type="button" class="btn btn-light text-danger rounded-0 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="mdi mdi-close-octagon"></span> danger zone
                  </button>
                  <ul class="dropdown-menu">
                    <button class="dropdown-item" id="btClearCollection"><span class="mdi mdi-delete-empty"></span> clear active</button>
                    <button class="dropdown-item" id="btDeleteCollection"><span class="mdi mdi-delete-forever"></span> delete active</button>
                    <button class="dropdown-item" id="btDeleteAllCollections"><span class="mdi mdi-delete-alert"></span> delete all collections</button>
                  </ul>
                </div>
              </fieldset>
            </div>
          </div>
          <div id="collectionFormContainer">
            <form id="collectionForm" class="animated">
              <div class="row">
                <div class="mb-3 col">
                  <p class="text-muted">Please fill in all fields or edit them.The information requested is needed to uniquely identify the new collection.</p>
                </div>
              </div>
              <div class="row">
                <div class="mb-3 col-6">
                  <label for="collEmail" class="form-label">Email</label>
                  <input type="email" class="form-control form-control-sm" id="collEmail" required>
                </div>
                <div class="mb-3 col-6">
                  <label for="collAuthor" class="form-label">Author</label>
                  <input type="text" class="form-control form-control-sm" id="collAuthor" required>
                </div>
              </div>
              <div class="row">
                <div class="col mb-3">
                  <label for="collTitle" class="form-label">Title</label>
                  <input type="text" class="form-control form-control-sm" id="collTitle" required>
                </div>
              </div>
              <div class="row">
                <div class="mb-3">
                  <label for="collDesc" class="form-label">Description</label>
                  <textarea class="form-control form-control-sm" id="collDesc" rows="5" required></textarea>
                </div>
              </div>
              <div class="row">
                <div class="col">
                  <button id="btExportCollection" type="submit" class="btn btn-adc-blue" title="save collection metadata">
                    <span class="mdi mdi-download"></span> save
                  </button>
                  <button id="btCancelMetadataFormRequest" type="button" class="btn btn-adc-blue toggleMetadataForm" title="Cancel request">
                    <span class="mdi mdi-download"></span> cancel
                  </button>
                </div>
              </div>
            </form>
            <div id="noItemsInCollection" class="">
              <h2>Your collection is empty!</h2>
            </div>
          </div>
          <div id="wrapCollection" class="card-wrap"></div>
        </div>
      </div>
    </main>
    <?php
      require "assets/menu.php";
      require "assets/js.html";
    ?>
  </body>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js" integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==" crossorigin=""></script>
  <script src="https://cdn.maptiler.com/maptiler-sdk-js/v1.2.0/maptiler-sdk.umd.js"></script>
  <script src="https://cdn.maptiler.com/leaflet-maptilersdk/v2.0.0/leaflet-maptilersdk.js"></script>
  <script src="https://www.gstatic.com/charts/loader.js"></script>
  <script src="js/maps/geo_config.js?v=<?php echo filemtime('js/maps/geo_config.js'); ?>" charset="utf-8"></script>
  <script src="js/maps/geo_function.js?v=<?php echo filemtime('js/maps/geo_function.js'); ?>" charset="utf-8"></script>
  <script src="js/index.js?v=<?php echo filemtime('js/index.js'); ?>" charset="utf-8" type="module"></script>
</html>
