<?php
  echo '<input type="hidden" id="isLogged" value="' . (isset($_SESSION['id']) ? 'true' : 'false') . '">';
  if (isset($_SESSION['id'])) {
    echo '<input type="hidden" id="userId" value="' . $_SESSION['id'] . '">';
    echo '<input type="hidden" id="userRole" value="' . $_SESSION['role'] . '">';
    echo '<input type="hidden" id="userInstitution" value="' . $_SESSION['institution'] . '">';
    echo '<input type="hidden" id="userEmail" value="' . $_SESSION['email'] . '">';
  }
?>