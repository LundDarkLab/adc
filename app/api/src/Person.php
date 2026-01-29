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

  public function addPerson(array $dati){
    try {
      $pdo = $this->pdo();
      $pdo->beginTransaction();
      $sql = $this->buildInsert("person", $dati['person']);
      $sttmt = $pdo->prepare($sql);
      $sttmt->execute($dati['person']);
      $lastId = $pdo->lastInsertId();
      if(isset($dati['user'])){
        $dati['user']['person'] = $lastId;
        $this->createUser($dati);
      }
      $pdo->commit();
      return ["res"=> 0, "output"=>'Ok, the item has been successfully created'];
    } catch (\Throwable $e) {
      $pdo->rollBack();
      return ["res"=>1, "output"=>$e->getMessage()];
    }
  }

  public function createUser(array $dati){
    $pdo = $this->pdo();
    try {
        $sql = $this->buildInsert("user", $dati['user']);
        $sttmt = $pdo->prepare($sql);
        $sttmt->execute($dati['user']);

        $token = md5($dati['person']['email']).rand(10,9999);
        $tokenData = array("email"=>$dati['person']['email'], "token"=>$token);
        $tokenSql = $this->buildInsert("reset_password", $tokenData);
        $sttmtToken = $pdo->prepare($tokenSql);
        $sttmtToken->execute($tokenData);

        $datiMail = array(
            "email"=>$dati['person']['email'], 
            "name"=>$dati['person']['first_name']." ".$dati['person']['last_name'], 
            "link"=>getenv('APP_BASE_URL')."/reset_password.php?key=".$token,
            "mailBody"=>1
        );
        $this->sendMail($datiMail); // se qui c'è errore, catch lo intercetta sopra
        return true;
    } catch (\Throwable $e) {
        throw $e; // Propaga l'errore a addPerson
    }
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

    $mailParams = array(
      'MAILHOST' => getenv('MAILHOST'),
      'MAILPORT' => getenv('MAILPORT'),
      'MAILUSER' => getenv('MAILUSER'),
      'MAILPASSWORD' => getenv('MAILPASSWORD'),
      'MAILSETFROM' => getenv('MAILSETFROM'),
      'MAILSETFROMNAME' => getenv('MAILSETFROMNAME')
    );
    foreach ($mailParams as $key => $value) {
      if($value === false || $value === null){
        throw new \Exception('Mail parameter '.$key.' is not set',0);
      }
    }
    $this->mail->isSMTP();
    // only for testing, print messages only in the console, do not use in production!!!!
    // $this->mail->SMTPDebug = SMTP::DEBUG_SERVER; 
    $this->mail->Debugoutput = function($str, $level) { error_log("PHPMailer: $str"); };
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

  public function getPerson(int $id){
    $out=[];
    $sql = "select p.first_name, p.last_name, p.email, i.id institution_id, i.name institution, position.id position_id, position.value position from person p inner join institution i on p.institution = i.id inner join list_person_position position ON p.position = position.id where p.id = :id";
    $res = $this->pdo()->prepare($sql);
    $res->execute([':id' => $id]);
    $out['person'] = $res->fetch(\PDO::FETCH_ASSOC);

    $sql = "select u.id, u.created_at, u.is_active, l.id role_id, l.value role from user u inner join list_user_role l on u.role = l.id where u.person = :person"; 
    $res = $this->pdo()->prepare($sql);
    $res->execute([':person' => $id]);
    $out['user'] = $res->fetch(\PDO::FETCH_ASSOC);

    return $out;
  }

  public function getPersons(array $search){
    $filters = [];
    $search['cat'] = (int) $search['cat'];
    switch (true) {
      case $search['cat'] == 0:
        array_push($filters,'(u.is_active is null or u.is_active > 0)');
        break;
      case $search['cat'] == 1:
      case $search['cat'] == 2:
        array_push($filters,'u.is_active = '.$search['cat']);
        break;
      case $search['cat'] == 3:
        array_push($filters,'u.is_active is null');
        break;
    }
    if(isset($search['name'])){
      $searchByName = [];
      $string = trim($search['name']);
      $arrString = explode(" ",$string);
      foreach ($arrString as $value) {
        if(strlen($value)>3){ 
          array_push($searchByName, "first_name like '%".$value."%'"); 
          array_push($searchByName, "last_name like '%".$value."%'"); 
          array_push($searchByName, "i.name like '%".$value."%'"); 
          array_push($searchByName, "list.value like '%".$value."%'"); 
          array_push($searchByName, "p.email like '%".$value."%'"); 
          array_push($searchByName, "u.role like '%".$value."%'"); 
        }
      }
      array_push($filters, "(".join(" or ", $searchByName).")");
    }
    $joinFilters = join(" and ", $filters);
    $where = "where ".$joinFilters; 
    $sql = "select p.id, concat(p.first_name,' ',p.last_name) name, p.email, i.id inst_id, i.name institution, list.value position, u.role, u.is_active, u.artifact, u.model from person p left join institution i on p.institution = i.id left join list_person_position list on p.position = list.id left join user_artifact_view u on u.person_id = p.id ".$where." order by 2 asc;";
    return $this->simple($sql);
  }

  public function updatePerson(array $data){
    try {
      $this->pdo()->beginTransaction();
      $personId = $data['person']['id'];
      unset($data['person']['id']);
      $filter = array("id"=>$personId);
      $sql = $this->buildUpdate("person",$filter, $data['person']);
      $res = $this->pdo()->prepare($sql);
      $res->execute($data['person']);

      if(isset($data['user'])){
        if(isset($data['user']['id'])){
          $filterUser = array("id"=>$data['user']['id']);
          unset($data['user']['id']);
          $sql = $this->buildUpdate("user",$filterUser, $data['user']);
          $res = $this->pdo()->prepare($sql);
          $res->execute($data['user']);
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
    $sql = "select u.id, u.created_at, u.is_active, l.id role_id, l.value role from user u inner join list_user_role l on u.role = l.id where u.person = ".$person.";";
    return $this->simple($sql);
  }

  public function getUsrObjects(int $usr){
    $out=[];
    $artifactStatSql = "select id, name, status, description from artifact where author = :id;";
    $res = $this->pdo()->prepare($artifactStatSql);
    $res->execute([':id' => $usr]);
    $out['artifacts'] = $res->fetchAll(\PDO::FETCH_ASSOC);

    $modelStatSql = "SELECT id, name, description, status, thumbnail, create_at FROM model where created_by = :id;";
    $res = $this->pdo()->prepare($modelStatSql);
    $res->execute([':id' => $usr]);
    $out['models'] = $res->fetchAll(\PDO::FETCH_ASSOC);
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
