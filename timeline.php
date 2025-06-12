<?php 
require 'init.php'; 
if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
    <link rel="stylesheet" href="css/timeline.css">
  </head>
  <body>
    <?php 
      require("assets/header.php");
      require("assets/menu.php");
      require("assets/loadingDiv.html");
    ?> 
    <div id="itemTool" class="animated mainSection large">
      <select name="" id="listTableSelect" class="form-control w-50 mx-auto">
        <option value="" selected disabled>-- choose a table --</option>
      </select>
    </div>
    <main class="animated mainSection px-3">
      <div id="sidebar">
        <button type="button" id="newTimeLineBtn" class="btn btn-adc-blue form-control mb-3" >+ create a new tineline</button>
        <table class="table caption-top table-hover" id="timeLineTable">
          <caption class="text-center border rounded bg-light">available timeline</caption>
          <thead>
            <tr>
              <th>name</th>
              <th>state</th>
            </tr>
          </thead>
          <tbody></tbody>
          <tfoot class="table-light">
            <tr>
              <th colspan="2">Click on a row to view the details.<br>Only the author and administrator can edit the timeline.</th>
            </tr>
          </tfoot>
        </table>
      </div>
      <div id="mainContent">
        <div id="toolbar" class="border rounded p-2 mb-3">
          <div class="text-end">
            <button class="btn btn-light" type="button" data-bs-toggle="collapse" data-bs-target="#userGuide" aria-expanded="false" aria-controls="collapseExample">toggle user guide</button>
          </div>
          <div class="collapse show border-top p-3 mt-2 text-center fs-3" id="userGuide">Select a timeline from the list to view its values or to edit it.<br>Or click the “create a new timeline” button to create a new one, the system will guide you through the steps for correct creation</div>
        </div>
        <div id="dataWrap" class="hidden"></div>
      </div>
    </main>
    <div id="toast-container" class="toast-container position-fixed top-0 start-50 translate-middle-x p-3"></div>
    <?php require("assets/deleteModal.html"); ?>
    <?php require("assets/js.html"); ?>
    <script src="js/timeline.js"></script>
  </body>
</html>
