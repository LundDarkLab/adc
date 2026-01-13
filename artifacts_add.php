<?php
  require 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.html"); ?>
  </head>
  <body>
    <?php require("assets/configuration/logged.php"); ?>
    <header id="header"></header>
    <div id="sideMenu"></div>
    <main>
      <div class="container">
        <input type="hidden" id="usr" value="<?php echo $_SESSION['id']; ?>">
        <form name="newArtifactForm" id="newArtifactForm" enctype="multipart/form-data" method="post">
          <fieldset>
            <legend>Main data</legend>
            <div class="row mb-3">
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="inventory" class="text-danger fw-bold">Inventory number</label>
                  <input type="text" class="form-control" placeholder="name" data-table="artifact" id="inventory" value="no_inv" required>
                  <div class="form-text">Enter the inventory number of the original artifact; if not available, leave the default value. The system will create the name using the ID assigned at the time of saving and the institution's code.</div>
                </div>
                <div class="mb-3">
                  <label for="description" class="fw-bold text-danger">Description</label>
                  <textarea data-table="artifact" id="description" rows="8" class="form-control" required></textarea>
                  <div class="form-text">Provide a description of the original artefact. Do not add external material here. You may include interactive content such as embedded videos, references, or images later on the Artifact's specific page.</div>
                </div>
                <div class="mb-3">
                  <label for="notes">Main data notes</label>
                  <textarea data-table="artifact" id="notes" rows="5" class="form-control"></textarea>
                </div>
              </div>
              <div class="col-md-6">
                <div class="wrapfield mb-0">
                  <div class="align-top">
                    <label for="category_class" class="fw-bold text-danger">
                      <i class="mdi mdi mdi-information-slab-circle-outline" data-bs-toggle="tooltip" title="selecting a category class the category specifications will be filtered accordingly"></i>
                      Category class
                    </label>
                    <select class="form-select" id="category_class" data-table="artifact" required>
                      <option value="" selected disabled>-- select value --</option>
                    </select>
                  </div>
                  <div class="align-top">
                    <label for="category_specs">Category specification</label>
                    <select class="form-select" id="category_specs" data-table="artifact" value="" disabled></select>
                  </div>
                </div>
                <small class="d-block text-form text-danger d-none" id="noSpecsMessage">No specifications options available for the selected category class.</small>
                <div class="wrapfield mt-3">
                  <label for="type">Typology</label>
                  <input type="text" class="form-control" id="type" data-table="artifact" value="">
                </div>
                <div class="wrapfield">
                  <div class="material">
                    <label for="material" class="fw-bold text-danger">Material</label>
                    <select class="form-select" id="material">
                      <option value="" selected disabled>-- select value --</option>
                      <optgroup id="matClass" label="generic value"></optgroup>
                      <optgroup id="matSpecs" label="specific value"></optgroup>
                    </select>
                  </div>
                  <div class="technique">
                    <label for="technique">
                      <i class="mdi mdi mdi-information-slab-circle-outline" data-bs-toggle="tooltip" title="the field is not mandatory but it is strongly recommended to fill it in to have more complete data"></i>
                      Technique
                    </label>
                    <div class="input-group">
                      <input type="text" id="technique" class="form-control" value="">
                      <button type="button" id="confirmMaterial" class="btn btn-success" data-bs-toggle="tooltip" title="click button to add a new material/technique definition">add</button>
                    </div>
                  </div>
                </div>
                <div id="matTechArray"></div>
              </div>
            </div>
          </fieldset>
          <fieldset id="timeline-map">
            <legend>Chronological definition</legend>
            <div class="row mb-3">
              <div class="col-md-3">
                <label for="timeline" class="fw-bold text-danger">select a timeline map</label>
                <select name="timeline" id="timeline" class="form-select" data-table="artifact" required>
                  <option value="" disabled selected>-select a timeline-</option>
                </select>
                <div class="mt-3 text-secondary">Please select a timeline map from those available. Each time map will update the chronological filters of the lower and upper bounds by setting them to the specific local time span. </div>
              </div>
              <div class="col-md-5">
                <div class="mb-3">
                  <label for="lowerBoundBtn" class="d-block">Lower bound</label>
                  <button id="lowerBoundBtn" class="btn btn-outline-secondary border w-100 d-flex justify-content-between align-items-center boundsBtn" type="button" data-accordion-wrap="lowerBoundsWrap" disabled>
                    select a lower value
                    <i id="lowerBoundIcon" class="mdi mdi-menu-down"></i>
                  </button>
                  <div id="lowerBoundsWrap" class="boundsWrap d-none">
                    <div id="lowerBoundsAccordion" class="accordion accordion-flush boundsAccordionWrap"></div>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="upperBoundBtn">Upper bound</label>
                  <button id="upperBoundBtn" class="btn btn-outline-secondary border w-100 d-flex justify-content-between align-items-center boundsBtn" type="button" data-accordion-wrap="upperBoundsWrap" disabled>
                    select an upper value
                    <i id="upperBoundIcon" class="mdi mdi-menu-down"></i>
                  </button>
                  <div id="upperBoundsWrap" class="boundsWrap d-none">
                    <div id="upperBoundsAccordion" class="accordion accordion-flush boundsAccordionWrap"></div>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label for="start" class="fw-bold text-danger">From</label>
                  <input type="number" class="form-control" id="start" step="1" data-table="artifact" value="" min="" max="" disabled required>
                  <small id="validateStart" class="text-danger d-block"></small>
                </div>

                <div class="mb-3">
                  <label for="end" class="fw-bold text-danger">To</label>
                  <input type="number" class="form-control" id="end" step="1" data-table="artifact" value="" min="" max="" disabled required>
                  <small id="validateEnd" class="text-danger d-block"></small>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend>Conservation info</legend>
            <div class="row mb-3">
              <div class="col-md-3">
                <label for="storage_place" class="fw-bold text-danger">Storage place</label>
                <select class="form-select" id="storage_place" data-table="artifact" required>
                  <option value="" selected disabled>-- select a value --</option>
                </select>
              </div>
              <div class="col-md-2">
                <label for="conservation_state" class="fw-bold text-danger">Conservation state</label>
                <select class="form-select" id="conservation_state" data-table="artifact" required>
                  <option value="" selected disabled>-- select a value --</option>
                </select>
              </div>
              <div class="col-md-2">
                <label for="object_condition">Object condition</label>
                <select class="form-select" id="object_condition" data-table="artifact">
                  <option value="" selected disabled>-- select a value --</option>
                </select>
              </div>
              <div class="col-md-2">
                <label for="weight">Weight</label>
                <input type="text" class="form-control" id="weight" data-table="artifact" >
              </div>
              <div class="col-md-2">
                <label class="me-3 d-block">is museum copy</label>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" role="switch" id="is_museum_copy" data-table="artifact">
                  <label class="form-check-label" for="is_museum_copy">No</label>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend>Find site</legend>
            <div class="row mb-3">
              <div class="col-md-3">
                <div id="gid_0_container" class="mb-3">
                  <label for="gid_0" class="text-danger fw-bold">Country boundaries</label>
                  <select id="gid_0" data-table="artifact_findplace" class="form-select gadm" required>
                    <option value="" selected disabled>-- select a value --</option>
                  </select>
                </div>
                <div id="gid_1_container" class="mb-3 hide">
                  <label for="gid_1">Provinces and equivalent</label>
                  <select id="gid_1" data-table="artifact_findplace" class="form-select gadm"></select>
                </div>
                <div id="gid_2_container" class="mb-3 hide">
                  <label for="gid_2">Districts and equivalent.</label>
                  <select id="gid_2" data-table="artifact_findplace" class="form-select gadm"></select>
                </div>
                <div id="gid_3_container" class="mb-3 hide">
                  <label for="gid_3">Communes, Municipalities and equivalent</label>
                  <select id="gid_3" data-table="artifact_findplace" class="form-select gadm"></select>
                </div>
                <div id="gid_4_container" class="mb-3 hide">
                  <label for="gid_4">Sub-national administrative boundaries</label>
                  <select id="gid_4" data-table="artifact_findplace" class="form-select gadm"></select>
                  <small class="text-form">smaller than Communes and Municipalities</small>
                </div>
                <div id="gid_5_container" class="mb-3 hide">
                  <label for="gid_5">Sub-national administrative boundaries</label>
                  <select id="gid_5" data-table="artifact_findplace" class="form-select gadm"></select>
                  <small class="text-form">smaller than Communes and Municipalities, available for France</small>
                </div>
                <div class="mb-3">
                  <label for="parish">Parish</label>
                  <input data-table="artifact_findplace" type="text" id="parish" value="" class="form-control">
                </div>
                <div class="mb-3">
                  <label for="toponym">Toponym</label>
                  <input data-table="artifact_findplace" type="text" id="toponym" value="" class="form-control">
                </div>
                <div class="mb-3 wrapfield">
                  <div class="">
                    <label for="longitude">Longitude</label>
                    <input data-table="artifact_findplace" type="number" id="longitude" step="0.0001" class="form-control" value="" min="-180.0000" max="180.0000">
                  </div>
                  <div class="">
                    <label for="latitude">Latitude</label>
                    <input data-table="artifact_findplace" type="number" id="latitude" step="0.0001" class="form-control" value="" min="-90.0000" max="90.0000">
                  </div>
                </div>
                <div class="mb-3">
                  <label for="findplace_notes">Notes about position</label>
                  <textarea data-table="artifact_findplace" id="findplace_notes" rows="5" class="form-control"></textarea>
                </div>
              </div>
              <div class="col-md-9">
                <div id="map">
                  <div class="alert alert-warning" id="mapAlert">To put a marker on map you have to zoom in</div>
                  <div id="baseLayerControl" class="leaflet-bar"></div>
                </div>
                <div class="mt-2" id="resetMapValueWrap">
                  <button type="button" id="resetMapValueBtn" class="btn btn-outline-secondary"> <i class="mdi mdi-map-marker-remove-variant"></i> Reset Map Value</button>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend>Metadata</legend>
            <div class="row mb-3">
              <div class="col-md-4">
                <label for="author" class="fw-bold text-danger">Author</label>
                <select data-table="artifact" class="form-select" id="author" required></select>
              </div>
              <div class="col-md-4">
                <label for="owner" class="fw-bold text-danger">Owner</label>
                <select data-table="artifact" class="form-select" id="owner" required>
                  <option value="" selected disabled>-- select value --</option>
                </select>
              </div>
              <div class="col-md-4">
                <label for="license" class="fw-bold text-danger">License</label>
                <select data-table="artifact" class="form-select" id="license" required>
                  <option value="" selected disabled>-- select license --</option>
                </select>
              </div>
            </div>
            <button type="submit" name="newArtifact" class="btn btn-warning">save item</button>
          </fieldset>
        </form>
      </div>
    </main>
    <footer id="footer"></footer>
    <script>window.pageType = "artifact_add";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
