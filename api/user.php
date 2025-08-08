<?php
require __DIR__ . '/vendor/autoload.php';
use \Adc\User;
$obj = new User();
$funzione = $_POST['trigger'];
unset($_POST['trigger']);
if(isset($funzione) && function_exists($funzione)) {
  $trigger = $funzione($obj);
  echo $trigger;
}

function addUser($obj){ return json_encode($obj->addUser($_POST)); }
function changePassword($obj){return json_encode($obj->changePassword($_POST));}
function checkAdmin($obj){return json_encode($obj->checkAdmin());}
function checkToken($obj){return json_encode($obj->checkToken($_POST['token']));}
function genPwd($obj){ return json_encode($obj->genPwd()); }
function getUsers($obj){return json_encode($obj->getUsers());}
function login($obj){ return json_encode($obj->login($_POST)); }
function rescuePwd($obj){ return json_encode($obj->rescuePwd($_POST['email'])); }
function resetPassword($obj){ return json_encode($obj->resetPassword($_POST)); }

function activeUsers($obj){return json_encode($obj->activeUsers(
  institution: $_POST['institution'] ?? null,
  role: $_POST['role'] ?? null,
  string: $_POST['string'] ?? null
));}

// function mailTemplate($obj){ return json_encode($obj->mailTemplate($_POST)); }
function sendCustomMail($obj){ return json_encode($obj->sendCustomMail($_POST)); }
function fetchMailTemplate($obj){ return json_encode($obj->fetchMailTemplate($_POST['type'])); }

function createRecord($obj){ return json_encode($obj->createRecord($_POST)); }
function readRecord($obj){ return json_encode($obj->readRecord($_POST)); }
function updateRecord($obj){ return json_encode($obj->updateRecord($_POST)); }
function deleteRecord($obj){ return json_encode($obj->deleteRecord($_POST)); }
?>
