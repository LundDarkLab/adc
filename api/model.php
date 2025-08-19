<?php
// echo $_POST['trigger'];
require 'vendor/autoload.php';
use \Adc\Model;
$obj = new Model();
$funzione = $_POST['trigger'];
unset($_POST['trigger']);
if(isset($funzione) && function_exists($funzione)) {
  $trigger = $funzione($obj);
  echo $trigger;
}

function buildGallery($obj){
  error_log('buildGallery function called in model.php');
  return json_encode($obj->buildGallery($_POST['sort'], $_POST['filter'] ?? [], $_POST['page'] ?? 1, $_POST['limit'] ?? 20));
}

function saveModel($obj){return json_encode($obj->saveModel($_POST, $_FILES));}
function getModel($obj){return json_encode($obj->getModel($_POST['id']));}
function getModels($obj){return json_encode($obj->getModels($_POST['search']));}
function saveModelParam($obj){return json_encode($obj->saveModelParam($_POST));}
function updateModelParam($obj){return json_encode($obj->updateModelParam($_POST));}
function connectModel($obj){return json_encode($obj->connectModel($_POST['data']));}
function updateModelMetadata($obj){return json_encode($obj->updateModelMetadata($_POST));}
function deleteModel($obj){return json_encode($obj->deleteModel($_POST['id']));}

function getObject($obj){return json_encode($obj->getObject($_POST['id']));}
function updateObjectMetadata($obj){return json_encode($obj->updateObjectMetadata($_POST));}
function changeModelStatus($obj){return json_encode($obj->changeModelStatus($_POST['dati']));}
?>
