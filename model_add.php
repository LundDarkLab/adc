<?php
  require 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
    <link rel="stylesheet" href="css/3dhop.css">
    <link rel="stylesheet" href="css/model_add.css">
  </head>
  <body>
    <?php require("assets/header.php"); ?>
    <main class="<?php echo $mainClass; ?>">
      <div class="container">
        <form name="newArtifactForm" enctype="multipart/form-data" method="post">
          <input type="hidden" name="usr" value="<?php echo $_SESSION['id']; ?>">
          <fieldset>
            <legend class="border-bottom">Metadata Model</legend>
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
          </fieldset>
          <fieldset>
            <legend class="border-bottom">Define paradata</legend>
            <div class="row mb-3">
              <div class="col-md-4">
                <label for="software" class="text-danger fw-bold">Software</label>
                <input class="form-control" type="text" id="software" name="software" required>
              </div>
              <div class="col-md-4">
                <label for="acquisition_method">Acquisition method</label>
                <input class="form-control" type="text" id="acquisition_method" name="acquisition_method">
              </div>
              <div class="col-md-4">
                <label for="measure_unit">Measure unit</label>
                <select class="form-select" name="measure_unit" id="measure_unit">
                  <option value="">-- select unit --</option>
                  <option value="mm">millimeters</option>
                  <option value="cm">centimeters</option>
                  <option value="m">meters</option>
                </select>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-3">
                <label for="points">Points</label>
                <input type="number" class="form-control" min="0" step="1" name="points" id="points" value="">
              </div>
              <div class="col-md-3">
                <label for="polygons">Polygons</label>
                <input type="number" class="form-control" min="0" step="1" name="polygons" id="polygons" value="">
              </div>
              <div class="col-md-2">
                <label for="textures">Textures</label>
                <input type="number" class="form-control" min="0" step="1" name="textures" id="textures" value="">
              </div>
              <div class="col-md-2">
                <label for="scans">Scans</label>
                <input type="number" class="form-control" min="0" step="1" name="scans" id="scans" value="">
              </div>
              <div class="col-md-2">
                <label for="pictures">Pictures</label>
                <input type="number" class="form-control" min="0" step="1" name="pictures" id="pictures" value="">
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend class="border-bottom">Upload model</legend>
            <div class="row mb-3">
              <div class="col-md-4">
                <label for="nxz" class="form-label">You can upload only nxz file</label>
                <div class="input-group">
                  <input class="form-control" type="file" id="nxz" name="nxz">
                  <button class="btn btn-secondary" type="button" id="preview"><i class="mdi mdi-monitor-eye"></i>  preview</button>
                </div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col">
                <progress id="progressBar" value="0" max="100" style="width:100%;"></progress>
                <h3 id="status"></h3>
                <p id="loaded_n_total"></p>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-8">
                <div id="wrap3d">
                  <div id="3dhop" class="tdhop" onmousedown="if (event.preventDefault) event.preventDefault()">
                    <canvas id="draw-canvas" />
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div id="initParamObjectForm">
                  <h3>Model init parameters</h3>
                  <div class="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom">
                    <div>
                      <label class="mainLabel"><i class="mdi mdi-help-circle" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Switch between default and orthogonal view"></i> Ortho view</label>
                      <div class="toggleSwitch">
                        <input type="checkbox" name="ortho" class="toggleSwitch-checkbox" id="ortho" checked>
                        <label class="toggleSwitch-label" for="ortho">
                          <span class="toggleSwitch-inner" id="orthoLabel"></span>
                          <span class="toggleSwitch-switch"></span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label class="mainLabel" for="view">Side view</label>
                      <select class="form-select w-auto" name="view" id="view">
                        <option value="" selected>--select view--</option>
                        <option value="top">top</option>
                        <option value="bottom">bottom</option>
                        <option value="front">front</option>
                        <option value="left">left</option>
                        <option value="right">right</option>
                        <option value="back">back</option>
                      </select>
                    </div>
                  </div>
                  <div class="mb-3 pb-3 border-bottom">
                    <label class="mainLabel mb-2">Set the light</label>
                    <div class="d-flex justify-content-center align-items-center">
                      <div>
                        <canvas id="lightcontroller_canvas" width="150" height="150"></canvas>
                      </div>
                    </div>
                    <div class="text-center">
                      <input type="text" name="lightx" value="" class="lightDir form-control form-control-sm" readonly>
                      <input type="text" name="lighty" value="" class="lightDir form-control form-control-sm" readonly>
                    </div>
                  </div>
                  <div class="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom">
                    <div>
                      <label class="mainLabel">Light direction</label>
                      <div class="toggleSwitch">
                        <input type="checkbox" name="specular" class="toggleSwitch-checkbox" id="specular" checked>
                        <label class="toggleSwitch-label" for="specular">
                          <span class="toggleSwitch-inner" id="specularLabel"></span>
                          <span class="toggleSwitch-switch"></span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label class="mainLabel">Light type</label>
                      <div class="toggleSwitch">
                        <input type="checkbox" name="lighting" class="toggleSwitch-checkbox" id="lighting" checked>
                        <label class="toggleSwitch-label" for="lighting">
                          <span class="toggleSwitch-inner" id="lightingLabel"></span>
                          <span class="toggleSwitch-switch"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom">
                    <div>
                      <label class="mainLabel">Texture type</label>
                      <div class="toggleSwitch">
                        <input type="checkbox" name="texture" class="toggleSwitch-checkbox" id="texture">
                        <label class="toggleSwitch-label" for="texture">
                          <span class="toggleSwitch-inner" id="textureLabel"></span>
                          <span class="toggleSwitch-switch"></span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label class="mainLabel">Solid type</label>
                      <div class="toggleSwitch">
                        <input type="checkbox" name="solid" class="toggleSwitch-checkbox" id="solid">
                        <label class="toggleSwitch-label" for="solid">
                          <span class="toggleSwitch-inner" id="solidLabel"></span>
                          <span class="toggleSwitch-switch"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="mb-3 d-flex justify-content-between align-items-start">
                    <div>
                      <label class="mainLabel" for="grid">Grid type</label>
                      <select class="form-select w-auto" name="grid" id="grid">
                        <option value="" selected>--select grid--</option>
                        <option value="off">off</option>
                        <option value="base">base</option>
                        <option value="box">box</option>
                        <option value="fixed">fixed</option>
                      </select>
                    </div>
                    <div>
                      <label class="mainLabel">View XYZ axes</label>
                      <div class="toggleSwitch">
                        <input type="checkbox" name="xyz_axes" class="toggleSwitch-checkbox" id="xyz_axes">
                        <label class="toggleSwitch-label" for="xyz_axes">
                          <span class="toggleSwitch-inner" id="xyz_axesLabel"></span>
                          <span class="toggleSwitch-switch"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col">
                      <label for="encumbrance">Encumbrance</label>
                      <input type="text" class="form-control" name="encumbrance" id="encumbrance" value="">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
          <button type="submit" name="newArtifact" class="btn btn-warning">save item</button>
        </form>
      </div>
    </main>
    <?php require("assets/menu.php"); ?>
    <?php require("assets/js.html"); ?>
    <script type="text/javascript" src="assets/3dhop/spidergl.js"></script>
    <script type="text/javascript" src="assets/3dhop/presenter.js"></script>
    <script type="text/javascript" src="assets/3dhop/nexus.js"></script>
    <script type="text/javascript" src="assets/3dhop/ply.js"></script>
    <script type="text/javascript" src="assets/3dhop/trackball_turntable.js"></script>
    <script type="text/javascript" src="assets/3dhop/trackball_turntable_pan.js"></script>
    <script type="text/javascript" src="assets/3dhop/trackball_pantilt.js"></script>
    <script type="text/javascript" src="assets/3dhop/trackball_sphere.js"></script>
    <script type="text/javascript" src="assets/3dhop/init.js"></script>
    <script src="js/3dhopFunctions.js" charset="utf-8"></script>
    <script src="js/model_add.js" charset="utf-8"></script>
  </body>
</html>
