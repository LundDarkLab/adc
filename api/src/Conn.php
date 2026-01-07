<?php
namespace Adc;

use PDO;
use Dotenv\Dotenv;
class Conn {
  public $conn;
  
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
    $dotenvPath = __DIR__ . '/../config';
    if (!file_exists($dotenvPath . '/.env')) {
      error_log('Missing .env file at ' . realpath($dotenvPath . '/.env'));
      return null;
    }
    $dotenv = Dotenv::createImmutable($dotenvPath);
    $dotenv->load();
    $dotenv->required(['DBHOST', 'DBPORT', 'DBDBNAME', 'DBUSER', 'DBPASSWORD']);
    $host =     $_ENV['DBHOST'];
    $port =     $_ENV['DBPORT'];
    $dbname =   $_ENV['DBDBNAME'];
    $username = $_ENV['DBUSER'];
    $password = $_ENV['DBPASSWORD'];

    $conStr = sprintf(
      'mysql:host=%s;port=%d;dbname=%s;user=%s;password=%s',
      $host,
      $port,
      $dbname,
      $username,
      $password
    );
    $this->conn = new \PDO($conStr);
    $this->conn->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
    $this->conn->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
    // Impostazioni aggiuntive per MySQL
    $this->conn->setAttribute(\PDO::MYSQL_ATTR_INIT_COMMAND, "SET NAMES utf8mb4");
  }

  public function pdo(){
    if (!$this->conn){ $this->connect();}
    return $this->conn;
  }

  // NEW FUNCTIONS ////////////////////////////////////////////////////////
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
   * @throws Exception If an error occurs during query execution.
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
    int $limit = null,
    int $offset = null,
    array $groupBy = [],
    array $having = []
  ){
    if (empty($table)) { throw new \Exception('Table name cannot be empty.'); }
    if (empty($columns)) { throw new \Exception('Columns cannot be empty.'); }
    $select = implode(', ', $columns);

    $where = '';
    $params = [];
    if (!empty($conditions)) {
      $whereClauses = [];
      foreach ($conditions as $key => $condition) {
        $placeholder = str_replace('.', '_', $key);
        if (is_array($condition)) {
          if (count($condition) === 1) {
            // Operatore unario (es. 'IS NOT NULL')
            $operator = $condition[0];
            $whereClauses[] = "$key $operator";
          } else {
            // Operatore binario con valore
            list($value, $operator) = $condition;
            $operator = $operator ?: '=';
            $whereClauses[] = "$key $operator :$placeholder";
            $params[$placeholder] = $value;
          }
        } else {
          // Valore semplice con operatore default '='
          $value = $condition;
          $operator = '=';
          $whereClauses[] = "$key $operator :$placeholder";
          $params[$placeholder] = $value;
        }
      }
      $where = 'WHERE ' . implode(' AND ', $whereClauses);
    }

    $join = '';
    if (!empty($joins)) {
      $join = implode(' ', array_map(function ($join) {
        $type = isset($join['type']) ? strtoupper($join['type']) . ' JOIN' : 'INNER JOIN';
        return "{$type} {$join['table']} ON {$join['first']} {$join['operator']} {$join['second']}";
      }, $joins));
    }
  
    $order = '';
    if (!empty($orderBy)) {
      $orderClauses = array_map(fn($column, $direction) => "$column $direction", array_keys($orderBy), $orderBy);
      $order = 'ORDER BY ' . implode(', ', $orderClauses);
    }
  
    $limitSql = '';
    if ($limit !== null) {
      $limitSql = 'LIMIT ' . $limit;
      if ($offset !== null) { $limitSql .= ' OFFSET ' . $offset; }
    }
  
    $group = '';
    if (!empty($groupBy)) { $group = 'GROUP BY ' . implode(', ', $groupBy); }
  
    $havingClause = '';
    $paramsHaving = [];
    if (!empty($having)) {
      $isAssociativeHaving = array_keys($having) !== range(0, count($having) - 1);
      if ($isAssociativeHaving) {
        // Associative array: key => value or [value, operator]
        $havingClauses = [];
        foreach ($having as $key => $condition) {
          $placeholder = "having_" . str_replace('.', '_', $key);
          if (is_array($condition)) {
            // Se è array: [value, operator]
            list($value, $operator) = $condition;
            $operator = $operator ?: '='; // Default a '=' se non specificato
          } else {
            // Se non array: value con operator default '='
            $value = $condition;
            $operator = '=';
          }
          $havingClauses[] = "$key $operator :$placeholder";
          $paramsHaving[$placeholder] = $value;
        }
        $havingClause = 'HAVING ' . implode(' AND ', $havingClauses);
      } else {
        // Indexed array: raw conditions
        $havingClause = 'HAVING ' . implode(' AND ', array_map(fn($cond) => "($cond)", $having));
      }
    }
  
    $sql = "SELECT {$select} FROM {$table} {$join} {$where} {$group} {$havingClause} {$order} {$limitSql}";
    $stmt = $this->pdo()->prepare($sql);

    // Unisci params con quelli di having
    $params = array_merge($params, $paramsHaving);

    error_log("SQL Query: $sql");
    error_log("Parameters: " . json_encode($params));
    if (!$stmt->execute($params)) { throw new \Exception('Error Processing Request: ' . implode(', ', $stmt->errorInfo())); }

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
    if (!$exec) {throw new \Exception("Error Processing Request: ".$exec, 1);}
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
    if (!$exec) {throw new \Exception("Error Processing Request: ".$exec, 1);}
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
    if (!$exec) {throw new \Exception("Error Processing Request: ".$exec, 1);}
    return ["error" => 0, "message" => 'Record has been successfully deleted'];
  }
  //////////////////////////////////////////////////////////////////////////

  public function simple($sql){
    $pdo = $this->pdo();
    $exec = $pdo->prepare($sql);
    $execute = $exec->execute();
    if(!$execute){ throw new \Exception("Error Processing Request: ".$execute, 1); }
    return $exec->fetchAll(PDO::FETCH_ASSOC);
  }

  public function prepared(string $sql, array $dati){
    $pdo = $this->pdo();
    $exec = $pdo->prepare($sql);
    $execute = $exec->execute($dati);
    if(!$execute){ throw new \Exception("Error Processing Request: ".$execute, 1); }
    return true;
  }

  public function buildInsert(string $tab, array $dati){
    $field = [];
    $value = [];
    foreach ($dati as $key => $val) {
      // $v = $key == 'password' ? "crypt(:password, gen_salt('md5'))" : ":".$key;
      $v = ":".$key;
      array_push($field,$key);
      array_push($value,$v);
    }
    $sql = "insert into ".$tab."(".join(",",$field).") values (".join(",",$value).");";
    return $sql;
  }

  public function buildUpdate(string $tab, array $filter, array $dati){
    $field = [];
    $where = [];
    foreach ($dati as $key => $val) {
      $v = $key == 'password' ? "crypt(:password, gen_salt('md5'))" : ":".$key;
      array_push($field,$key."=".$v);
    }
    foreach ($filter as $key => $val) { array_push($where,$key." = ".$val); }
    $sql = "update ".$tab." set ".join(",",$field)." where ".join(" AND ", $where).";";
    return $sql;
  }

  public function buildDelete(string $tab, array $filter){
    $where = [];
    foreach ($filter as $key => $val) { array_push($where,$tab.".".$key." = ".$val); }
    $sql = "delete from ".$tab." where ".join(" AND ", $where).";";
    return $sql;
  }

  public function __construct() {}
  public function __clone() {}
  public function __wakeup() {}

}
?>
