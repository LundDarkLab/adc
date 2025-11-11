<?php
namespace Adc;
session_start();
use \Adc\Person;
use \PHPMailer\PHPMailer\PHPMailer;
use \PHPMailer\PHPMailer\SMTP;
use \PHPMailer\PHPMailer\Exception;

class User extends Conn{
  public $mail;
  public $person;
  function __construct(){
    $this->mail = new PHPMailer(true);
    $this->person = new Person();
  }

  public function roleList(){
    return $this->simple("select id, value from list_user_role order by value asc;");
  }

  public function  usersList($filters=[]){
    $where = isset($filters['institution']) ? " where p.institution = ".$filters['institution'] : "";
    $sql="select u.id, concat(p.first_name, ' ', p.last_name) as name, p.institution FROM user u JOIN person p ON u.person = p.id ".$where." ORDER BY name asc;";
    error_log("usersList query: ".$sql);
    return $this->simple($sql);
  }

  public function addUser(array $dati){
    try {
      $this->pdo()->beginTransaction();
      $usr = array(
        "role"=>$dati['role'],
        "is_active"=>$dati['is_active']
      );
      unset($dati['role'],$dati['is_active']);
      
      $personSql = $this->buildInsert("person", $dati);
      $this->prepared($personSql, $dati); 
      $personId = $this->pdo()->lastInsertId();
      $usr['person']=$personId;
      $userSql = $this->buildInsert("user", $usr);
      $this->prepared($userSql, $usr);

      $token = $this->genToken($dati['email']);
      $tokenData = array("email"=>$dati['email'], "token"=>$token);
      $tokenSql = $this->buildInsert("reset_password", $tokenData);
      $this->prepared($tokenSql, $tokenData);

      $datiMail = array(
        "email"=>$dati['email'], 
        "name"=>$dati['first_name']." ".$dati['first_name'], 
        "link"=>"https://dyncolldev.ht.lu.se/plus/reset_password.php?key=".$token,
        "mailBody"=>1
      );
      $this->sendMail($datiMail);
      $this->pdo()->commit();
      return ["res"=> 1, "output"=>'Ok, user has been successfully created.'];
    } catch (\Exception $e) {
      $this->pdo()->rollBack();
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }
  public function addUsrFromPerson(array $dati){}

  public function changePassword(array $dati){
    try {
      $sql = "select password_hash from user where id = ".$dati['id'].";";
      $out = $this->simple($sql);
      $this->checkPwd($dati['curPwd'],$out[0]['password_hash']);
      $pwd = password_hash($dati['password_hash'], PASSWORD_BCRYPT);
      $newdata = array("password_hash"=>$pwd, "id"=>$dati['id']);
      $sql = "update user set password_hash = :password_hash where id = :id";
      $this->prepared($sql, $newdata);
      return ["res"=> 1, "output"=>'Ok, password has been succesfully modified'];
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }

  public function checkAdmin(){
    $sql = "select count(*) tot from user;";
    $res = $this->simple($sql);
    return $res[0]['tot'];
  }

  protected function checkEmail(string $email){
    $sql = "select u.id, p.id person, concat(coalesce(p.first_name,''),' ',coalesce(p.last_name,'')) as name, p.email, p.institution, u.role, u.password_hash from person p inner join user u on u.person = p.id where p.email = '".$email."' and u.is_active = 1;";
    $out = $this->simple($sql);
    $x = count($out);
    if ($x == 0) { throw new \Exception("The email is not in the database or your account is disabled. Please try again, if the problem persists please contact the project manager", 1); }
    return $out[0];
  }

  protected function checkPwd($toVerify,$hash){
    if (!password_verify($toVerify,$hash)) { throw new \Exception("The password is incorrect, please try again or request a new password", 1); }
    return true;
  }

  protected function checkResetRequest(string $email){
    // Controlla se esiste una richiesta attiva (non scaduta) 
    $sql = "SELECT * FROM reset_password WHERE email = '" . $email . "' AND exp_date > DATE_SUB(NOW(), INTERVAL 1 DAY)";
    $activeRequests = $this->simple($sql);
    
    if (count($activeRequests) > 0) { 
        throw new \Exception("Sorry, but there is already an active request for this email.<br>If you did not receive the email with the link to reset your password, please search in spam or contact the system administrator: giuseppe.naponiello@ark.lu.se", 1); 
    }
    
    // Elimina eventuali richieste scadute
    $params = ["email" => $email];
    $sql = "DELETE FROM reset_password WHERE email = :email AND exp_date <= DATE_SUB(NOW(), INTERVAL 1 DAY)";
    $this->prepared($sql, $params);
    
    return true;
  }

  public function checkToken(array $payload){
    // Cerca token VALIDI (non scaduti)
    $sql = "SELECT * FROM reset_password WHERE token = '".$payload['token']."' and exp_date > now();";
    $out = $this->simple($sql);
    error_log("checkToken query: ".$sql);
    error_log("checkToken count:".count($out));
    // Se non trova nessun record, il token è scaduto o non esiste
    if (count($out) == 0) { 
        throw new \Exception("Sorry, but your token is expired or invalid! Please try requesting a new password again", 1); 
    }
    
    // Se trova il record, il token è valido - restituisce i dati
    return ["error" => 0, "output" => $out[0]];
  }

  public function genPwd(){
    $pwd = "";
    $pwdRand = array_merge(range('A','Z'),range('a','z'),range(0,9),['*','%','$','#','@','!','+','?','.']);
    for($i=0; $i < 16; $i++) {$pwd .= $pwdRand[array_rand($pwdRand)];}
    return str_shuffle($pwd);
  }

  protected function genToken(string $email){ return md5($email).rand(10,9999); }

  public function getUsers(){
    $sql="select * from user_artifact_view order by name asc;";
    return $this->simple($sql);
  }

  public function activeUsers(?int $institution = null, ?int $role = null, ?string $string = null){
    $filters = ["user.is_active = true", "person.institution is not null"];
    if($institution !== null){$filters[]="person.institution = ".$institution;}
    if($role !== null){$filters[]="user.role = = ".$role;}
    if($string !== null){$filters[]="(person.first_name like '%".$string."%' or person.last_name like '%".$string."%' or person.email like '%".$string."%')";}

    $conditions = implode(" and ",$filters);

    $sql = "select concat(person.first_name,' ', person.last_name) user, person.email, person.institution, user.role from person inner join user on user.person = person.id where ".$conditions." order by 1,2 asc;";

    return $this->simple($sql);
  }

  public function login(array $dati){
    try {
      $usr = $this->checkEmail($dati['email']);
      $this->checkPwd($dati['password'],$usr['password_hash']);
      $this->setSession($usr);
      return ["output"=>"Ok, you are logged-in!", "res"=>0];
    } catch (\Exception $e) {
      return ["output"=>$e->getMessage(), "res"=>$e->getCode()];
    }
  }

  private function setSession(array $dati){
    $_SESSION['id'] = $dati['id'];
    $_SESSION['person'] = $dati['person'];
    $_SESSION['role'] = $dati['role'];
    $_SESSION['email'] = $dati['email'];
    $_SESSION['institution'] = $dati['institution'];
    return true;
  }


  public function rescuePwd(array $dati){
    try {
      $usr = $this->checkEmail($dati['email']);
      $this->checkResetRequest($dati['email']);
      $token = $this->genToken($dati['email']);
      $resArr = array("email" => $dati['email'], "token" => $token);
      $sql = $this->buildInsert("reset_password", $resArr);
      $this->prepared($sql, $resArr);
      $datiMail=array(
        "email"=>$dati['email'], 
        "name"=>$usr['name'], 
        "link"=>"https://dyncolldev.ht.lu.se/plus/reset_password.php?key=".$token, 
        "mailBody"=>2
      );
      $this->sendMail($datiMail);
      return ["error" => 0, "output"=>"A reset link has been sent to provided email. The link will expires in 1 day"];
    } catch (\Exception $e) {
      return ["error"=>1, "output"=>$e->getMessage()];
    }
  }

  public function resetPassword(array $dati){
    try {
      $this->pdo()->beginTransaction();
      $array = array(
        "email" => $dati['email'],
        "password_hash" => password_hash($dati['password_hash'], PASSWORD_BCRYPT)
      );
      $sql = "update person, user set user.password_hash = :password_hash where user.person = person.id and person.email = :email";
      $this->prepared($sql, $array);
      
      $array = array( "token"=>$dati['token'], "email"=>$dati['email']);
      $sql = "delete from reset_password where token = :token and email = :email;";
      $this->prepared($sql, $array);

      $this->pdo()->commit();
      return ["error"=>0, "output" => 'Your password has been successfully reset, you can now log in.'];
    } catch (\Exception $e) {
      $this->pdo()->rollBack();
      return ["error"=>1, "output"=>$e->getMessage()];
    }
  }

  public function fetchMailTemplate(string $type) :array{
    try {
      $templates = $this->simple("select * from mail_template where type = '$type' order by object asc;");
      return ["error" => 0, "message" => "ok, email templates fetched", "templates"=>$templates];
    } catch (\Throwable $th) {
      return ["error"=>1, "message"=>$th->getMessage(), "dati"=>$type];
    }
  }

  public function createRecord(array $post){
    try {
      $post['values']['created_by'] = $_SESSION['id'];
      $this->create($post['table'], $post['values']);
      return ["error"=>0, "message" => "Record has been successfully created", "post"=>$post];
    } catch (\Throwable $th) {
      return ["error"=>1, "message"=>$th->getMessage(), "dati"=>$post];
    }
  }

  public function readRecord(array $post) :array{
    try {
      $items = $this->read($post['table'],$post['conditions']);
      return ["error"=>0, "items" => $items];
    } catch (\Throwable $th) {
      return ["error"=>1, "message"=>$th->getMessage(), "dati"=>$post];
    }
  }

  public function updateRecord(array $post){
    try {
      $this->update($post['table'], $post['values'], $post['conditions']);
      return ["error"=>0, "message" => "Record has been successfully updated", "post"=>$post];
    } catch (\Throwable $th) {
      return ["error"=>1, "message"=>$th->getMessage(), "dati"=>$post];
    }
  }

  public function deleteRecord(array $post) :array{
    try {
      return $this->delete($post['table'],$post['conditions']);
    } catch (\Throwable $th) {
      return ["error"=>1, "message"=>$th->getMessage(), "dati"=>$post];
    }
  }


  public function sendCustomMail(array $dati) :array{
    try {
      $mailParams = parse_ini_file('config/.env');
      if ($mailParams === false) {throw new \Exception("Error reading mail configuration file",1);}
      $this->mail->isSMTP();
      // only for testing, print messages only in the console, do not use in production!!!!
      //$this->mail->SMTPDebug = SMTP::DEBUG_SERVER; 
    
      $this->mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
      $this->mail->SMTPAuth = true;
      $this->mail->Host = $mailParams['MAILHOST'];
      $this->mail->Port = $mailParams['MAILPORT'];
      $this->mail->Username = $mailParams['MAILUSER'];
      $this->mail->Password = $mailParams['MAILPASSWORD'];
      $this->mail->setFrom($mailParams['MAILSETFROM'], $mailParams['MAILSETFROMNAME']);
      
      $this->mail->CharSet = 'UTF-8';
      $this->mail->Encoding = 'base64';
      $this->mail->Subject = $dati['object'];
      $this->mail->Body = $dati['body'];
      $this->mail->AltBody = $this->htmlToPlainText($dati['body']);

      foreach ($dati['recipients'] as $recipient) { $this->mail->addBCC($recipient, $recipient);}
      if(!$this->mail->send()){throw new \Exception('Mailer Error: '. $this->mail->ErrorInfo,0);}
      return ["error" => 0, "message" => "Email has been sent correctly"];
    } catch (\Throwable $th) {
      return ["error"=>1, "message"=>$th->getMessage()];
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
}
?>
