<?php 
require 'init.php'; 
if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
  </head>
  <body>
    <?php 
      require("assets/header.php");
      require("assets/menu.php");
      require("assets/loadingDiv.html");
    ?> 
    <main class="animated mainSection px-3">
      <form id="timeline">
        <h2 class="fw-bold text-center">Under processing</h2>
      </form>
    </main>
    <div id="toast-container" class="toast-container position-fixed top-0 start-50 translate-middle-x p-3"></div>
    <?php require("assets/deleteModal.html"); ?>
    <?php require("assets/js.html"); ?>
    <script src="js/timeline.js"></script>
  </body>
</html>
