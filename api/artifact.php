<?php
require 'vendor/autoload.php';
use \Adc\Artifact;
$obj = new Artifact();
$funzione = $_POST['trigger'];
unset($_POST['trigger']);
if(isset($funzione) && function_exists($funzione)) {
  $trigger = $funzione($obj);
  echo $trigger;
}

function addArtifact($obj){ return json_encode($obj->addArtifact($_POST)); }
?>