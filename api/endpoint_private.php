<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
error_log("Raw input: " . file_get_contents('php://input'));
error_log("POST data: " . print_r($_POST, true));
require 'vendor/autoload.php';

$availableClasses = [
  'Artifact' => Adc\Artifact::class,
  'Get' => Adc\Get::class,
  'Timeline' => Adc\Timeline::class,
  'Vocabulary' => Adc\Vocabulary::class,
  'Collection' => Adc\Collection::class,
  'User' => Adc\User::class,
  'Geom' => Adc\Geom::class,
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  if (isset($input['class']) && isset($input['action'])) {
    $className = $input['class'];
    $action = $input['action'];
    unset($input['class']);
    unset($input['action']);
    if (array_key_exists($className, $availableClasses)) {
      $class = $availableClasses[$className];
      $obj = new $class();
      if (method_exists($obj, $action)) {
        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
          $input['file'] = [
            'tmp_name' => $_FILES['file']['tmp_name'],
            'name' => $_FILES['file']['name'],
            'type' => $_FILES['file']['type']
          ];
        }
        try {
          if (empty($input)) {$input = [];}
          $response = $obj->$action($input);
          echo json_encode(['error' => 0, 'data' => $response]);
        } catch (Exception $e) {
          http_response_code(500); // Errore del server
          echo json_encode(['error' => 1, 'message' => $e->getMessage()]);
        }
      } else {
        http_response_code(404); // Metodo non trovato
        echo json_encode(['error' => 1, 'message' => 'Metodo non esistente']);
      }
    } else {
      http_response_code(404); // Classe non trovata
      echo json_encode(['error' => 1, 'message' => 'Classe non esistente']);
    }
  } else {
    http_response_code(400); // Richiesta malformata
    echo json_encode(['error' => 1, 'message' => 'Classe o azione non specificata']);
  }
} else {
  http_response_code(405); // Metodo non consentito
  echo json_encode(['error' => 1, 'message' => 'Richiesta non valida']);
}
?>