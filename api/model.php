<?php
require 'vendor/autoload.php';
use \Adc\Model;
$obj = new Model();
$funzione = $_POST['trigger'];
unset($_POST['trigger']);
if(isset($funzione) && function_exists($funzione)) {
  $trigger = $funzione($obj);
  echo $trigger;
}

function addModel($obj){return json_encode($obj->addModel($_POST, $_FILES));}
function buildGallery($obj){return json_encode($obj->buildGallery($_POST['sort'], $_POST['filter']));}
function getModels($obj){return json_encode($obj->getModels($_POST['search']));}
function saveModelParam($obj){return json_encode($obj->saveModelParam($_POST));}
function updateModelParam($obj){return json_encode($obj->updateModelParam($_POST));}


?>
