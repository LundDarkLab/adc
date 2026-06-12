<?php
namespace Adc;

use PDO;
class Conn {
  public ?PDO $conn = null;
  const ERROR = 'Error Processing Request:';
  
  /**
   * Magic method to handle dynamic method calls.
   *
   * This method intercepts calls to undefined methods on the current class.
   * If the method exists on the PDO instance, it delegates the call to the PDO object,
   * passing along the provided arguments.
   *
   * @param string $name The name of the method being called.
   * @param array $arguments The arguments passed to the method.
   *
   * @return mixed The result of the method call on the PDO instance.
   */
  public function __call($name, $arguments) {
    if (method_exists($this->pdo(), $name)) {
      return call_user_func_array([$this->pdo(), $name], $arguments);
    }
    throw new \BadMethodCallException("Method $name does not exist on Conn or PDO.");
  }
  /******************************************************************/
  public function connect() {
    $host = getenv('DB_HOST') ?: 'db';
    $port = 3306;  // Porta interna del container DB (non esterna)
    $dbname = getenv('DB_NAME') ?: 'dyncoll';  // Corretto da 'DB_DBNAME' a 'DB_NAME'
    $username = getenv('DB_USER') ?: 'dyncoll';
    $password = getenv('DB_PASSWORD') ?: '';

    $conStr = sprintf(
        'mysql:host=%s;port=%d;dbname=%s',  // Rimossi user e password dalla DSN
        $host,
        $port,
        $dbname
    );

    try {
        $this->conn = new \PDO($conStr, $username, $password, [\PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"]);
        $this->conn->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        $this->conn->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
        $this->conn->setAttribute(\PDO::MYSQL_ATTR_INIT_COMMAND, "SET NAMES utf8mb4");
    } catch (\PDOException $e) {
        error_log("PDO connection failed: " . $e->getMessage());
        throw $e;
    }
  }

  public function pdo(){
    if (!$this->conn){ $this->connect();}
    return $this->conn;
  }

  // NEW FUNCTIONS ////////////////////////////////////////////////////////

  private function wrapColumn(string $key): string {
    if (str_contains($key, '.')) {
        [$table, $column] = explode('.', $key, 2);
        return "`$table`.`$column`";
    }
    return "`$key`";
  }

  /**
   * Executes a SELECT query on a database table.
   *
   * @param string $table The name of the table to query.
   * @param array $columns An array of columns to select (default: ['*']).
   * @param array $conditions An associative array of WHERE conditions (key => value).
   * @param array $joins An array of arrays defining JOIN clauses.
   * Each inner array should have the following structure:
   * ['table' => string, 'first' => string, 'operator' => string, 'second' => string, 'type' => string ("inner", "left")(optional)].
   * @param array $orderBy An associative array of ORDER BY clauses (column => direction).
   * @param int|null $limit The maximum number of results to return (optional).
   * @param int|null $offset The result offset (optional).
   * @param array $groupBy An array of columns for the GROUP BY clause (optional).
   * @param array $having An associative array of HAVING conditions (key => value) (optional).
   *
   * @return array An associative array of query results.
   *
   * @example
   * // Example usage:
   * $results = $this->read(
   * 'users',
   * ['id', 'name', 'email'],
   * ['status' => 'active'],
   * [
   * ['table' => 'profiles', 'first' => 'users.id', 'operator' => '=', 'second' => 'profiles.user_id']
   * ],
   * ['name' => 'asc'],
   * 10,
   * 0,
   * ['role'],
   * ['COUNT(*) >' => 5]
   * );
   */
  public function read(
    string $table,
    array $columns = ['*'],
    array $conditions = [],
    array $joins = [],
    array $orderBy = [],
    ?int $limit = null,
    ?int $offset = null,
    array $groupBy = [],
    array $having = []
  ){
    if (empty($table)) { throw new \Exception('Table name cannot be empty.'); }
    if (empty($columns)) { throw new \Exception('Columns cannot be empty.'); }
    $select = implode(', ', $columns);

    $params = [];
    $where = $this->buildWhere($conditions, $params);

    $join = $this->buildJoins($joins);
  
    $order = $this->buildOrderBy($orderBy);
  
    $limitSql = $this->buildLimit($limit, $offset);
  
    $group = $this->buildGroupBy($groupBy);
  
    $havingClause = $this->buildHaving($having, $params);
  
    $sql = "SELECT {$select} FROM {$table} {$join} {$where} {$group} {$havingClause} {$order} {$limitSql}";
    $stmt = $this->pdo()->prepare($sql);

    error_log("SQL Query: $sql");
    error_log("Parameters: " . json_encode($params));
    if (!$stmt->execute($params)) { throw new \Exception(self::ERROR . implode(', ', $stmt->errorInfo())); }

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  /**
   * Costruisce la clausola WHERE e popola $params (per riferimento).
   * Ogni condizione può essere: valore semplice, [valore, operatore]
   * oppure [operatore] (unario, es. 'IS NOT NULL').
   */
  private function buildWhere(array $conditions, array &$params): string {
    if (empty($conditions)) { return ''; }
    $clauses = [];
    foreach ($conditions as $key => $condition) {
      $column = $this->wrapColumn($key);
      // Operatore unario senza valore (es. ['IS NOT NULL'])
      if (is_array($condition) && count($condition) === 1) {
        $clauses[] = "$column {$condition[0]}";
        continue;
      }
      [$value, $operator] = $this->normalizeCondition($condition);
      $placeholder = str_replace('.', '_', $key);
      $clauses[] = "$column $operator :$placeholder";
      $params[$placeholder] = $value;
    }
    return 'WHERE ' . implode(' AND ', $clauses);
  }

  /**
   * Costruisce la clausola HAVING e popola $params (per riferimento).
   * Array associativo: key => valore|[valore, operatore].
   * Array indicizzato: condizioni grezze già formate.
   */
  private function buildHaving(array $having, array &$params): string {
    if (empty($having)) { return ''; }
    $isAssociative = array_keys($having) !== range(0, count($having) - 1);
    if (!$isAssociative) {
      return 'HAVING ' . implode(' AND ', array_map(fn($cond) => "($cond)", $having));
    }
    $clauses = [];
    foreach ($having as $key => $condition) {
      [$value, $operator] = $this->normalizeCondition($condition);
      $placeholder = 'having_' . str_replace('.', '_', $key);
      $clauses[] = "$key $operator :$placeholder";
      $params[$placeholder] = $value;
    }
    return 'HAVING ' . implode(' AND ', $clauses);
  }

  /**
   * Normalizza una condizione in [valore, operatore].
   * Accetta un valore semplice (operatore default '=') o [valore, operatore].
   */
  private function normalizeCondition(mixed $condition): array {
    if (is_array($condition)) {
      [$value, $operator] = $condition;
      return [$value, $operator ?: '='];
    }
    return [$condition, '='];
  }

  private function buildJoins(array $joins): string {
    if (empty($joins)) { return ''; }
    return implode(' ', array_map(function ($join) {
      $type = isset($join['type']) ? strtoupper($join['type']) . ' JOIN' : 'INNER JOIN';
      return "{$type} {$join['table']} ON {$join['first']} {$join['operator']} {$join['second']}";
    }, $joins));
  }

  private function buildOrderBy(array $orderBy): string {
    if (empty($orderBy)) { return ''; }
    $clauses = array_map(fn($column, $direction) => "$column $direction", array_keys($orderBy), $orderBy);
    return 'ORDER BY ' . implode(', ', $clauses);
  }

  private function buildGroupBy(array $groupBy): string {
    return empty($groupBy) ? '' : 'GROUP BY ' . implode(', ', $groupBy);
  }

  private function buildLimit(?int $limit, ?int $offset): string {
    if ($limit === null) { return ''; }
    $sql = 'LIMIT ' . $limit;
    if ($offset !== null) { $sql .= ' OFFSET ' . $offset; }
    return $sql;
  }


  /**
   * Inserts a new record into the specified database table.
   *
   * @param string $table The name of the table where the record will be inserted.
   * @param array $data An associative array of column names and their corresponding values to insert.
   *                    Example: ['column1' => 'value1', 'column2' => 'value2']
   *
   * @throws \Exception If the SQL execution fails, an exception is thrown with the error message.
   *
   * @return bool Returns true if the record is successfully inserted.
   */
  public function create(string $table, array $data) {
    $columns = implode(", ", array_keys($data));
    $placeholders = implode(", ", array_map(fn($key) => ":$key", array_keys($data)));
    $sql = "INSERT INTO {$table} ($columns) VALUES ($placeholders)";
    $stmt = $this->pdo()->prepare($sql);
    $exec = $stmt->execute($data);
    if (!$exec) {throw new \Exception(self::ERROR . implode(', ', $stmt->errorInfo()), 1);}
    return true;
  }

  /**
 * Updates records in a database table.
 *
 * @param string $table The name of the table to update.
 * @param array $data An associative array of column-value pairs to update (e.g., ['column1' => 'value1', 'column2' => 'value2']).
 * @param array $conditions An associative array of conditions for the WHERE clause (e.g., ['id' => 1]).
 *
 * @return bool Returns true if the update is successful.
 *
 * @throws \Exception If the query execution fails.
 *
 * @example
 * // Example usage:
 * $conn = new Conn();
 * $conn->update(
 *     'users',
 *     ['name' => 'John Doe', 'email' => 'john.doe@example.com'],
 *     ['id' => 1]
 * );
 */
  public function update(string $table, array $data, array $conditions) {
    $setClause = implode(", ", array_map(fn($key) => "$key = :$key", array_keys($data)));
    $whereClauses = array_map(fn($key) => "$key = :cond_$key", array_keys($conditions));
    $where = implode(" AND ", $whereClauses);

    $sql = "UPDATE {$table} SET $setClause WHERE $where";
    $stmt = $this->pdo()->prepare($sql);

    // Unire i parametri dei dati e delle condizioni
    foreach ($conditions as $key => $value) { $data["cond_$key"] = $value; }
    $exec = $stmt->execute($data);
    if (!$exec) {throw new \Exception(self::ERROR . implode(', ', $stmt->errorInfo()), 1);}
    return true;
  }


  /**
   * Deletes a record from the specified table based on the given conditions.
   *
   * @param string $table The name of the table from which the record should be deleted.
   * @param array $conditions An associative array of conditions where the keys are column names
   *                          and the values are the corresponding values to match.
   *                          Example: ['id' => 1, 'status' => 'active']
   *
   * @throws \Exception If the deletion fails, an exception is thrown with an error message.
   *
   * @return array An associative array containing:
   *               - "error" (int): 0 if the deletion was successful.
   *               - "message" (string): A success message indicating the record was deleted.
   */
  public function delete(string $table, array $conditions) {
    $whereClauses = array_map(fn($key) => "$key = :$key", array_keys($conditions));
    $where = implode(" AND ", $whereClauses);
    $sql = "DELETE FROM {$table} WHERE $where";
    $stmt = $this->pdo()->prepare($sql);
    $exec = $stmt->execute($conditions);
    if (!$exec) {throw new \Exception(self::ERROR . implode(', ', $stmt->errorInfo()), 1);}
    return ["error" => 0, "message" => 'Record has been successfully deleted'];
  }
  //////////////////////////////////////////////////////////////////////////

  public function simple(string $sql){
    $pdo = $this->pdo();
    $exec = $pdo->prepare($sql);
    $execute = $exec->execute();
    if(!$execute){ throw new \Exception(self::ERROR . implode(', ', $exec->errorInfo()), 1); }
    return $exec->fetchAll(PDO::FETCH_ASSOC);
  }

  public function prepared(string $sql, array $dati){
    $pdo = $this->pdo();
    $exec = $pdo->prepare($sql);
    $execute = $exec->execute($dati);
    if(!$execute){ throw new \Exception(self::ERROR . implode(', ', $exec->errorInfo()), 1); }
    return true;
  }

  public function buildInsert(string $tab, array $dati){
    $field = [];
    $value = [];
    foreach (array_keys($dati) as $key) {
      // $v = $key == 'password' ? "crypt(:password, gen_salt('md5'))" : ":".$key;
      $v = ":".$key;
      array_push($field,$key);
      array_push($value,$v);
    }
    return "insert into ".$tab."(".join(",",$field).") values (".join(",",$value).");";
  }

  public function buildUpdate(string $tab, array $filter, array $dati){
    $field = [];
    $where = [];
    foreach ($dati as $key => $val) {
      $v = $key == 'password' ? "crypt(:password, gen_salt('md5'))" : ":".$key;
      array_push($field,$key."=".$v);
    }
    foreach ($filter as $key => $val) { array_push($where,$key." = ".$val); }
    return "update ".$tab." set ".join(",",$field)." where ".join(" AND ", $where).";";
  }

  public function buildDelete(string $tab, array $filter){
    $where = [];
    foreach ($filter as $key => $val) { array_push($where,$tab.".".$key." = ".$val); }
    return "delete from ".$tab." where ".join(" AND ", $where).";";
  }

}

