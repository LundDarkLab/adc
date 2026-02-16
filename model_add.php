<?php
  require_once 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Create New Model</title>
    <?php require_once "assets/meta.php"; ?>
  </head>
  <body>
    <?php require_once "assets/configuration/logged.php"; ?>
    <header id="header"></header>
    <div id="sideMenu"></div>
    <main>
      <div class="container">
        <form name="newModelForm" enctype="multipart/form-data" method="post">
          <div id="tip" class="alert alert-light border">
            <div>
              <h5 class="fw-bold w-50 d-inline-block">Create a new model</h5>
              <button type="button" class="closeTip btn btn-sm btn-light float-end" aria-label="Close tip" data-bs-toggle="collapse" data-bs-target="#tipBody" aria-expanded="false" aria-controls="tipBody" name="closeTip"><span aria-hidden="true">✖</span> Close tip</button>
            </div>
            <div id="tipBody" class="collapse show fs-6 mt-3">A model is understood as a container that can collect multiple three-dimensional objects (for example, the various parts of the same object).<br>At this stage you will create the "container" model to which you can associate one or more digital objects from the model page you just created</div>
          </div>
          <fieldset>
            <legend>Model main data</legend>
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="name" class="text-danger fw-bold">Name</label>
                <div class="input-group mb-3">
                  <input type="text" class="form-control" placeholder="name" data-table="model" id="name" required>
                  <button class="btn btn-warning" type="button" id="checkNameBtn" name="checkNameBtn">check name</button>
                </div>
                <div id="checkNameResult"></div>
              </div>
              <div class="col-md-6">
                Fill in the "name" field with a value that help you to easily identify the model. Remember that you cannot use the same value for different models. To verify if the name already exists, you can insert the value and click the button "check name", a messagge will appears. If you don't check the value now, the system will do it for you when you save the record
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-8">
                <label for="description" class="form-label fw-bold text-danger">Description</label>
                <textarea class="form-control" name="description" id="description" data-table="model" rows="6" required></textarea>
                <div class="form-text">Describe the whole model</div>
              </div>
              <div class="col-md-4">
                <label for="note" class="form-label">Note</label>
                <textarea class="form-control" name="note" id="note" data-table="model" rows="6"></textarea>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col col-md-6">
                <div class="mb-3">
                  <label for="doi">DOI URL</label>
                  <input type="text" class="form-control" pattern="10\.5281\/zenodo\.\d+" title="invalid DOI format" placeholder="example: https://doi.org/10.5281/zenodo.11207959" data-table="model" id="doi">
                </div>
                <div>
                  <label for="citation">Citation</label>
                  <textarea class="form-control" name="citation" id="citation" data-table="model" rows="3"></textarea>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset>
            <div id="tip2" class="alert alert-light border">
              <div>
                <h5 class="fw-bold w-50 d-inline-block">Create a 3d object to associate with model</h5>
                <button type="button" name="closeTip2" class="closeTip btn btn-sm btn-light float-end" aria-label="Close tip" data-bs-toggle="collapse" data-bs-target="#tipBody2" aria-expanded="false" aria-controls="tipBody2"><span aria-hidden="true">✖</span> Close tip</button>
              </div>
              <div id="tipBody2" class="collapse show fs-6 mt-3">When you create a model you must necessarily add at least 1 3d object, below you will find the form to associate the 3d object with the model. If the model consists of multiple objects, you can add them later</div>
            </div>
            <legend>Object metadata</legend>
            <div class="row">
              <div class="col-md-4">
                <label for="author" class="fw-bold text-danger">Author</label>
                <select class="form-select" data-table="model_object" id="author" required></select>
              </div>
              <div class="col-md-4">
                <label for="owner" class="fw-bold text-danger">Owner</label>
                <select class="form-select" data-table="model_object" id="owner" required>
                  <option value="" selected disabled>-- select value --</option>
                </select>
              </div>
              <div class="col-md-4">
                <label for="license" class="fw-bold text-danger">License</label>
                <select class="form-select" data-table="model_object" id="license" required>
                  <option value="" selected disabled>-- select license --</option>
                </select>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col">
                <div class="form-text text-center">each object that makes up the model may be made by different people and belong to different institutions, and the rights holders may decide to use different licenses</div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-8">
                <label for="object_description" class="form-label fw-bold text-danger">Description</label>
                <textarea class="form-control" name="object_description" id="object_description" data-table="model_object" rows="6" required></textarea>
                <div class="form-text">Describe the specific object</div>
              </div>
              <div class="col-md-4">
                <label for="object_note" class="form-label">Note</label>
                <textarea class="form-control" name="object_note" id="object_note" data-table="model_object" rows="6"></textarea>
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend>Object paradata</legend>
            <div class="row mb-3">
              <div class="col-md-4">
                <label for="acquisition_method" class="text-danger fw-bold">Acquisition method</label>
                <select class="form-select" name="acquisition_method" id="acquisition_method" data-table="object_param" required>
                  <option value="" selected disabled>-- select value --</option>
                </select>
              </div>
              <div class="col-md-4">
                <label for="measure_unit" class="text-danger fw-bold">Measure unit</label>
                <select class="form-select" name="measure_unit" id="measure_unit" data-table="object_param" required>
                  <option value="" selected disabled>-- select unit --</option></select>
              </div>
              <div class="col-md-4">
                <label for="software">Software</label>
                <input class="form-control" type="text" id="software" name="software" data-table="object_param">
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-2">
                <label for="points">Points</label>
                <input type="number" class="form-control" min="0" step="1" name="points" id="points" value="" data-table="object_param">
              </div>
              <div class="col-md-2">
                <label for="polygons">Polygons</label>
                <input type="number" class="form-control" min="0" step="1" name="polygons" id="polygons" value="" data-table="object_param">
              </div>
              <div class="col-md-2">
                <label for="textures">Textures</label>
                <input type="number" class="form-control" min="0" step="1" name="textures" id="textures" value="" data-table="object_param">
              </div>
              <div class="col-md-2">
                <label for="scans">Scans</label>
                <input type="number" class="form-control" min="0" step="1" name="scans" id="scans" value="" data-table="object_param">
              </div>
              <div class="col-md-2">
                <label for="pictures">Pictures</label>
                <input type="number" class="form-control" min="0" step="1" name="pictures" id="pictures" value="" data-table="object_param">
              </div>
              <div class="col-md-2">
                <label for="encumbrance" data-bs-toggle="tooltip" title="you can enter a value or let the system calculate it"><span class="mdi mdi-information-outline"></span> Encumbrance</label>
                <input type="text" class="form-control" name="encumbrance" id="encumbrance" value="" data-table="object_param">
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend>Upload model</legend>
            <div class="row d-none" id="uploadNxzRow">
              <div class="col" id="nxzWrap">
                <label for="nxz" class="form-label inputLabel">select .nxz file</label>
                <input class="form-control" type="file" id="nxz" name="nxz" accept=".nxz,.nxs">
              </div>
            </div>
            <div class="row mb-3">
              <div class="col">
                <div class="alert alert-danger" role="alert" id="uploadTip">
                Before uploading you have to select the "measure unit" from the specifica field in the "Object paradata" section of the form
                </div>
                <progress id="progressBar" class="d-none" value="0" max="100" style="width:100%;"></progress>
                <h3 id="status">status</h3>
                <p id="loaded_n_total"></p>
              </div>
            </div>
            <div class="row mb-3 d-none" id="modelPreviewRow">
              <div class="col">
                <div id="wrap3d">
                  <div id="alertBg">
                    <div class="alert alert-danger text-center">
                      <h3>Waiting for the model...</h3>
                      <h6>the model will be displayed after uploading an allowed file</h6>
                    </div>
                  </div>
                  <?php require 'assets/canvas.html'; ?>
                </div>
              </div>
            </div>
            <div class="row mb-3 d-none" id="thumbWrapRow">
              <div id="thumbWrap" class="col">
                <label for="thumb" class="form-label inputLabel">Upload a thumbnail</label>
                <input class="form-control" type="file" id="thumb" name="thumb" accept="image/jpeg, image/png, image/jpg" >
                <div class="col-md-4 my-3 border rounded" id="thumbPreview"></div>
                <div id="thumbNotAllowed"></div>
              </div>
            </div>
          </fieldset>
          <fieldset>
            <div class="row">
              <div class="col">
                <button type="submit" name="newModel" class="btn btn-warning">save item</button>
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </main>
    
    <footer id="footer"></footer>
    <script>window.pageType = "model_add";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
