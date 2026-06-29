<?php
namespace Adc;
if (session_status() === PHP_SESSION_NONE) { session_start();}
use \PHPMailer\PHPMailer\PHPMailer;
class Person extends Conn{
  public PHPMailer $mail;
  public function __construct(){
    $this->mail = new PHPMailer(true);
  }

  public function listPositions(){
    $sql = "select id, value from list_person_position order by value asc;";
    return $this->simple($sql);
  }

  public function addPerson(array $dati){
    try {
      $this->pdo()->beginTransaction();
      $sql = $this->buildInsert("person", $dati['person']);
      $this->prepared($sql, $dati['person']);
      $lastId = $this->pdo()->lastInsertId();
      if(isset($dati['user'])){
        $dati['user']['person'] = $lastId;
        $this->createUser($dati);
      }
      $this->pdo()->commit();
      return ["res"=> 0, "output"=>'Ok, the item has been successfully created'];
    } catch (\Throwable $e) {
      $this->pdo()->rollBack();
      return ["res"=>1, "output"=>$e->getMessage()];
    }
  }

  public function createUser(array $dati){
    $sql = $this->buildInsert("user", $dati['user']);
    $this->prepared($sql, $dati['user']);

    $token = hash('sha256', $dati['person']['email'] . random_bytes(16)) . random_int(10, 9999);
    $tokenData = array("email"=>$dati['person']['email'], "token"=>$token);
    $tokenSql = $this->buildInsert("reset_password", $tokenData);
    $this->prepared($tokenSql, $tokenData);

    $datiMail = array(
      "email"=>$dati['person']['email'],
      "name"=>$dati['person']['first_name']." ".$dati['person']['last_name'],
      "link"=>"https://dyncoll.ht.lu.se/reset_password.php?key=".$token,
      "mailBody"=>1
    );
    $this->sendMail($datiMail);
  }

  public function sendMail(array $dati){
    switch ($dati['mailBody']) {
      case 1:
        $titolo = "New account";
        $body = file_get_contents('config/mailBody/newUser.html');
        $body = str_replace('%name%', $dati['name'], $body);
        $body = str_replace('%link%', $dati['link'], $body);
      break;
      case 2:
        $titolo="Reset my password";
        $body = file_get_contents('config/mailBody/rescuePwd.html');
        $body = str_replace('%name%', $dati['name'], $body);
        $body = str_replace('%link%', $dati['link'], $body);
      break;
      default:
        throw new \Exception("Undefined mail body",0);
    }
    $mailParams = Config::mailParams();
    $this->mail->isSMTP();
    
    // only for testing, print messages only in the console, do not use in production!!!!
    // $this->mail->SMTPDebug = SMTP::DEBUG_SERVER;
    
    $this->mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $this->mail->SMTPAuth = true;
    $this->mail->Host = $mailParams['MAILHOST'];
    $this->mail->Port = $mailParams['MAILPORT'];
    $this->mail->Username = $mailParams['MAILUSER'];
    $this->mail->Password = $mailParams['MAILPASSWORD'];
    $this->mail->setFrom($mailParams['MAILSETFROM'], $mailParams['MAILSETFROMNAME']);
    $this->mail->addAddress($dati['email'], $dati['name']);
    $this->mail->Subject = $titolo;
    $this->mail->msgHTML($body, __DIR__);
    $this->mail->AltBody = $this->htmlToPlainText($body);
    if (!$this->mail->send()) {
      throw new \Exception('Mailer Error: '. $this->mail->ErrorInfo,0);
    }
    return true;
  }

  private function htmlToPlainText(string $str){
    $str = str_replace('&nbsp;', ' ', $str);
    $str = html_entity_decode($str, ENT_QUOTES | ENT_COMPAT , 'UTF-8');
    $str = html_entity_decode($str, ENT_HTML5, 'UTF-8');
    $str = html_entity_decode($str);
    $str = htmlspecialchars_decode($str);
    $str = strip_tags($str);
    return $str;
  }

  public function getPersonFromUser(array $payload = []): array {
    $userId = isset($payload['userId']) ? (int)$payload['userId'] : 0;
    if ($userId <= 0) {
      throw new \Exception("Error Processing Request", 1);
    }

    return $this->getPersons(['filters' => ['userId' => $userId]]);
  }

