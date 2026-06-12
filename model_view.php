<?php
  require 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Model View</title>
    <?php require 'assets/meta.php'; ?>
  </head>
  <body>
    <?php require_once "assets/configuration/logged.php"; ?>
    <input type="hidden" name="modelId" value="<?php echo $_GET['item']; ?>">
    <header id="header"></header>
    <div id="sideMenu"></div>
    <main>
      <div id="mainContent">
        <?php require 'assets/canvas.php'; ?>
      </div>
    </main>
    <footer id="footer"></footer>
    <script>window.pageType = "model_view";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
