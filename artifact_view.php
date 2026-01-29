<?php require 'init.php';?>

<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
  </head>
  <body>
    <?php require("assets/configuration/logged.php"); ?>
    <header id="header"></header>
    <div id="sideMenu"></div>
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
            <button type="button" name="delete" id="delete" class="btn btn-light rounded-0"><i class="mdi mdi-delete-forever"></i> delete</button>
      <?php } ?>
      </div>  
    </div>

    <main>
      <div id="mainContent">
        <div id="artifact">
          <div class="artifact-left">
            <div id="status" class="alert text-center p-1" role="alert"></div>
            <div class="accordion accordion-flush accordionArtifact" id="accordionArtifact">
              <?php require('assets/artifact_accordion.html'); ?>
            </div>
          </div>
          <div id="geographic" class="rounded"></div>
        </div>

        <div id="model">
          <?php require('assets/canvas.html'); ?>
        </div>

        <div id="secondaryInfo">
          <div id="media">
            <nav>
              <div class="nav nav-tabs" id="nav-tab" role="tablist">
                <button class="nav-link active" id="nav-image-tab" data-bs-toggle="tab" data-bs-target="#nav-image" type="button" role="tab" aria-controls="nav-image" aria-selected="true">Image <span class="ml-3 badge text-bg-light">0</span></button>

                <button class="nav-link" id="nav-document-tab" data-bs-toggle="tab" data-bs-target="#nav-document" type="button" role="tab" aria-controls="nav-document" aria-selected="false">Document <span class="ml-3 badge text-bg-light">0</span></button>

                <button class="nav-link" id="nav-references-tab" data-bs-toggle="tab" data-bs-target="#nav-references" type="button" role="tab" aria-controls="nav-references" aria-selected="false">References <span class="ml-3 badge text-bg-light">0</span></button>

                <button class="nav-link" id="nav-video-tab" data-bs-toggle="tab" data-bs-target="#nav-video" type="button" role="tab" aria-controls="nav-video" aria-selected="false">Video <span class="ml-3 badge text-bg-light">0</span></button>
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
        <div id="fullScreenBody">
          <div id="fullImageContainer">
            <img src="" alt="" id="modalImg">
          </div>
          <div id="fullImageDescription" class="bg-light border-start">
            <div id="fullImageMetadata">
              <div id="fullScreenHeader" class="bg-light">
                <button type="button" id="closeFullScreenImage" class="btn-close" aria-label="Close"></button>
              </div>
              <h4 class="px-3 py-2">Image metadata</h4>
              <div class="mb-3 list-group list-group-flush">
                <div class="list-group-item">
                  <p class="fw-bold mb-0">File name:</p> 
                  <p id="imageFileName"></p>
                </div>
                <div class="list-group-item">
                  <p class="fw-bold mb-0">Description:</p>
                  <p id="imageDescriptionText"></p>
                </div>
                <div class="list-group-item">
                  <p class="fw-bold m-0">Image licensed under:</p>
                  <a href="" id="licenseLink" title="view license properties [new tab]" target="_blank"></a>
                  <button type="button" class="btn btn-sm btn-adc-blue form-control mt-3 d-none" id="downloadImg"><span class="mdi mdi-download"></span> download</button>
                </div>
              </div>
            </div>
            <div id="fullScreenFooter" class="border-top">
              <div class="p-3">
                 <h4 class="px-3 py-2">Artifact gallery</h4>
                <div id="otherArtifactImages"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer id="footer"></footer>
    <script>window.pageType = "artifact_view";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
