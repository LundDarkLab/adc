<?php
namespace Adc;
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
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
        "name"=>$dati['first_name']." ".$dati['last_name'], 
        "link"=>getenv("APP_BASE_URL")."/reset_password.php?key=".$token,
        "mailBody"=>1
      );
      $this->person->sendMail($datiMail);
      $this->pdo()->commit();
      return ["res"=> 1, "output"=>'Ok, user has been successfully created.'];
    } catch (\Exception $e) {
      $this->pdo()->rollBack();
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }
  public function addUsrFromPerson(array $dati){
    
  }

  public function changePassword(array $dati){
    try {
      // Usa query parametrizzata per la select
      $sql = "SELECT password_hash FROM user WHERE id = :id;";
      $stmt = $this->pdo()->prepare($sql);
      $stmt->execute([':id' => $dati['id']]);
      $out = $stmt->fetch(\PDO::FETCH_ASSOC);

      if (!$out) {
        throw new \Exception("User not found.", 1);
      }

      $this->checkPwd($dati['curPwd'], $out['password_hash']);

      $pwd = password_hash($dati['password_hash'], PASSWORD_BCRYPT);
      $newdata = array("password_hash" => $pwd, "id" => $dati['id']);
      $sql = "UPDATE user SET password_hash = :password_hash WHERE id = :id";
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

  protected function checkEmail(string $email) {
    $sql = "select u.id, p.id person, p.email, p.institution, u.role, u.password_hash from person p inner join user u on u.person = p.id where p.email = ? and u.is_active = 1;";
    
    $pdo = $this->pdo(); 
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$email]);
    $out = $stmt->fetchAll(\PDO::FETCH_ASSOC);

    $x = count($out);
    if ($x == 0) { 
      throw new \Exception("Account not available.", 1); 
    }
    return $out[0];
}

  protected function checkPwd($toVerify,$hash){
    if (!password_verify($toVerify,$hash)) { throw new \Exception("The password is incorrect, please try again or request a new password", 1); }
    return true;
  }

  // protected function checkResetRequest(string $email){
  //   $sql = "select * from reset_password where email = :email;";
  //   $out = $this->pdo()->prepare($sql);
  //   $out->execute(["email"=>$email]);
  //   $out = $out->fetchAll(\PDO::FETCH_ASSOC);
  //   $x = count($out);
  //   if ($x > 0) { throw new \Exception("Sorry, but there is already an active request for this email.<br>If you did not receive the email with the link to reset your password, please search in spam or contact the system administrator: giuseppe.naponiello@ark.lu.se", 1); }
  //   return $out[0];
  // }

  protected function checkResetRequest(string $email) {
    $sql = "SELECT * FROM reset_password WHERE email = :email LIMIT 1";
    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute(["email" => $email]);
    $request = $stmt->fetch(\PDO::FETCH_ASSOC);
    // Se $request non è false, significa che esiste già una richiesta
    if ($request) {
      throw new \Exception(
        "Sorry, but there is already an active request for this email.<br>" .
        "If you did not receive the email, please search in spam or contact: " .
        "giuseppe.naponiello@ark.lu.se", 
        1
      );
    }
    return null; 
  }

  public function checkToken(string $token){
    try {
      $sql = "select * from reset_password where token = '".$token."';";
      $out = $this->simple($sql);
      if (count($out) == 0) { throw new \Exception("Sorry, but your token is expired! Please try requesting a new password again", 0); }
      return ["res"=> 1, "output"=>$out[0]];
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
    }
    return $out[0];
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
      return ["Ok, you are logged-in!",0];
    } catch (\Exception $e) {
      return [$e->getMessage(), $e->getCode()];
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


  public function rescuePwd(string $email){
    try {
      // check if email exists and if it's active, and get user id
      $usr = $this->checkEmail($email);
      $this->checkResetRequest($email);
      // create a token to sent
      $token = $this->genToken($email);
      // save request in reset_password table
      $resArr = array("email" => $email, "token" => $token);
      $sql = $this->buildInsert("reset_password", $resArr);
      $res = $this->pdo()->prepare($sql);
      $res->execute($resArr);
      // send an email with link
      $datiMail=array(
        "email"=>$email, 
        "name"=>$usr['name'], 
        "link"=>getenv("APP_BASE_URL")."/reset_password.php?key=".$token, 
        "mailBody"=>2
      );
      $this->person->sendMail($datiMail);
      return ["res" => 1, "output"=>"A reset link has been sent to provided email. The link will expires in 1 day"];
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
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
      $res = $this->pdo()->prepare($sql);
      $res->execute($array);
      
      $array = array( "token"=>$dati['token'], "email"=>$dati['email']);
      $sql = "delete from reset_password where token = :token and email = :email;";
      $res = $this->pdo()->prepare($sql);
      $res->execute($array);

      $this->pdo()->commit();
      return ["res"=>1, "output" => 'Your password has been successfully reset, you can now log in.'];
    } catch (\Exception $e) {
      $this->pdo()->rollBack();
      return ["res"=>0, "output"=>$e->getMessage()];
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
      $this->mail->CharSet = 'UTF-8';
      $this->mail->Encoding = 'base64';

      $this->mail->setFrom($mailParams['MAILSETFROM'], $mailParams['MAILSETFROMNAME']);
      $this->mail->Subject = $dati['object'];

      $this->mail->isHTML(true);
      $this->mail->Body = $dati['body'];

      $this->mail->AltBody = $this->htmlToPlainText($dati['body']);
      foreach ($dati['recipients'] as $recipient) { $this->mail->addBCC($recipient, $recipient);}
      
      if(!$this->mail->send()){
        throw new \Exception('Mailer Error: '. $this->mail->ErrorInfo,0);
      }
      return ["error" => 0, "message" => "Email has been sent correctly"];
    } catch (\Throwable $th) {
      return ["error"=>1, "message"=>$th->getMessage()];
    }
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
