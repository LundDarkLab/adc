<?php
namespace Adc;
use PDO;
class Conn {
  public $conn;
  public function connect() {
    $params = parse_ini_file('config/.env');
    if ($params === false) {
      throw new \Exception("Error reading database configuration file");
    }
    $conStr = sprintf(
      "mysql:host=%s;port=%d;dbname=%s;user=%s;password=%s",
      $params['DBHOST'],
      $params['DBPORT'],
      $params['DBDBNAME'],
      $params['DBUSER'],
      $params['DBPASSWORD']
    );

    $this->conn = new \PDO($conStr);
    $this->conn->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
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
    if (!empty($conditions)) {
      $whereClauses = array_map(fn($key) => "$key = :$key", array_keys($conditions));
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
    if (!empty($having)) {
      $havingClauses = array_map(fn($key) => "$key = :having_$key", array_keys($having));
      $havingClause = 'HAVING ' . implode(' AND ', $havingClauses);
    }
  
    $sql = "SELECT {$select} FROM {$table} {$join} {$where} {$group} {$havingClause} {$order} {$limitSql}";
    $stmt = $this->pdo()->prepare($sql);
    $params = array_merge(
      $conditions,
      array_combine(
        array_map(fn($key) => "having_$key", array_keys($having)),
        array_values($having)
      )
    );
  
    if (!$stmt->execute($params)) { throw new \Exception('Error Processing Request: ' . implode(', ', $stmt->errorInfo())); }
  
    error_log("SQL Query: $sql");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  public function create(string $table, array $data) {
    $columns = implode(", ", array_keys($data));
    $placeholders = implode(", ", array_map(fn($key) => ":$key", array_keys($data)));
    $sql = "INSERT INTO {$table} ($columns) VALUES ($placeholders)";    
    $stmt = $this->pdo()->prepare($sql);
    $exec = $stmt->execute($data);
    if (!$exec) {throw new \Exception("Error Processing Request: ".$exec, 1);}
    return true;
  }


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
