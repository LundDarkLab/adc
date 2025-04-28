<?php 
require 'init.php'; 
if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
    <link rel="stylesheet" href="css/vocabularies.css">
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
      <div class="card" id="sidebar">
        <div class="list-group list-group-flush" id="listTable">
            <button type="button" class="list-group-item list-group-item-secondary" >click on a row to modify the values</button>
        </div>
      </div>
      <div id="mainContent">
        <div id="listInfo" class="alert alert-info d-none">To make the change effective, press the “Save” button.<br>The “entries” column indicates the records that use that specific value. To permanently delete an entry from the list, there must be no records associated with the entry, so you must edit the records before deleting them.<br>Click the “View” button to display the list of records that are using the selected value.</div>
        <div id="newValueDiv" class="card d-none">
          <div class="card-header"><h6 class="card-title">Add new value</h6></div>
          <div class="card-body">
            <form class="row row-cols-lg-auto g-3 align-items-center"></form>
          </div>
        </div>
        <div id="listContainer">
          <div class="card table-responsive d-none" id="listValues"></div>
          <div class="card" id="viewItems"></div>
        </div>
        <div id="mainContentText" class="card">
          <div class="w-75">
            <h2 class="text-center">Select a vocabulary from the list, the values in the vocabulary will be shown here</h2>
          </div>
        </div>
        <div id="viewSpecificItems" class="card animated">
          <div class="card-header d-flex justify-content-between">
            <h5 class="d-inline"></h5>
            <button type="button" class="btn-close" aria-label="Close"></button>
          </div>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr id="listSpecificItemsThead"></tr>
              </thead>
              <tbody id="listSpecificItems"></tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
    <div id="toast-container" class="toast-container position-fixed top-0 start-50 translate-middle-x p-3"></div>
    <?php require("assets/deleteModal.html"); ?>
    <?php require("assets/js.html"); ?>
    <script src="js/vocabularies.js"></script>
  </body>
</html>