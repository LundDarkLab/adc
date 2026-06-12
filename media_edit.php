<?php
  require 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Add new media to artifact</title>
    <?php require "assets/meta.php"; ?>
  </head>
  <body>
    <?php require "assets/configuration/logged.php"; ?>
    <header id="header"></header>
    <div id="sideMenu"></div>
    <main>
      <div class="container">
        <form name="editMediaForm" id="editMediaForm" enctype="multipart/form-data">
          <input type="hidden" id="id" name="id" data-table="files" value="<?php echo $_GET['media']; ?>">
          
          <div class="row mb-3">
            <div class="col">
              <h3 class="border-bottom">Edit media</h3>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col">
              <div id="alertMedia" class="alert alert-primary alert-dismissible fade show" role="alert">
                <div id="alertContent"></div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col col-md-6" id="fileInputCol">
              <label for="path" class="form-label" id="pathLabel"><span></span> file available</label>
              <div id="newImage">
                <input type="file" name="path" id="path" data-table="files" class="form-control" accept="">
                <div id="preview" class="imgPreview mt-3"></div>
              </div>
              <div id="currentFile" class="imgPreview"></div>
            </div>

            <div class="col col-md-6" id="urlInputCol">
              <div class="d-flex">
                <i class="mdi mdi-information-slab-circle-outline me-1" data-bs-toggle="tooltip" data-bs-title="insert a valid url if you want to link an external resource instead of uploading a file, or if you want to provide additional information related to the media. The URL will be checked for availability and content type before saving." tabindex="0" style="cursor:pointer"></i>
                <label for="url" id="urlLabel" class="form-label"> <span></span> external url related to the media</label>
              </div>
              <input type="url" name="url" id="url" data-table="files" class="form-control">
              <div id="previewExternal" class="imgPreview mt-3"></div>
            </div>

          </div>

          <div class="row mb-3 d-none" id="additionalFieldsRow">
            <div class="col col-md-4">
              <p class="form-label fw-bold">* Allow download</p>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" value="" name="downloadable" id="downloadable" data-table="files" checked>
                <label class="form-check-label" for="downloadable">Can the file be downloaded?</label>
              </div>
              <div class="form-text">Check if you want to make the file downloadable, uncheck if you do not</div>
            </div>

            <div class="col col-md-4">
              <label for="license" class="form-label fw-bold">* Select a license</label>
              <select class="form-select w-auto" id="license" name="license" data-table="files" required>
                <option value="" selected disabled>--license--</option>
              </select>
            </div>
          </div>

          <div class="row mb-3" id="textInputRow">
            <div class="col">
              <label for="text" class="form-label fw-bold">* Insert a brief description</label>
              <textarea name="text" id="text" data-table="files" rows="10" class="form-control" required></textarea>
            </div>
          </div>

          <div class="row" id="actionButtonsRow">
            <div class="col">
              <button type="submit" class="btn btn-adc-dark w-auto d-inline-block me-2">save</button>
              <a href="" id="backToArtifact" class="btn btn-secondary w-auto d-inline-block">back to artifact</a>
            </div>
          </div>

        </form>
      </div>
    </main>
    <footer id="footer"></footer>
    <script>window.pageType = "media_edit";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
