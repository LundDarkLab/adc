<?php require 'init.php';?>

<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Artifact View</title>
    <?php require "assets/meta.php"; ?>
  </head>
  <body>
    <?php require "assets/configuration/logged.php"; ?>
    <header id="header"></header>
    <div id="sideMenu"></div>
    <div id="itemTool" class="animated mainSection">
      <fieldset class="btn-group" role="group">
      <?php if (isset($_SESSION['id'])) { ?>
        <fieldset class="btn-group" role="group">
          <button class="btn btn-light dropdown-toggle rounded-0" type="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="mdi mdi-plus-thick"></i> add</button>
          <ul class="dropdown-menu">
            <li id="addModelBtn"><a href="models.php?item=<?php echo $_GET['item']; ?>" class="dropdown-item">model</a></li>
            <li><a href="media_add.php?item=<?php echo $_GET['item']; ?>&t=image" class="dropdown-item">image</a></li>
            <li><a href="media_add.php?item=<?php echo $_GET['item']; ?>&t=document" class="dropdown-item">document</a></li>
            <li><a href="media_add.php?item=<?php echo $_GET['item']; ?>&t=reference" class="dropdown-item">reference</a></li>
            <li><a href="media_add.php?item=<?php echo $_GET['item']; ?>&t=video" class="dropdown-item">video</a></li>
            <li><a href="media_add.php?item=<?php echo $_GET['item']; ?>&t=link" class="dropdown-item">external resource</a></li>
          </ul>
        </fieldset>
        
        <fieldset class="btn-group" role="group">
          <button class="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="mdi mdi-pencil"></i> edit</button>
          <ul class="dropdown-menu">
            <li><a href="artifact_edit.php?item=<?php echo $_GET['item']; ?>" class="dropdown-item">artifact metadata</a></li>
            <li id="editModelBtn"><a href="" class="dropdown-item editModelBtn">model metadata</a></li>
          </ul>
        </fieldset>
        
        <fieldset class="btn-group" role="group">
          <button type="button" name="delete" id="delete" class="btn btn-light rounded-0"><i class="mdi mdi-delete-forever"></i> delete</button>
        </fieldset>
      <?php } ?>
        <fieldset id="artifactDoiFieldset">
            <a href="" id="doiBtn" class="btn btn-light d-none rounded-0"><i class="mdi mdi-share-variant"></i> DOI</a>
        </fieldset>
      </fieldset>
    </div>

    <main>
      <div id="mainContent">
        <div id="artifact">
          <div class="artifact-left">
            <div id="status" class="alert text-center p-1" role="alert"></div>
            <div class="accordion accordion-flush accordionArtifact" id="accordionArtifact">
              <?php require 'assets/artifact_accordion.html'; ?>
            </div>
          </div>
          <div id="geographic" class="rounded"></div>
        </div>

        <div id="model">
          <?php require 'assets/canvas.php'; ?>
        </div>

        <div id="secondaryInfo">
          <div id="media">
            <nav>
              <div class="nav nav-tabs" id="nav-tab" role="tablist">
                <button class="nav-link active" id="nav-image-tab" data-bs-toggle="tab" data-bs-target="#nav-image" type="button" role="tab" aria-controls="nav-image" aria-selected="true">Image <span class="ml-3 badge text-bg-light">0</span></button>

                <button class="nav-link" id="nav-document-tab" data-bs-toggle="tab" data-bs-target="#nav-document" type="button" role="tab" aria-controls="nav-document" aria-selected="false">Document <span class="ml-3 badge text-bg-light">0</span></button>

                <button class="nav-link" id="nav-references-tab" data-bs-toggle="tab" data-bs-target="#nav-references" type="button" role="tab" aria-controls="nav-references" aria-selected="false">References <span class="ml-3 badge text-bg-light">0</span></button>

                <button class="nav-link" id="nav-video-tab" data-bs-toggle="tab" data-bs-target="#nav-video" type="button" role="tab" aria-controls="nav-video" aria-selected="false">Video <span class="ml-3 badge text-bg-light">0</span></button>

                <button class="nav-link" id="nav-links-tab" data-bs-toggle="tab" data-bs-target="#nav-links" type="button" role="tab" aria-controls="nav-links" aria-selected="false">Links <span class="ml-3 badge text-bg-light">0</span></button>
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
              <div class="tab-pane fade" id="nav-links" role="tabpanel" aria-labelledby="nav-links-tab" tabindex="0">
                <h4 class="p-4">No link available for this artifact</h4>
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
            <!-- riga 1 -->
            <div id="fullScreenHeader" class="bg-light border-bottom">
              <button type="button" id="closeFullScreenImage" class="btn-close" aria-label="Close"></button>
            </div>
            
            <!-- riga 2 -->
            <div id="metadataTitle">
              <h4 class="px-3 py-2">Image metadata</h4>
            </div>
            
            <!-- riga 3 -->
            <div id="modalMetadataList" class="list-group list-group-flush overflow-auto">
              <div class="list-group-item">
                <p class="fw-bold mb-0">File name:</p>
                <p id="imageFileName"></p>
              </div>
              <div class="list-group-item">
                <p class="fw-bold mb-0">Description:</p>
                <p id="imageDescriptionText"></p>
              </div>
              <div class="list-group-item">
                <p class="fw-bold mb-0">External resource:</p>
                <a href="" id="imageUrlText" title="external resource" target="_blank"></a>
              </div>
              <div class="list-group-item">
                <p class="fw-bold m-0">Image licensed under:</p>
                <a href="" id="licenseLink" title="view license properties [new tab]" target="_blank"></a>
              </div>
            </div>
            
            <!-- riga 4 -->
            <div id="imgModalToolbar" class="border-top border-bottom px-3 py-2">
              <fieldset class="btn-group btn-group-sm w-100" role="group">
                <button type="button" class="btn btn-adc-blue" id="downloadImg">
                  <span class="mdi mdi-download"></span> download
                </button>
                <a href="" type="button" class="btn btn-adc-blue" id="editImg">
                  <span class="mdi mdi-image-edit"></span> edit
                </a>
                <button type="button" class="btn btn-danger" id="deleteImg">
                  <span class="mdi mdi-delete"></span> delete
                </button>
              </fieldset>
            </div>
            
            <!-- riga 5 -->
            <div id="ModalGalleryTitle">
              <h4 class="px-3 py-2 border-top">Artifact gallery</h4>
            </div>

            <!-- riga 6 -->
            <div id="otherArtifactImages" class="overflow-auto px-3"></div>
          </div>
        </div>
      </div>
    </div>

    <footer id="footer"></footer>
    <script>window.pageType = "artifact_view";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
