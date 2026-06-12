<?php
require 'init.php';
if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Timeline</title>
    <?php require "assets/meta.php"; ?>
  </head>
  <body>
    <?php require "assets/configuration/logged.php"; ?>
    <header id="header"></header>
    <div id="sideMenu"></div>
    <main>
      <div id="mainContent" class="container">
        <div id="toolbar" class="border rounded p-2 mb-3 bg-light">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex gap-2 align-items-center">
              <button type="button" id="newTimeLineBtn" class="btn btn-light" >+ create a new timeline</button>
              <div class="dropdown">
                <button id="timelineAvailableOutput" class="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"></button>
                <div id="timelineAvailableContainer" class="dropdown-menu"></div>
              </div>
            </div>
            <div>
              <button class="btn btn-light" type="button" data-bs-toggle="collapse" data-bs-target="#userGuide" aria-expanded="false" aria-controls="collapseExample">toggle user guide</button>
            </div>
          </div>
          <div class="collapse show border-top p-3 mt-2 text-center fs-3" id="userGuide">Select a timeline from the list to view its values or to edit it.<br>Or click the “create a new timeline” button to create a new one, the system will guide you through the steps for correct creation</div>
        </div>
        <div id="timelineMetadata" class="rounded border p-3 mb-3 bg-light d-none"></div>
        <div id="dataWrap"></div>
      </div>
    </main>
    <footer id="footer"></footer>
    <script>window.pageType = "timeline";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
