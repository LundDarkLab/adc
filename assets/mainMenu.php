<a href="index.php" class="animated">home <i class="mdi mdi-home"></i></a>
<a href="map.php" class="animated">map <i class="mdi mdi-map"></i></a>
<a href="credits.php" class="animated">credits <i class="mdi mdi-account-group"></i></a>
<a href="policy.php" class="animated">legal <i class="mdi mdi-shield-check"></i></a>
<a href="db_model.php" class="animated">db model <i class="mdi mdi-database"></i> </a>
<?php if (!isset($_SESSION['id'])) {echo '<a href="login.php" class="animated">login</a>';} ?>