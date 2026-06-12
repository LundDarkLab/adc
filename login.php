<?php require 'init.php'; ?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
    <link rel="stylesheet" href="css/login.css">
  </head>
  <body>
    <?php require("assets/header.php"); ?>
    <?php require("assets/menu.php"); ?>
    <main>
      <div class="container my-5">
        <div class="row">
          <div class="col col-md-6">
            <div class="card border-0 mb-4" id="loginCard">
              <div class="card-body">
                <h4 class="card-title text-center mb-4">
                  <i class="mdi mdi-login"></i> Login
                </h4>
            
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
                  <button type="submit" name="loginBtn" class="btn btn-primary w-100" data-form="login">login</button>
                  <button type="button" id="toggleRescue" class="btn btn-secondary w-100 mt-2">forgot password</button>
                </form>
              </div>
            </div>

            <div class="card border-0 mb-4" id="rescuePwdCard">
              <div class="card-body">
                <h4 class="card-title text-center mb-4">
                  <i class="mdi mdi-key-variant"></i> Reset Password
                </h4>
                <form name="rescuePwd" id="rescuePwd">
                  <h6 class="text-muted mb-3">If you don't remember your password, enter the email you used when registering and we'll send you a new one</h6>
                 <label class="form-label" for="email4Rescue">Email</label>
                  <input type="email" class="form-control mb-3" id="email4Rescue" name="email4Rescue" required>
                  <div class="outputMsg my-3"></div>
                  <button type="submit" name="rescuePwdBtn" class="btn btn-primary w-100" data-form="rescuePwd">send me a new password</button>
                  <button type="button" id="toggleLogin" class="btn btn-secondary w-100 mt-2">cancel request</button>
                </form>
              </div>
            </div>
          </div>  
          <div class="col col-md-6">
            <div id="disclaimer">
              <div class="alert alert-light rounded-0" role="alert">
                <div>
                  <div>
                    <h5 class="alert-heading mb-3">
                      <i class="mdi mdi-shield-account"></i> Privacy & Data Usage Notice
                    </h5>
                    
                    <p class="mb-3">
                      <strong>Dynamic Collections</strong> is managed by Lund University to support archaeological research and credit contributors.
                    </p>
                    
                    <div class="row">
                      <div class="col-md-6">
                        <h6 class="fw-bold">We collect:</h6>
                        <ul class="list-unstyled">
                          <li><i class="mdi mdi-check text-success"></i> Name and email address</li>
                          <li><i class="mdi mdi-check text-success"></i> Your contributions</li>
                          <li><i class="mdi mdi-check text-success"></i> Usage analytics (anonymized)</li>
                        </ul>
                      </div>
                      <div class="col-md-6">
                        <h6 class="fw-bold">We use it to:</h6>
                        <ul class="list-unstyled">
                          <li><i class="mdi mdi-account-check text-primary"></i> Provide secure access</li>
                          <li><i class="mdi mdi-medal text-primary"></i> Acknowledge your work</li>
                          <li><i class="mdi mdi-school text-primary"></i> Meet academic obligations</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div class="border-top pt-3 mt-3">
                      <p class="mb-2">
                        <i class="mdi mdi-lock"></i> <strong>Your rights:</strong> 
                        You can access, update, or delete your account at any time. 
                        If deleted, contributions remain public but attributed to your institution.
                      </p>
                      <p class="mb-0">
                        <strong>Contact:</strong> 
                        <a href="mailto:nicolo.dellunto@ark.lu.se" class="alert-link" data-bs-toggle="tooltip" title="click to open your mail client">nicolo.dellunto@ark.lu.se</a> • 
                        <a href="policy.php" class="alert-link" title="platform policy" data-bs-toggle="tooltip">Platform Policy</a> • 
                        <a href="https://www.lunduniversity.lu.se/about-university/contact-us/privacy-policy" target="_blank" class="alert-link" title="external link" data-bs-toggle="tooltip">
                          Lund University Privacy Policy <i class="mdi mdi-open-in-new"></i>
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

    </main>
    <?php 
      require("assets/footer.php");
      require("assets/js.html"); 
    ?>
    <script src="js/login.js" charset="utf-8"></script>
  </body>
</html>
