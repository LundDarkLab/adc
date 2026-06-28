<?php
// converti i warning in exception così vengono intercettati dal catch e non generano errori
set_error_handler(function($errno, $errstr, $errfile, $errline) {
  throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
});
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
error_log("Raw input: " . file_get_contents('php://input'));
error_log("POST data: " . print_r($_POST, true));
require 'vendor/autoload.php';

$availableClasses = [
  'Artifact' => Adc\Artifact::class,
  'Collection' => Adc\Collection::class,
  'File' => Adc\File::class,
  'Geom' => Adc\Geom::class,
  'Get' => Adc\Get::class,
  'Institution' => Adc\Institution::class,
  'Model' => Adc\Model::class,
  'Media' => Adc\Media::class,
  'Person' => Adc\Person::class,
  'Stats' => Adc\Stats::class,
  'Timeline' => Adc\Timeline::class,
  'User' => Adc\User::class,
  'Vocabulary' => Adc\Vocabulary::class,
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  if (!$input || !isset($input['class'])) {
    $input = $_POST;
  }
  error_log("POST: " . print_r($_POST, true));
  error_log("FILES: " . print_r($_FILES, true));
  error_log("INPUT: " . print_r($input, true));
  if (isset($input['class']) && isset($input['action'])) {
    $className = $input['class'];
    $action = $input['action'];
    $dryRun = filter_var($input['dry_run'] ?? false, FILTER_VALIDATE_BOOLEAN);
    unset($input['class'], $input['action'], $input['dry_run']);
    if (array_key_exists($className, $availableClasses)) {
      $class = $availableClasses[$className];
      $obj = new $class();
      if (method_exists($obj, $action)) {
        try {
          if (empty($input)) {$input = [];}
          if ($dryRun) { $obj->pdo()->beginTransaction(); }
          $reflection = new ReflectionMethod($obj, $action);
          $numParams = $reflection->getNumberOfParameters();
          if ($numParams === 2) {
            $files = $dryRun ? [] : $_FILES;
            $response = $obj->$action($input, $files);
          } else {
            $response = $obj->$action($input);
          }
          if ($dryRun) {
            $obj->pdo()->rollBack();
            if (is_array($response)) { $response['dry_run'] = true; }
          }
          //echo json_encode(['error' => 0, 'data' => $response]);
          $json = json_encode(['error' => 0, 'data' => $response], JSON_UNESCAPED_UNICODE);
          if ($json === false) {
              array_walk_recursive($response, function(&$val) {
                  if (is_string($val)) {
                      $val = mb_convert_encoding($val, 'UTF-8', 'UTF-8');
                  }
              });
              $json = json_encode(
                  ['error' => 0, 'data' => $response],
                  JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
              );
          }
          header('Content-Type: application/json; charset=utf-8');
          echo $json;
        } catch (Exception $e) {
          if ($dryRun && $obj->pdo()->inTransaction()) { $obj->pdo()->rollBack(); }
          http_response_code(500);
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
