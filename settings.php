<?php
  require 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Dynamic Collection - Edit personal info</title>
    <?php require "assets/meta.php"; ?>
  </head>
  <body>
    <?php require_once "assets/configuration/logged.php"; ?>
    <header id="header"></header>
    <div id="sideMenu"></div>
    <div id="main">
      <div id="titleDiv" class="container-fluid mb-3">
        <div class="row">
          <div class="col">
            <h3 class="border-bottom" id="title">Edit <span id="personName"></span> profile</h3>
            <div class="form-text">all fields are mandatory</div>
          </div>
        </div>
      </div>
      <div id="content" class="container-fluid">
        <div class="row row-cols-1 row-cols-md-3 g-4 align-items-stretch">
          <form id="mainField" class="col d-flex">
            <div class="card w-100">
              <div class="card-header"><h5>Main Info</h5></div>
              <div class="card-body">
                <div class="mb-3">
                  <label for="first_name">First Name</label>
                  <input type="text" name="first_name" id="first_name" class="form-control form-control-sm" required>
                </div>
                <div class="mb-3">
                  <label for="last_name">Last Name</label>
                  <input type="text" name="last_name" id="last_name" class="form-control form-control-sm" required>
                </div>
                <div class="mb-3">
                  <label for="email">Email</label>
                  <input type="email" name="email" id="email" class="form-control form-control-sm" required>
                </div>
              </div>
              <div class="card-footer">
                <button type="submit" class="btn btn-adc-blue">Save</button>
              </div>
            </div>
          </form>
  
          <form id="affiliationField" class="col d-flex">
            <div class="card w-100">
              <div class="card-header"><h5>Affiliation and Job Position</h5></div>
              <div class="card-body">
                <div class="mb-3">
                  <label for="institution">Institution</label>
                  <select name="institution" id="institution" class="form-select form-select-sm" required></select>
                </div>
                <div class="mb-3">
                  <label for="position">Position</label>
                  <select name="position" id="position" class="form-select form-select-sm" required></select>
                </div>
              </div>
              <div class="card-footer">
                <button type="submit" class="btn btn-adc-blue">Save</button>
              </div>
            </div>
          </form>
  
          <form id="passwordField" class="col d-flex">
            <div class="card w-100">
              <div class="card-header"><h5>Password</h5></div>
              <div class="card-body">
                <div class="mb-3">
                  <input type="checkbox" class="btn-check" id="toggle-pwd" autocomplete="off">
                  <label class="btn btn-sm btn-outline-secondary" for="toggle-pwd">toggle password visibility</label>
                  
                  <button type="button" class="btn btn-sm btn-outline-secondary" id="gen-pwd">generate password</button>
                </div>
                <div class="mb-3">
                  <label for="current_password">Current Password</label>
                  <input type="password" name="current_password" id="current_password" class="form-control form-control-sm pwd" autocomplete="current-password" required>
                </div>
                <div class="mb-3">
                  <label for="new_password">New Password</label>
                  <input type="password" name="new_password" id="new_password" class="form-control form-control-sm pwd" autocomplete="new-password" required>
                  <progress id="password-strength" class="progress mt-3 w-100" value="0" max="100" aria-label="Password strength"></progress>
                  <p id="score-text" class="fw-bold my-2"></p>
                  <ul class="list-unstyled form-text mt-2 mb-0" id="pwd-rules">
                    <li id="rule-length">At least 10 characters</li>
                    <li id="rule-upper">At least one uppercase letter</li>
                    <li id="rule-number">At least one number</li>
                    <li id="rule-special">At least one special character</li>
                  </ul>
                  <small class="form-text text-muted">Spaces are not allowed</small>
                </div>
                <div class="mb-3">
                  <label for="confirm_password">Confirm Password</label>
                  <input type="password" name="confirm_password" id="confirm_password" class="form-control form-control-sm pwd" autocomplete="new-password" required>
                  <p id="pwd-match" class="fw-bold my-2"></p>
                </div>
              </div>
              <div class="card-footer">
                <button type="submit" class="btn btn-adc-blue">Save</button>
              </div>
            </div>
          </form>

        </div>

      </div>
    </div>
    <footer id="footer"></footer>
    <script>window.pageType = "settings";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
