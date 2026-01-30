<?php
require __DIR__ . '/vendor/autoload.php';
use \Adc\Get;
$obj = new Get();
$funzione = $_POST['trigger'];
unset($_POST['trigger']);
if(isset($funzione) && function_exists($funzione)) {
  $trigger = $funzione($obj);
  echo $trigger;
}

function getSelectOptions($obj){
  $list = $_POST['list'];
  $filter = $_POST['filter'] ?? null;
  $orderBy = $_POST['orderBy'] ?? null;
  return json_encode($obj->getSelectOptions($list, $filter, $orderBy));
}
function getFilterList($obj){return json_encode($obj->getFilterList());}
function checkName($obj){return json_encode($obj->checkName($_POST));}
function getTimeSeries($obj){return json_encode($obj->getTimeSeries($_POST['filters']));}
function chronoFilter($obj){return json_encode($obj->chronoFilter());}
?>
