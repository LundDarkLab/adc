<?php
require 'vendor/autoload.php';
use \Adc\Geom;

$obj = new Geom();
$funzione = $_POST['trigger'];
unset($_POST['trigger']);
if(isset($funzione) && function_exists($funzione)) {
  $trigger = $funzione($obj);
  echo $trigger;
} else {
  echo json_encode(["error" => "Function not found or not specified"]);
}

function getAvailableLevels($obj){
  return json_encode($obj->getAvailableLevels());
}

function getFindPlacePoint($obj){
  $id = $_POST['id'] ?? null;
  return json_encode($obj->getFindPlacePoint($id));
}

function getInstitutionPoint($obj){
  $id = $_POST['id'] ?? null;
  return json_encode($obj->getInstitutionPoint($id));
}

function getBoundaries($obj){
  $level = (int) $_POST['level'];
  $filter = $_POST['filter'] ?? null;
  return json_encode($obj->getBoundaries($level, $filter));
}

function administrativeBoundaries($obj){
  return json_encode($obj->administrativeBoundaries($_POST['level'], $_POST['filter'], $_POST['type']));
}

function getAdminList($obj){
  return json_encode($obj->getAdminList($_POST['payload']));
}

function reverseGeoLocation($obj){
  return json_encode($obj->reverseGeoLocation($_POST['ll']));
}
?>