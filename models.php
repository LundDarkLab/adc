<?php
  require 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Models</title>
     <?php require 'assets/meta.php'; ?>
  </head>
  <body class="page-models">
    <?php require_once "assets/configuration/logged.php"; ?>
    <input type="hidden" id="item" value="<?php echo $_GET['item']; ?>">
    <header id="header"></header>
    <div id="sideMenu"></div>
    <main>
      <div id="mainContent" class="container-fluid mt-5">
        <?php if(!isset($_GET['item'])){?>
          <div class="noItem pt-5 d-flex flex-column justify-content-center align-items-center ">
            <h2>No artifact selected</h2>
            <p>please come back to dashboard and select an artifact</p>
          </div>
        <?php }else{?>
          <div id="contentWrap" class="bg-light">
            <div id="filtersToggle">
              <button id="toggleFiltersBtn" class="btn btn-light" data-bs-toggle="tooltip" title="Toggle Filters"><i class="mdi mdi-menu-open"></i></button>
            </div>
            <div id="title" class="d-flex align-items-center justify-content-center">
              <h4>Choose a model for artifact "<span id="artifactName" class="fw-bold"></span>"</h4>
            </div>
          </div>
          <div id="galleryWrap">
            <div id="filtersWrap" class="bg-light">
              <div id="filtersContainer">
                <fieldset>
                  <a href="artifact_view.php?item=<?php echo $_GET['item']; ?>" class="btn btn-sm btn-secondary form-control mb-5">back to artifact</a>
                  <input type="text" name="nameFilter" id="nameFilter" placeholder="Filter by name" class="form-control form-control-sm mb-2">
                  <select name="authorFilter" id="authorFilter" class="form-select form-select-sm mb-2">
                    <option value="" selected>all authors</option>
                  </select>
                  <select name="institutionFilter" id="institutionFilter" class="form-select form-select-sm mb-2">
                    <option value="" selected>all institutions</option>
                  </select>
                  <input type="text" name="descriptionFilter" id="descriptionFilter" class="form-control form-control-sm mb-2" placeholder="select by description">

                  <div class="alert alert-secondary text-dark text-center p-1"><small>
                    Models filtered:
                    <span id="modelFiltered">0</span>
                    /
                    <span id="modelTotal"></span>
                  </small></div>
                </fieldset>
              </div>
            </div>
            <div id="modelsGallery">
              <div class="card-wrap"></div>
            </div>
          </div>
        <?php } ?>
      </div>
    </main>
    <footer id="footer"></footer>
    <script>window.pageType = "models";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
