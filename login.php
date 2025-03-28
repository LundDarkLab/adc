<?php require 'init.php'; ?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
  </head>
  <body>
    <?php require("assets/header.php"); ?>
    <?php require("assets/menu.php"); ?>
    <main class="d-flex flex-column align-items-center">
      <div id="disclaimer" class="w-50 my-5 card">
        <div class="card-body">
          Dynamic Collections is managed by Lund University to support archaeological research and credit contributors.<br>
          We collect your name, email, and contributions to:
          <ul>
            <li>Provide access</li>
            <li>Acknowledge your work</li>
            <li>Meet academic obligations</li>
          </ul>        
          Your data is stored securely and not shared, unless required by law.<br>
          You can update or delete your account. If deleted, your contributions remain public but attributed to your institution.<br>
          Contact: <a href="mailto:nicolo.dellunto@ark.lu.se" data-bs-toggle="tooltip" title="click to open your mail client">nicolo.dellunto@ark.lu.se</a><br>
          Full details under <a href="policy.php" title="platform policy" data-bs-toggle="tooltip">Legal</a> and the <a href="https://www.lunduniversity.lu.se/about-university/contact-us/privacy-policy" target="_blank" title="external link" data-bs-toggle="tooltip">Lund University Privacy Policy</a>.
        </div>
      </div>
      <form class="" name="login">
        <label class="form-label" for="email">Email</label>
        <input type="email" class="form-control mb-3" id="email" name="email" required>
        <label class="form-label" for="password">Password</label>
        <div class="input-group mb-3">
          <input type="password" id="password" name="password" class="form-control pwd">
          <button class="btn btn-outline-secondary" type="button" id="toggle-pwd">
            <i class="mdi mdi-eye"></i>
          </button>
        </div>
        <div class="outputMsg my-3"></div>
        <button type="submit" name="loginBtn" class="btn btn-primary" data-form="login">login</button>
        <button type="button" name="toggleRescue" class="btn btn-secondary">forgot password</button>
      </form>
      <form name="rescuePwd" id="rescuePwd" class="mt-5">
        <h6 class="bfc-txt">If you don't remember your password, enter the email you used when registering and we'll send you a new one</h6>
        <label class="form-label" for="email4Rescue">Email</label>
        <input type="email" class="form-control mb-3" id="email4Rescue" name="email4Rescue" required>
        <div class="outputMsg my-3"></div>
        <button type="submit" name="rescuePwdBtn" class="btn btn-primary" data-form="rescuePwd">send me a new password</button>
        <button type="button" name="toggleRescue" class="btn btn-secondary">cancel request</button>
      </form>
    </main>
    <?php require("assets/js.html"); ?>
    <script src="js/login.js" charset="utf-8"></script>
  </body>
</html>