  public function getPersons(array $payload = []): array {
    [$conditions, $params] = $this->buildPersonFilters($payload['filters'] ?? []);

    $where = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $sql = "SELECT p.id `person_id`, concat(p.last_name, ' ', p.first_name) as `name`, p.first_name, p.last_name, p.email, p.institution  `institution_id`, i.name `institution`, p.position `position_id`, position.value `position`, u.id `user_id`, u.is_active `active`, u.role `role_id`, `role`.value as user_class FROM person p LEFT JOIN institution i ON i.id = p.institution LEFT JOIN list_person_position position ON p.position = position.id LEFT JOIN user u ON u.person = p.id LEFT JOIN list_user_role `role` ON u.role = `role`.id $where ORDER BY 2 ASC";

    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
  }

  private function buildPersonFilters(array $filters): array {
    $conditions = [];
    $params = [];

    $this->applyNumericFilter($filters, 'id', 'p.id = :id', $conditions, $params);
    $this->applyNumericFilter($filters, 'userId', 'u.id = :userId', $conditions, $params);
    $this->applyNumericFilter($filters, 'role', 'u.role = :role', $conditions, $params);
    $this->applyNumericFilter($filters, 'institution', 'p.institution = :institution', $conditions, $params);
    $this->applyStatusFilter($filters, $conditions, $params);
    $this->applyNameFilter($filters, $conditions, $params);
    return [$conditions, $params];
  }

  private function applyNumericFilter(array $filters, string $key, string $condition, array &$conditions, array &$params): void {
    if (isset($filters[$key]) && is_numeric($filters[$key])) {
      $conditions[] = $condition;
      $params[":$key"] = (int)$filters[$key];
    }
  }

  private function applyStatusFilter(array $filters, array &$conditions, array &$params): void {
    if (!isset($filters['status']) || !is_numeric($filters['status'])) {return;}
    $status = (int)$filters['status'];
    if ($status === 3) {
      $conditions[] = 'u.is_active IS NULL';
    } else {
      $conditions[] = 'u.is_active = :status';
      $params[':status'] = $status;
    }
  }

  private function applyNameFilter(array $filters, array &$conditions, array &$params): void {
    if (!isset($filters['name']) || !is_string($filters['name'])) {return;}
    $conditions[] = "(p.first_name LIKE :name OR p.last_name LIKE :name)";
    $params[':name'] = '%' . trim($filters['name']) . '%';
  }

  public function updatePerson(array $data){
    try {
      $this->pdo()->beginTransaction();
      $personId = (int)($data['person']['id'] ?? 0);
      if ($personId <= 0) { throw new \Exception('Invalid person id'); }
      unset($data['person']['id']);
      $filter = array("id"=>$personId);
      $sql = $this->buildUpdate("person",$filter, $data['person']);
      $this->prepared($sql, $data['person']);

      if(isset($data['user'])){
        unset($data['user']['id']);
        $existingUser = $this->simple("select id from user where person = ".$personId.";");
        if(!empty($existingUser)){
          $filterUser = array("id"=>(int)$existingUser[0]['id']);
          $sql = $this->buildUpdate("user",$filterUser, $data['user']);
          $this->prepared($sql, $data['user']);
        }else{
          $data['user']['person'] = $personId;
          $this->createUser($data);
        }
      }

      $this->pdo()->commit();
      return ["res"=> 0, "output"=>'your data has been correctly updated'];
    } catch (\Throwable $e) {
      $this->pdo()->rollBack();
      return ["res"=>1, "output"=>$e->getMessage()];
    }
  }

  public function getUsrFromPerson(int $person){
    $sql = "select u.id, u.created, u.is_active, l.id role_id, l.value role from user u inner join list_user_role l on u.role = l.id where u.person = ".$person.";";
    return $this->simple($sql);
  }

  public function getUsrObjects(int $usr){
    $out=[];
    $artifactStatSql = "select id, name, status, description from artifact where author = ".$usr.";";
    $modelStatSql = "SELECT m.id, m.name, m.description, m.status, o.thumbnail, o.create_at FROM model m LEFT JOIN (SELECT o1.* FROM model_object o1 INNER JOIN ( SELECT model, MIN(id) AS obj_id FROM model_object GROUP BY model ) o2 ON o1.id = o2.obj_id ) o ON m.id = o.model where o.author = ".$usr.";";
    $out['artifacts'] = $this->simple($artifactStatSql);
    $out['models'] = $this->simple($modelStatSql);
    return $out;
  }

  public function delPerson(int $id){
    try {
      $this->prepared("delete from person where id = :id", ['id'=>$id]);
      return ["res"=> 0, "output"=>'profile has been deleted'];
    } catch (\Throwable $th) {
      return ["res"=>1, "output"=>$th->getMessage()];
    }
  }
}
