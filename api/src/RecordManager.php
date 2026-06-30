<?php
namespace Adc;

class RecordManager extends Conn {
  public function createRecord(array $post): array {
    try {
      $post['values']['created_by'] = $_SESSION['id'];
      $this->create($post['table'], $post['values']);
      return ["error" => 0, "message" => "Record has been successfully created", "post" => $post];
    } catch (\Throwable $th) {
      return ["error" => 1, "message" => $th->getMessage(), "dati" => $post];
    }
  }

  public function readRecord(array $post): array {
    try {
      $items = $this->read($post['table'], $post['conditions']);
      return ["error" => 0, "items" => $items];
    } catch (\Throwable $th) {
      return ["error" => 1, "message" => $th->getMessage(), "dati" => $post];
    }
  }

  public function updateRecord(array $post): array {
    try {
      $this->update($post['table'], $post['values'], $post['conditions']);
      return ["error" => 0, "message" => "Record has been successfully updated", "post" => $post];
    } catch (\Throwable $th) {
      return ["error" => 1, "message" => $th->getMessage(), "dati" => $post];
    }
  }

  public function deleteRecord(array $post): array {
    try {
      return $this->delete($post['table'], $post['conditions']);
    } catch (\Throwable $th) {
      return ["error" => 1, "message" => $th->getMessage(), "dati" => $post];
    }
  }
}
