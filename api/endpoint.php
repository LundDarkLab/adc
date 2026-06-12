<?php
require 'vendor/autoload.php';
use \Adc\Api;
$controller = new Api();

// L'app può essere installata alla root o in una sottocartella qualsiasi:
// il path della risorsa è ciò che segue "endpoint/" (URL riscritto da .htaccess)
// o "endpoint.php/" (accesso diretto)
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_match('#/endpoint(?:\.php)?/(.+)$#', $uri, $m) ? rtrim($m[1], '/') : '';

if ($path === 'object') {
  $id = isset($_GET['id']) ? intval($_GET['id']) : null;
  if ($id) {
    $jsonld = $controller->getObjectById($id);
    header('Content-Type: application/ld+json');
    echo $jsonld;
  } else {
    header("HTTP/1.1 400 Bad Request");
    echo json_encode(["error" => "ID is required"]);
  }
} elseif ($path === 'objects') {
  $jsonld = $controller->getAllObjects();
  header('Content-Type: application/ld+json');
  echo $jsonld;
} else {
  header("HTTP/1.1 404 Not Found");
  echo json_encode(["error" => "Endpoint not found"]);
}


?>