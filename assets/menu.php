<div id="backdrop"></div>
<nav class="animated" id="userMenu">
  <div id="linkWrap">
    <?php if(isset($_SESSION['id'])){ ?>
      <span id="user"><?php echo $_SESSION['email']; ?></span>
      <a href='dashboard.php' class='animated' data-bs-toggle="tooltip" data-bs-placement="left" title="My dashboard. From this page you can manage your record and do many other funny things">
        <span class="mdi mdi-view-dashboard"></span>
        dashboard
      </a>
      <span class="titleSection">add resource</span>
      <a href='artifacts_add.php' class='animated' data-bs-toggle="tooltip" data-bs-placement="left" title="Artifacts gallery. From this page you can manage artifact">
        <span class="mdi mdi-axe"></span>
        artifact
      </a>
      <a href='model_add.php' class='animated' data-bs-toggle="tooltip" data-bs-placement="left" title="Models gallery. From this page you can manage model">
        <span class="mdi mdi-cube-outline"></span>
        model
      </a>
      <a href='institution_add.php' class='animated' data-bs-toggle="tooltip" data-bs-placement="left" title="research insitutions, museum, university etc.">
        <span class="mdi mdi-bank"></span>
        institution
      </a>
      <a href='person.php' class='animated'>
        <span class="mdi mdi-book-account"></span>
        person
      </a>
      <span class="titleSection">admin</span>
      <a href='#' class='animated'>
        <span class="mdi mdi-format-list-bulleted-square"></span>
        vocabulary
      </a>
      <a href='mailComposer.php' class='animated'>
        <span class="mdi mdi-email-fast"></span>
        compose email
      </a>
      <span class="titleSection">my account</span>
      <a href='settings.php' class='animated'>
        <span class="mdi mdi-cog"></span>
        settings
      </a>
      <a href='#' class='animated'>
        <span class="mdi mdi-image-multiple"></span>
        my collections
      </a>
      <a href="logout.php" class="animated">
        <span class="mdi mdi-logout-variant"></span>
        logout
      </a>
    <?php } ?>
    <span class="titleSection d-lg-none">main pages</span>
    <a href="index.php" class="animated d-lg-none">
      <span class="mdi mdi-home"></span>
      home
    </a>
    <a href="map.php" class="animated d-lg-none">
      <span class="mdi mdi-map-marker-radius"></span>
      map
    </a>
    <a href="credits.php" class="animated d-lg-none">
      <span class="mdi mdi-handshake"></span>
      credits
    </a>
    <a href="policy.php" class="animated d-lg-none">
      <span class="mdi mdi-scale-balance"></span>
      legal
    </a>
    <a href="db_model.php" class="animated d-lg-none">
      <span class="mdi mdi-database"></span>
      db model
    </a>
    <?php if (!isset($_SESSION['id'])) {?>
      <a href="login.php" class="animated d-lg-none">
        <span class="mdi mdi-login-variant"></span>
        login
      </a>
    <?php } ?>
  </div>
</nav>