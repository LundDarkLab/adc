<?php
namespace Adc;
use \PHPMailer\PHPMailer\PHPMailer;

class MailService extends Conn {
  public PHPMailer $mail;

  public function __construct() {
    $this->mail = new PHPMailer(true);
  }

  public function sendMail(array $dati) {
    $titolo = '';
    $body = '';

    if ($dati['mailBody'] === 1) {
      $titolo = "New account";
      $body = file_get_contents('config/mailBody/newUser.html');
      $body = str_replace('%name%', $dati['name'], $body);
      $body = str_replace('%link%', $dati['link'], $body);
    } elseif ($dati['mailBody'] === 2) {
      $titolo = "Reset my password";
      $body = file_get_contents('config/mailBody/rescuePwd.html');
      $body = str_replace('%name%', $dati['name'], $body);
      $body = str_replace('%link%', $dati['link'], $body);
    } else {
      throw new \InvalidArgumentException('Invalid mailBody value');
    }

    $mailParams = Config::mailParams();
    $this->mail->isSMTP();
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
      throw new \Exception('Mailer Error: '. $this->mail->ErrorInfo, 0);
    }
    return true;
  }

  public function sendCustomMail(array $dati): array {
    try {
      $mailParams = Config::mailParams();
      $this->mail->isSMTP();
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

      foreach ($dati['recipients'] as $recipient) { $this->mail->addBCC($recipient, $recipient); }
      if (!$this->mail->send()) { throw new \Exception('Mailer Error: '. $this->mail->ErrorInfo, 0); }
      return ["error" => 0, "message" => "Email has been sent correctly"];
    } catch (\Throwable $th) {
      return ["error" => 1, "message" => $th->getMessage()];
    }
  }

  public function fetchMailTemplate(string $type): array {
    try {
      $templates = $this->simple("select * from mail_template where type = '$type' order by object asc;");
      return ["error" => 0, "message" => "ok, email templates fetched", "templates" => $templates];
    } catch (\Throwable $th) {
      return ["error" => 1, "message" => $th->getMessage(), "dati" => $type];
    }
  }

  private function htmlToPlainText(string $str): string {
    $str = str_replace('&nbsp;', ' ', $str);
    $str = html_entity_decode($str, ENT_QUOTES | ENT_COMPAT, 'UTF-8');
    $str = html_entity_decode($str, ENT_HTML5, 'UTF-8');
    $str = html_entity_decode($str);
    $str = htmlspecialchars_decode($str);
    $str = strip_tags($str);
    return $str;
  }
}
