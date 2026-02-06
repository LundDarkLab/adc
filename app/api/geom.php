<?php
require __DIR__ . '/vendor/autoload.php';
use \Adc\Geom;

$obj = new Geom();
$funzione = $_POST['trigger'];
unset($_POST['trigger']);
if(isset($funzione) && function_exists($funzione)) {
  $trigger = $funzione($obj);
  echo $trigger;
}

function administrativeBoundaries($obj){return json_encode($obj->administrativeBoundaries($_POST['level'], $_POST['filter'], $_POST['type']));}
function getAdminList($obj){return json_encode($obj->getAdminList($_POST['payload']));}
// function getSingleGeom($obj){return json_encode($obj->getSingleGeom($_POST['level'], $_POST['gid']));}
// function getGeomCollection($obj){return json_encode($obj->getGeomCollection($_POST));}
function reverseGeoLocation($obj){return json_encode($obj->reverseGeoLocation($_POST['ll']));}

?>