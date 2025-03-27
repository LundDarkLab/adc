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
      <div class="card" id="mainContent">
        <div class="table-responsive" id="listValues"></div>
        <div id="mainContentText">
          <h2 class="text-center">Select a vocabulary from the list, the values in the vocabulary will be shown here</h2>
        </div>
      </div>
    </main>
    <div id="toast-container" class="toast-container position-fixed top-0 start-50 translate-middle-x p-3"></div>
    <?php require("assets/deleteModal.html"); ?>
    <?php require("assets/js.html"); ?>
    <script src="js/vocabularies.js"></script>
  </body>
</html>

<!-- 

-->