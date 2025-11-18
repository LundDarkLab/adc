<?php
namespace Adc;
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
use \PHPMailer\PHPMailer\PHPMailer;
use \PHPMailer\PHPMailer\SMTP;
use \PHPMailer\PHPMailer\Exception;

class Person extends Conn{
  public $mail;
  function __construct(){
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

    $token = md5($dati['person']['email']).rand(10,9999);
    $tokenData = array("email"=>$dati['person']['email'], "token"=>$token);
    $tokenSql = $this->buildInsert("reset_password", $tokenData);
    $this->prepared($tokenSql, $tokenData);

    $datiMail = array(
      "email"=>$dati['person']['email'], 
      "name"=>$dati['person']['first_name']." ".$dati['person']['first_name'], 
      "link"=>"https://dyncolldev.ht.lu.se/plus/reset_password.php?key=".$token,
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
    }
    $mailParams = parse_ini_file('config/.env');
    if ($mailParams === false) {
      throw new \Exception("Error reading mail configuration file",0);
    }
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

  private function htmlToPlainText($str){
    $str = str_replace('&nbsp;', ' ', $str);
    $str = html_entity_decode($str, ENT_QUOTES | ENT_COMPAT , 'UTF-8');
    $str = html_entity_decode($str, ENT_HTML5, 'UTF-8');
    $str = html_entity_decode($str);
    $str = htmlspecialchars_decode($str);
    $str = strip_tags($str);
    return $str;
  }

  public function getPersons(array $payload=[]): array {
    $filters = [];
    if (!empty($payload['filters'])) {
      if(isset($payload['filters']['id']) && is_int($payload['filters']['id'])) {
        $filters[] = 'p.id = '.$payload['filters']['id'];
      } 
      if(isset($payload['filters']['status']) && is_int($payload['filters']['status'])) {
        if ($payload['filters']['status'] === 3){
          $filters[] = 'u.is_active is null';
        }else{
          $filters[] = 'u.is_active = '.$payload['filters']['status'];
        }
      }
      if(isset($payload['filters']['role']) && is_int($payload['filters']['role'])) {
        $filters[] = 'u.role = '.$payload['filters']['role'];
      }
      if(isset($payload['filters']['institution']) && is_int($payload['filters']['institution'])) {
        $filters[] = 'p.institution = '.$payload['filters']['institution'];
      }
      if(isset($payload['filters']['name']) && is_string($payload['filters']['name'])) {
        $name = trim($payload['filters']['name']);
        $filters[] = "(p.first_name LIKE '%".$name."%' OR p.last_name LIKE '%".$name."%')";
      }
    }
    $where = '';
    if (count($filters) > 0) {
      $where = "WHERE " . join(" AND ", $filters);
    }
    $sql = "SELECT p.id `person_id`, concat(p.last_name, ' ',p.first_name) as `name`, p.email, p.institution `institution_id`, i.name `institution`, p.position `position_id`, position.value `position`, u.id `user_id`, u.is_active `active`, u.role `role_id`, `role`.value as user_class FROM person p left join institution i on i.id = p.institution left join list_person_position position on p.position = position.id left join user u on u.person = p.id left join list_user_role `role` on u.role = `role`.id $where order by 2 ASC;";
    error_log("getPersons sql: $sql");
    return $this->simple($sql);
  }

  // public function getPerson(int $id){
  //   $sql = "select p.id, p.first_name, p.last_name, p.email, p.city, p.address, p.phone, p.institution institution_id, i.name institution, p.position position_id, l.value position from person p left join institution i on p.institution = i.id left join list_person_position l on p.position = l.id where p.id = ".$id.";";
  //   $out=[];
  //   $out['person'] = $this->simple($sql)[0];
  //   $out['user'] = $this->getUsrFromPerson($out['person']['id'])[0];
  //   return $out;
  // }

  // public function getPersons(array $search){
  //   $filters = [];
  //   $search['cat'] = (int) $search['cat'];
  //   switch (true) {
  //     case $search['cat'] == 0:
  //       array_push($filters,'(u.is_active is null or u.is_active > 0)');
  //       break;
  //     case $search['cat'] == 1:
  //     case $search['cat'] == 2:
  //       array_push($filters,'u.is_active = '.$search['cat']);
  //       break;
  //     case $search['cat'] == 3:
  //       array_push($filters,'u.is_active is null');
  //       break;
  //   }
  //   if(isset($search['name'])){
  //     $searchByName = [];
  //     $string = trim($search['name']);
  //     $arrString = explode(" ",$string);
  //     foreach ($arrString as $value) {
  //       if(strlen($value)>3){ 
  //         array_push($searchByName, "first_name like '%".$value."%'"); 
  //         array_push($searchByName, "last_name like '%".$value."%'"); 
  //         array_push($searchByName, "i.name like '%".$value."%'"); 
  //         array_push($searchByName, "list.value like '%".$value."%'"); 
  //         array_push($searchByName, "p.email like '%".$value."%'"); 
  //         array_push($searchByName, "u.role like '%".$value."%'"); 
  //       }
  //     }
  //     array_push($filters, "(".join(" or ", $searchByName).")");
  //   }
  //   $joinFilters = join(" and ", $filters);
  //   $where = "where ".$joinFilters; 
  //   $sql = "select p.id, concat(p.first_name,' ',p.last_name) name, p.email, i.id inst_id, i.name institution, list.value position, u.role, u.is_active, u.artifact, u.model from person p left join institution i on p.institution = i.id left join list_person_position list on p.position = list.id left join user_artifact_view u on u.person_id = p.id ".$where." order by 2 asc;";
  //   return $this->simple($sql);
  // }

  public function updatePerson(array $data){
    // return $data;
    try {
      $this->pdo()->beginTransaction();
      $personId = $data['person']['id'];
      unset($data['person']['id']);
      $filter = array("id"=>$personId);
      $sql = $this->buildUpdate("person",$filter, $data['person']);
      $this->prepared($sql, $data['person']);

      if(isset($data['user'])){
        if(isset($data['user']['id'])){
          $filterUser = array("id"=>$data['user']['id']);
          unset($data['user']['id']);
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
?>
