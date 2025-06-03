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
              <th colspan="2">
                Click on a row to view the details.<br>
                Only the author and administrator can edit the timeline.
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
      <div id="mainContent">
        <div id="mainContentText" class="card">
          <h2 class="text-center">Select a timeline from the list, the values will be shown here</h2>
        </div>
        <div id="toolbar" class="hidden border-bottom bg-light"></div>
        <div id="listInfo" class="alert alert-info hidden"></div>
        <div id="dataWrap" class="hidden"></div>
      </div>
    </main>
    <div id="toast-container" class="toast-container position-fixed top-0 start-50 translate-middle-x p-3"></div>
    <?php require("assets/deleteModal.html"); ?>
    <?php require("assets/js.html"); ?>
    <script src="js/timeline.js"></script>
  </body>
</html>
