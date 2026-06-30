<?php
namespace Adc;
session_start();
use \Adc\Person;
use \Adc\MailService;
class User extends Conn{
  protected MailService $mailer;
  public Person $person;
  public function __construct(){
    $this->mailer = new MailService();
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
      $tokenData = array("email"=>$dati['email'], "token"=>$this->hashToken($token));
      $tokenSql = $this->buildInsert("reset_password", $tokenData);
      $this->prepared($tokenSql, $tokenData);

      $datiMail = array(
        "email"=>$dati['email'],
        "name"=>$dati['first_name']." ".$dati['last_name'],
        "link"=>"https://dyncoll.ht.lu.se/reset_password.php?key=".$token,
        "mailBody"=>1
      );
      $this->mailer->sendMail($datiMail);
      $this->pdo()->commit();
      return ["res"=> 1, "output"=>'Ok, user has been successfully created.'];
    } catch (\Exception $e) {
      $this->pdo()->rollBack();
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }
  public function addUsrFromPerson(array $dati){
    // This function is used to create a user from an existing person, it is used when a user is created from the person view page
  }

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
    $sql = "select count(*) tot from user where role = :role;";
    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute([':role' => 1]);
    $res = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    return $res[0]['tot'];
  }

  protected function checkEmail(string $email){
    $sql = "select u.id, p.id person, concat(coalesce(p.first_name,''),' ',coalesce(p.last_name,'')) as name, p.email, p.institution, u.role, u.password_hash from person p inner join user u on u.person = p.id where p.email = :email and u.is_active = 1;";
    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute([':email' => $email]);
    $out = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $x = count($out);
    if ($x == 0) { throw new \Exception("The email is not in the database or your account is disabled. Please try again, if the problem persists please contact the project manager", 1); }
    return $out[0];
  }

  protected function checkPwd(string $toVerify, string $hash){
    if (!password_verify($toVerify,$hash)) { throw new \Exception("The password is incorrect, please try again or request a new password", 1); }
    return true;
  }

  protected function checkResetRequest(string $email){
    // Controlla se esiste una richiesta attiva (non scaduta)
    $sql = "SELECT * FROM reset_password WHERE email = :email AND exp_date > DATE_SUB(NOW(), INTERVAL 1 DAY)";
    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute([':email' => $email]);
    $activeRequests = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    
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
    // Cerca token VALIDI (non scaduti); confronta l'hash SHA-256 del token ricevuto
    $tokenHash = $this->hashToken($payload['token']);
    $sql = "SELECT * FROM reset_password WHERE token = :token AND exp_date > now();";
    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute([':token' => $tokenHash]);
    $out = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    // Se non trova nessun record, il token è scaduto o non esiste
    if (empty($out)) {
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

  protected function genToken(string $email){ return bin2hex(random_bytes(24)); }

  private function hashToken(string $token): string { return hash('sha256', $token); }

  public function getUsers(){
    $sql="select * from user_artifact_view order by name asc;";
    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll(\PDO::FETCH_ASSOC);
  }

  public function activeUsers(?int $institution = null, ?int $role = null, ?string $string = null){
    $filters = ["user.is_active = true", "person.institution is not null"];
    if($institution !== null){$filters[]="person.institution = ".$institution;}
    if($role !== null){$filters[]="user.role = = ".$role;}
    if($string !== null){$filters[]="(person.first_name like '%".$string."%' or person.last_name like '%".$string."%' or person.email like '%".$string."%')";}

    $conditions = implode(" and ",$filters);

    $sql = "select concat(person.first_name,' ', person.last_name) user, person.email, person.institution, user.role from person inner join user on user.person = person.id where ".$conditions." order by 1,2 asc;";

    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll(\PDO::FETCH_ASSOC);
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
      $resArr = array("email" => $dati['email'], "token" => $this->hashToken($token));
      $sql = $this->buildInsert("reset_password", $resArr);
      $this->prepared($sql, $resArr);
      $datiMail=array(
        "email"=>$dati['email'],
        "name"=>$usr['name'],
        "link"=>"https://dyncoll.ht.lu.se/reset_password.php?key=".$token,
        "mailBody"=>2
      );
      $this->mailer->sendMail($datiMail);
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
      
      $array = array( "token"=>$this->hashToken($dati['token']), "email"=>$dati['email']);
      $sql = "delete from reset_password where token = :token and email = :email;";
      $this->prepared($sql, $array);

      $this->pdo()->commit();
      return ["error"=>0, "output" => 'Your password has been successfully reset, you can now log in.'];
    } catch (\Exception $e) {
      $this->pdo()->rollBack();
      return ["error"=>1, "output"=>$e->getMessage()];
    }
  }

}
