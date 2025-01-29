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
  public function create(string $table, array $data) {
    $columns = implode(", ", array_keys($data));
    $placeholders = implode(", ", array_map(fn($key) => ":$key", array_keys($data)));
    $sql = "INSERT INTO {$table} ($columns) VALUES ($placeholders)";    
    $stmt = $this->pdo()->prepare($sql);
    $exec = $stmt->execute($data);
    if (!$exec) {throw new \Exception("Error Processing Request: ".$exec, 1);}
    return true;
  }

  public function read(string $table, array $conditions = []) {
    $where = "";
    if (!empty($conditions)) {
        $whereClauses = array_map(fn($key) => "$key = :$key", array_keys($conditions));
        $where = "WHERE " . implode(" AND ", $whereClauses);
    }
    $sql = "SELECT * FROM {$table} $where";
    $stmt = $this->pdo()->prepare($sql);
    if (!$stmt->execute($conditions)) {
      throw new \Exception("Error Processing Request: " . implode(", ", $stmt->errorInfo()));
    }
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
