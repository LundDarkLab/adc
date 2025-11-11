<?php
  require 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
    <link rel="stylesheet" href="css/person.css">
  </head>
  <body>
    <?php require("assets/header.php"); ?>
    <main class="">
      <form name="personForm">
        <input type="hidden" id="personId" name="personId" value="<?php echo isset($_GET['id']) ? htmlspecialchars($_GET['id']) : ''; ?>">
        <div class="">
          <h3 class="border-bottom" id="title"></h3>
          <div class="form-text">* mandatory field</div>
        </div>
        <div class="">
          <h5 class="bg-light p-2 border rounded">Main field</h5>
          <label for="first_name" class="col-form-label">* First name</label>
          <input type="text" class="form-control form-control-sm" id="first_name" name="first_name" required>
          <label for="last_name" class="form-label">* Last name</label>
          <input type="text" class="form-control form-control-sm" id="last_name" name="last_name" required>
          <label for="email" class="form-label">* Email</label>
          <input type="email" class="form-control form-control-sm" id="email" name="email" required>
        </div>
        <div class="">
          <h5 class="bg-light p-2 border rounded">Affiliation and job position</h5>
          <label for="institution" class="form-label">* Institution</label>
          <select class="form-select form-select-sm" id="institution" name="institution" required>
            <option selected value="">-- select a value --</option>
          </select>
          <label for="position" class="form-label">* Position</label>
          <select class="form-select form-select-sm" id="position" name="position" required>
            <option selected value="">-- select a value --</option>
          </select>
        </div>
        
        <div id="userField">
          <h5 class="bg-light p-2 border rounded">Account informations</h5>
          <div id="usrFieldAlert" class="alert alert-info">
            if you also want to create a system id account for the new profile, please check "yes" and fill in the following fields
          </div>

          <div>
            <p class="mb-1 fw-bold">Do you want create an account?</p>
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="createAccount">
              <label class="form-check-label" for="createAccount">yes</label>
            </div>
          </div>
          <label for="role" class="form-label">* Role</label>
          <select class="form-select form-select-sm userInput" id="role" name="role" disabled>
            <option selected disabled value="">-- select a value --</option>
          </select>
        </div>
        <div class="">
          <div class="form-check form-switch form-check-reverse text-start">
            <input class="form-check-input userInput" type="checkbox" id="is_active" name="is_active" disabled>
            <label class="form-check-label" for="is_active">* Is active</label>
            <span class="mdi mdi-information-slab-circle" data-bs-toggle="tooltip" title="Leave checked if you want to allow the user to log in.<br />Uncheck if you don't want grant login permission to user.<br />You can modify this value later"></span>
          </div>
        </div>
        <div class="">
          <div id="outputMsg" class="text-danger"></div>
        </div>
        <div>
          <button type="submit" name="person" class="btn btn-warning">save item</button>
          <button type="button" name="delPerson" class="btn btn-danger d-none">delete profile</button>
          <a href="dashboard.php" class="btn btn-secondary">back to dashboard</a>
        </div>
      </form>
    </main>
    <?php 
      require("assets/menu.php");
      // require("assets/toastDiv.html");
      require("assets/js.html"); 
    ?>
    <script src="js/modules/person.js" type="module" charset="utf-8"></script>
  </body>
</html>
