<?php
require __DIR__ . '/vendor/autoload.php';
use \Adc\User;
use \Adc\MailService;
use \Adc\RecordManager;
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
function sendCustomMail($obj){ $m = new MailService(); return json_encode($m->sendCustomMail($_POST)); }
function fetchMailTemplate($obj){ $m = new MailService(); return json_encode($m->fetchMailTemplate($_POST['type'])); }

function createRecord($obj){ $rm = new RecordManager(); return json_encode($rm->createRecord($_POST)); }
function readRecord($obj){ $rm = new RecordManager(); return json_encode($rm->readRecord($_POST)); }
function updateRecord($obj){ $rm = new RecordManager(); return json_encode($rm->updateRecord($_POST)); }
function deleteRecord($obj){ $rm = new RecordManager(); return json_encode($rm->deleteRecord($_POST)); }
?>
