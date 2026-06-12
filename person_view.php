<?php require 'init.php'; ?>

<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require "assets/meta.php" ; ?>
    <title>Dynamic Collection - Person View</title>
  </head>
  <body>
    <?php require "assets/configuration/logged.php"; ?>
    <header id="header"></header>
    <div id="sideMenu"></div>

    <div id="itemTool" class="animated mainSection"></div>

    <main class="animated mainSection">
      <div class="container">
        <div class="row mb-3">
          <div class="col">
            <h2 id="titleSection" class="titleSection d-block txt-adc-dark fw-bold border-bottom">
              <span class="visually-hidden">Person Name</span>
            </h2>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <div class="card" id="personCard">
              <div class="card-header"><h6>Person info</h6></div>
              <ul class="list-group list-group-flush">
                <li class="list-group-item">
                  <span class="fw-bold">Institution: </span>
                  <span id="institution"></span>
                </li>
                <li class="list-group-item">
                  <span class="fw-bold">Position: </span>
                  <span id="position"></span>
                </li>
              </ul>
            </div>
          </div>
          <div class="col-md-6" id="usrCard"></div>
        </div>

        <div class="row mb-3">
          <div class="col">
            <div id="artifactsCard"></div>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col">
            <div id="modelsCard" ></div>
          </div>
        </div>

      </div>
    </main>
    <footer id="footer"></footer>
    <script>window.pageType = "person_view";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
