<?php
namespace Adc;

ini_set('display_errors', 0);
ini_set('display_startup_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

class Vocabulary extends Conn{
  public function __construct() {}

  public function addItem(array $payload):array{
    try {
      $table = $payload['table'];
      unset($payload['table']);
      $this->create($table, $payload);
      return ["error" => 0, "message" => 'Record has been successfully added'];
    } catch (\Exception $e) {
      return ["error" => 1, "message" => 'Error adding record: ' . $e->getMessage()];
    }
  }

  public function updateItem(array $payload):array{
    try {
      if (!isset($payload['table'], $payload['id'])) {
        throw new \Exception('Missing required parameters: table or id');
      }
      $table = $payload['table'];
      $id = $payload['id'];
      unset($payload['table'], $payload['id']);
      if (empty($payload)) {
        throw new \Exception('No data to update');
      }
      $this->update($table, $payload, ['id' => $id]);
      return ["error" => 0, "message" => 'Record has been successfully updated'];
    } catch (\Exception $e) {
      return ["error" => 1, "message" => 'Error updating record: ' . $e->getMessage()];
    }
  }

  public function deleteItem(array $payload):array{
    try {
      $this->delete($payload['table'], ['id' => $payload['id']]);
      return ["error" => 0, "message" => 'Record has been successfully deleted'];
    } catch (\Exception $e) {
      return ["error" => 1, "message" => 'Error deleting record: ' . $e->getMessage()];
    }
  }
}
?>