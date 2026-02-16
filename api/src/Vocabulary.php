<?php

namespace Adc;

ini_set('display_errors', 0);
ini_set('display_startup_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

class Vocabulary extends Conn{
  public function __construct() {
    // Constructor intentionally left empty.
    // Initialization is handled by the parent Conn class or elsewhere.
  }


  // ========== CRUD Operations ==========
  
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

  // ========== Vocabulary Getters ==========

  /**
   * Get all authors ordered by name
   * @return array List of authors [id, name]
   */
  public function getAuthors(): array {
    try {
      return $this->read(
        'authors',
        ['id', 'name'],
        [],
        [],
        ['name' => 'ASC']
      );
    } catch (\Exception $e) {
      error_log('Error fetching authors: ' . $e->getMessage());
      return [];
    }
  }

  /**
   * Get all owners ordered by name
   * @return array List of owners [id, name]
   */
  public function getOwners(): array {
    try {
      return $this->read(
        'owners',
        ['id', 'name'],
        [],
        [],
        ['name' => 'ASC']
      );
    } catch (\Exception $e) {
      error_log('Error fetching owners: ' . $e->getMessage());
      return [];
    }
  }

  /**
   * Get all licenses ordered by name
   * @return array List of licenses [id, name]
   */
  public function getLicenses(): array {
    try {
      return $this->read(
        'license',
        ['*'],
        [],
        [],
        ['acronym' => 'ASC']
      );
    } catch (\Exception $e) {
      error_log('Error fetching licenses: ' . $e->getMessage());
      return [];
    }
  }

  /**
   * Get all acquisition methods ordered by name
   * @return array List of acquisition methods [id, name]
   */
  public function genericVocabulariesList(array $payload): array {
    $table = $payload['table'];
    $orderBy = $payload['order_by'] ?? 'value';
    try {
      return $this->read(
        $table,
        ['*'],
        [],
        [],
        [$orderBy => 'ASC']
      );
    } catch (\Exception $e) {
      error_log('Error fetching ' . $table . ': ' . $e->getMessage());
      return [];
    }
  }

  // ========== Esempio con JOIN per tabelle complesse ==========

  /**
   * Example: Get models with related data (con join)
   * @return array List of models with author and owner names
   */
  public function getModelsWithDetails(): array {
    try {
      return $this->read(
        'models',
        [
          'models.id',
          'models.name',
          'authors.name as author_name',
          'owners.name as owner_name'
        ],
        ['models.active' => 1], // solo modelli attivi
        [
          [
            'table' => 'authors',
            'first' => 'models.author_id',
            'operator' => '=',
            'second' => 'authors.id',
            'type' => 'left'
          ],
          [
            'table' => 'owners',
            'first' => 'models.owner_id',
            'operator' => '=',
            'second' => 'owners.id',
            'type' => 'left'
          ]
        ],
        ['models.name' => 'ASC']
      );
    } catch (\Exception $e) {
      error_log('Error fetching models with details: ' . $e->getMessage());
      return [];
    }
  }

  /**
   * Example: Get categories with parent name (self-join)
   * @return array List of categories [id, name, parent_name]
   */
  public function getCategoriesWithParent(): array {
    try {
      return $this->read(
        'categories as c',
        [
          'c.id',
          'c.name',
          'parent.name as parent_name'
        ],
        [],
        [
          [
            'table' => 'categories as parent',
            'first' => 'c.parent_id',
            'operator' => '=',
            'second' => 'parent.id',
            'type' => 'left'
          ]
        ],
        ['c.name' => 'ASC']
      );
    } catch (\Exception $e) {
      error_log('Error fetching categories: ' . $e->getMessage());
      return [];
    }
  }
}