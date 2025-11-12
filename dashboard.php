<?php
  require 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI=" crossorigin=""/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
    <link rel="stylesheet" href="./js/maps/mousePosition/mousePosition.css">
    <link rel="stylesheet" href="./js/maps/mapScale/mapScale.css">
    <link rel="stylesheet" href="css/dashboard.css">
  </head>
  <body>
    <?php 
      require("assets/header.php");
    ?>
    
    <main class="mainSection">
      <input type="hidden" id="user" value="<?php echo $_SESSION['id']; ?>">
      <input type="hidden" id="role" value="<?php echo $_SESSION['role']; ?>">
      <input type="hidden" id="institution" value="<?php echo $_SESSION['institution']; ?>">
      <div id="dashboardWrap">
        <div id="issuesSection" class="dashboardSection alert">
          <h4 id="issuesTitle"></h4>
          <div id="issuesBody"></div>
        </div>
        <div id="artifactList" class="dashboardSection">
          <h3>Artifact <span id="artifactStatusCount" class="badge text-bg-dark float-end"></span></h3>
          <div id="artifactFilters" class="toolbarDiv border-bottom py-3 mb-3">
            <div class="input-group input-group-sm">
              <select class="form-select" id="artifactStatus">
                <option value="1" selected>Under processing</option>
                <option value="2">Complete</option>
              </select>
            </div>
            <div class="input-group input-group-sm">
              <select class="form-select" id="artifactByInstitution"></select>
            </div>
            <div class="input-group input-group-sm">
              <select class="form-select" id="artifactByPerson"></select>
            </div>
            <div class="input-group input-group-sm">
              <input type="text" class="form-control" placeholder="search by description" id="artifactByDescription">
              <button class="btn btn-outline-secondary" type="button" id="artifactByDescriptionSearchBtn">search</button>
              <button class="btn btn-outline-secondary d-none" type="button" id="artifactByDescriptionResetBtn">reset</button>
            </div>
          </div>
          <div id="artifactDataWrap" class="table-wrapper mainDataTable"></div>
        </div>
        <div id="modelList" class="dashboardSection">
          <h3>Model <span id="modelStatusCount" class="badge text-bg-dark float-end"></span></h3>
          <div id="modelFilters" class="toolbarDiv border-bottom p-3 mb-3">
            <div>
              <select class="form-select form-select-sm" id="modelStatus">
                <option value="1" selected>Under processing</option>
                <option value="2">Complete</option>
              </select>
            </div>
            <div>
              <select class="form-select form-select-sm" id="modelToConnect">
                <option value="" selected>all status</option>
                <option value="1">to connect</option>
                <option value="2">connected</option>
              </select>
            </div>
            <div>
              <select class="form-select form-select-sm" id="modelByInstitution"></select>
            </div>
            <div>
              <select class="form-select form-select-sm" id="modelByPerson"></select>
            </div>
            <div class="input-group input-group-sm">
              <input type="text" class="form-control" placeholder="search by description" id="modelByDescription">
              <button class="btn btn-outline-secondary" type="button" id="modelByDescriptionSearchBtn">search</button>
              <button class="btn btn-outline-secondary d-none" type="button" id="modelByDescriptionResetBtn">reset</button>
            </div>
          </div>
          <div id="modelDataWrap" class="table-wrapper mainDataTable"></div>
        </div>
        <div id="mapWrap" class="dashboardSection"></div>
        <div id="institutionList" class="dashboardSection">
          <h3>Institution <span id="institutionStatusCount" class="badge text-bg-dark float-end"></span></h3>
          <div id="institutionFilters" class="toolbarDiv border-bottom p-3 mb-3">
            <div>
              <select class="form-select form-select-sm" id="institutionCategory">
                <option value="" selected>all categories</option>
              </select>
            </div>
            <div>
              <select class="form-select form-select-sm" id="institutionProvince">
                <option value="" selected>all provinces</option>
              </select>
            </div>
            <div class="input-group input-group-sm">
              <input type="text" class="form-control" placeholder="search by name" id="institutionByName">
              <button class="btn btn-outline-secondary" type="button" id="institutionByNameSearchBtn">search</button>
              <button class="btn btn-outline-secondary d-none" type="button" id="institutionByNameResetBtn">reset</button>
            </div>
          </div>
        </div>
        <div id="personList" class="dashboardSection">
          <h3>Person <span id="personStatusCount" class="badge text-bg-dark float-end"></span></h3>
          <div id="personFilters" class="toolbarDiv border-bottom p-3 mb-3">
            <div>
              <select class="form-select form-select-sm" id="personStatus">
                <option value="1" selected>active user</option>
                <option value="2">disabled user</option>
                <option value="3">external user</option>
              </select>
            </div>
            <div>
              <select class="form-select form-select-sm" id="personByPosition"></select>
            </div>
            <div>
              <select class="form-select form-select-sm" id="personByUserClass"></select>
            </div>
            <div class="input-group input-group-sm">
              <input type="text" class="form-control" placeholder="search by name" id="personByName">
              <button class="btn btn-outline-secondary" type="button" id="personByNameSearchBtn">search</button>
              <button class="btn btn-outline-secondary d-none" type="button" id="personByNameResetBtn">reset</button>
            </div>
          </div>
        </div>
      </div>
    </main>
    <?php require("assets/menu.php"); ?>
    <?php require("assets/js.html"); ?>
    <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js" integrity="sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM=" crossorigin=""></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
    <script src="js/dashboard.js" type="module" charset="utf-8"></script>
  </body>
</html>
