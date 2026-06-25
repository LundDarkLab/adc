<?php
  require 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <title>Edit Person</title>
    <?php require "assets/meta.php"; ?>
  </head>
  <body>
    <?php require_once "assets/configuration/logged.php"; ?>
    <header id="header"></header>
    <div id="sideMenu"></div>

    <div id="main">
      <div id="titleDiv" class="mb-3">
        <h3 class="border-bottom" id="title">Edit <span id="personName"></span> profile</h3>
        <div class="form-text">* mandatory field</div>
      </div>
      <form id="personForm">
        <div id="inputContainer">
          <div id="mainField">
            <h5 class="bg-light p-2 border rounded">Main field</h5>
            <div>
              <label for="first_name" class="col-form-label">* First name</label>
              <input type="text" class="form-control form-control-sm" id="first_name" name="first_name" data-table="person" required>
            </div>

            <div>
              <label for="last_name" class="form-label">* Last name</label>
              <input type="text" class="form-control form-control-sm" id="last_name" name="last_name" data-table="person" required>
            </div>

            <div>
              <label for="email" class="form-label">* Email</label>
              <input type="email" class="form-control form-control-sm" id="email" name="email" data-table="person" required>
            </div>
          </div>

          <div id="affiliation">
            <div>
              <h5 class="bg-light p-2 border rounded">Affiliation and job position</h5>
              <label for="institution" class="form-label">* Institution</label>
              <select class="form-select form-select-sm" id="institution" name="institution" data-table="person" required>
                <option selected disabled value="">-- select a value --</option>
              </select>
            </div>

            <div>
              <label for="position" class="form-label">* Position</label>
              <select class="form-select form-select-sm" id="position" name="position" data-table="person" required>
                <option selected disabled value="">-- select a value --</option>
              </select>
            </div>
          </div>

          <div id="userField">
            <h5 class="bg-light p-2 border rounded">Account informations</h5>
            <div id="createAccountWrap">
              <div id="usrFieldAlert" class="alert alert-info">
                if you also want to create a system id account for the new profile, please click the button below and fill in the following fields
              </div>

              <input type="checkbox" class="btn-check" id="createAccount" autocomplete="off">
              <label class="btn btn-primary" id="createAccountLabel" for="createAccount">create account</label>
            </div>

            <div>
              <label for="role" class="form-label">* Role</label>
              <select class="form-select form-select-sm userInput" id="role" name="role" data-table="user" disabled>
                <option selected disabled value="">-- select a value --</option>
              </select>
            </div>

            <div>
              <label class="form-label" for="is_active">* Is active</label>
              <select class="form-select form-select-sm userInput" id="is_active" name="is_active" data-table="user" disabled>
                <option selected disabled value="">-- select a value --</option>
                <option value="1">allow login</option>
                <option value="2">disable login</option>
              </select>
            </div>

          </div>
        </div>
        <div id="submitContainer">
          <div id="outputMsg" class="text-danger"></div>
          <div>
            <button type="submit" name="person" class="btn btn-warning">save item</button>
            <a href="dashboard.php" class="btn btn-secondary">back to dashboard</a>
          </div>
        </div>
      </form>
    </div>
    <footer id="footer"></footer>
    <script>window.pageType = "person_edit";</script>
    <script src="js/main.js" type="module" charset="utf-8"></script>
  </body>
</html>
