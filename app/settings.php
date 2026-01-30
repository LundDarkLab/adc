<?php
  require 'init.php';
  if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
    <link rel="stylesheet" href="css/person_add.css">
    <link rel="stylesheet" href="css/settings.css">
  </head>
  <body>
    <?php require("assets/header.php"); ?>
    <main class="<?php echo $mainClass; ?>">
      <div class="container">
        <input type="hidden" id="user" value="<?php echo $_SESSION['id']; ?>">
        <input type="hidden" id="person" value="<?php echo $_SESSION['person']; ?>">
        <div class="row mb-3">
          <h3 class="border-bottom">Manage your data profile</h3>
          <div class="form-text">* mandatory field</div>
        </div>
        <form id="pwdForm" class="mb-3">
          <div class="row">
            <h5 class="bg-light p-2 border rounded">Change password</h5>
            <div class="text-end mb-3">
              <button class="btn btn-secondary btn-sm w-auto" type="button" id="toggle-pwd">
                toggle passwords visibility <i class="mdi mdi-eye"></i>
              </button>
              <button class="btn btn-secondary btn-sm w-auto" type="button" id="genPwd">
                generate random password <i class="mdi mdi-reload"></i>
              </button>
            </div>
            <label for="current_pwd" class="col-sm-4 col-lg-3 col-form-label">* current password</label>
            <div class="col-sm-8 col-lg-9 mb-3">
              <input type="password" class="form-control form-control-sm pwd" id="current_pwd" name="current_pwd" required>
            </div>
            <label for="new_pwd" class="col-sm-4 col-lg-3 col-form-label">* new password</label>
            <div class="col-sm-8 col-lg-9 mb-3">
              <input type="password" class="form-control form-control-sm pwd" id="new_pwd" name="new_pwd" required>
              <div id="password-strength"><span></span></div> 
              <div id="pwdMsg" class="form-text"></div>
            </div>
            <label for="confirm_pwd" class="col-sm-4 col-lg-3 col-form-label">* confirm password</label>
            <div class="col-sm-8 col-lg-9 mb-3">
              <input type="password" class="form-control form-control-sm pwd" id="confirm_pwd" name="confirm_pwd" required>
            </div>
            <div class="text-end mb-3">
              <button class="btn btn-adc-dark btn-sm w-auto" type="submit" id="pwdChangeBtn">save password</button>
            </div>
          </div>
        </form> 
        
        <form id="usrMainFieldForm" class="mb-3">
          <div class="row mb-3">
            <h5 class="bg-light p-2 border rounded">Main field</h5>
            <label for="first_name" class="col-sm-2 col-form-label">* First name</label>
            <div class="col-sm-10">
              <input type="text" class="form-control form-control-sm" id="first_name" name="first_name" required>
            </div>
          </div>
          <div class="row mb-3">
            <label for="last_name" class="col-sm-2 col-form-label">* Last name</label>
            <div class="col-sm-10">
              <input type="text" class="form-control form-control-sm" id="last_name" name="last_name" required>
            </div>
          </div>
          <div class="row mb-3">
            <label for="email" class="col-sm-2 col-form-label">* Email</label>
            <div class="col-sm-10">
              <input type="email" class="form-control form-control-sm" id="email" name="email" required>
              <p class="form-text text-muted">Attention, the email is the same that you use to login, if you change it remember to use the new email at your next login</p>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col text-end">
              <button type="submit" class="btn btn-adc-dark btn-sm w-auto" id="changeUsrMainFieldBtn">Save info</button>
            </div>
          </div>
        </form>

        <form id="usrAffiliationForm" class="mb-3">
          <div class="row mb-3">
            <h5 class="bg-light p-2 border rounded">Affiliation and job position</h5>
            <label for="institution" class="col-sm-2 col-form-label">* Institution</label>
            <div class="col-sm-10">
              <select class="form-select form-select-sm" id="institution" name="institution" required>
                <option value="">-- select a value --</option>
              </select>
            </div>
          </div>
          <div class="row mb-3">
            <label for="position" class="col-sm-2 col-form-label">* Position</label>
            <div class="col-sm-10">
              <select class="form-select form-select-sm" id="position" name="position" required>
                <option value="">-- select a value --</option>
              </select>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col text-end">
              <button type="submit" class="btn btn-adc-dark btn-sm w-auto" id="changeUsrAffiliationBtn">Save info</button>
            </div>
          </div>
        </form>
      </div>
    </main>
    <?php 
      require("assets/menu.php");
      require("assets/toastDiv.html");
      require("assets/js.html"); 
    ?>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/zxcvbn/4.2.0/zxcvbn.js"></script>
    <script src="js/settings.js"></script>
  </body>
</html>
