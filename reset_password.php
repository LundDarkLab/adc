<?php
  require 'init.php';
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Dynamic Collection - reset password</title>
    <meta name="referrer" content="no-referrer">
    <?php require "assets/meta.php"; ?>
  </head>
  <body>
    <header id="header"></header>
    <div id="sideMenu"></div>
    <main>
      <div id="tokenMessage" class=""></div>
      <div class="container my-5">
        <div class="row">
          <div class="col col-md-6" id="cardForm"></div>
          <div class="col col-md-6" id="cardGuide"></div>
        </div>
      </div>
    </main>
    <footer id="footer"></footer>
    <script>window.pageType = "reset_password";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
