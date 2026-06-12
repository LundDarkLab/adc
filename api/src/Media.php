<?php
namespace Adc;

use Adc\Config;
use Adc\File;
class Media extends Conn {
  private File $file;

  public function __construct() {
    $this->file = new File();
  }

  private function mediaQuery(){
    return "select f.id file, f.artifact, file.id filetype, file.value type, f.path, f.url, f.text, f.downloadable, l.id license_id, l.license, l.acronym, l.link, l.file deed from files f left join license l on f.license = l.id left join list_file_type file on f.filetype = file.id"
    ;
  }

  public function getAllMedia(int $id){
    $sql = $this->mediaQuery()." where f.artifact = :id;";
    $sttmt = $this->pdo()->prepare($sql);
    $sttmt->execute(['id' => $id]);
    return $sttmt->fetchAll(\PDO::FETCH_ASSOC);
  }


  /**
   * Normalizza e prepara i dati prima di insert/update.
   *
   * @param array &$data  Dati del form passati per riferimento: vengono modificati
   *                      direttamente (estrazione da $data['files'], conversione '' → null,
   *                      risoluzione filetype, aggiunta path dopo upload).
   * @param mixed  $file  Array $_FILES o null. Passato per valore: le riassegnazioni
   *                      interne non si propagano al chiamante.
   */
  private function prepareMediaData(array &$data, $file): void {
    if (isset($data['files']) && is_array($data['files'])) {
      $data = $data['files'];
    }
    // Converti stringhe vuote in null per i campi nullable
    foreach (['url', 'text', 'license', 'path'] as $field) {
      if (isset($data[$field]) && $data[$field] === '') {
        $data[$field] = null;
      }
    }
    if (empty($data['filetype']) && !empty($data['type'])) {
      $typeMap = ['image' => 1, 'document' => 2, 'video' => 3, 'reference' => 4, 'link' => 5];
      $data['filetype'] = $typeMap[$data['type']] ?? 1;
    }
    if ($file) {
      if (isset($file['files']['name']['path'])) {
        $file = [
          'name'     => $file['files']['name']['path'],
          'type'     => $file['files']['type']['path'],
          'tmp_name' => $file['files']['tmp_name']['path'],
          'error'    => $file['files']['error']['path'],
          'size'     => $file['files']['size']['path'],
        ];
      } elseif (isset($file['path']) && is_array($file['path'])) {
        $file = $file['path'];
      } else {
        $file = null;
      }
    }
    if (!empty($file)) {
      $folder = Config::dir($data['type']);
      $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
      $name = $this->file->uuid . '.' . $ext;
      $data['path'] = $name;
      $this->file->upload($file, $folder, $name, $data['filetype']);
    }
  }

  public function addMedia($data, $file=null){
    try {
      $this->prepareMediaData($data, $file);
      $sql = $this->buildInsert("files", $data);
      $this->prepared($sql, $data);
      return ["error"=> 0, "output"=>'Ok, the media has been added successfully'];
    } catch (\Exception $e) {
      return ["error"=>1, "output"=>$e->getMessage()];
    }
  }

  public function editMedia(array $data, $file=null){
    try {
      $current = $this->getMedia(['file' => $data['files']['id'] ?? $data['id']]);
      if (!empty($data['files']['deleteFile'])) {
        if (!empty($current['path'])) {
          $folder = Config::dir($current['type']);
          $this->file->deleteFile($folder . $current['path']);
        }
        $data['files']['path'] = null;
        unset($data['files']['deleteFile']);
      }
      // Assicura che type sia sempre disponibile per upload e buildUpdate
      if (empty($data['files']['type'])) {
        $data['files']['type'] = $current['type'];
      }
      // Se viene caricato un nuovo file, elimina il vecchio
      if (!empty($file) && !empty($current['path'])) {
        $folder = Config::dir($current['type']);
        $this->file->deleteFile($folder . $current['path']);
      }
      $this->prepareMediaData($data, $file);
      $sql = $this->buildUpdate("files", ['id'=>$data['id']], $data);
      $this->prepared($sql, $data);
      return ["error"=> 0, "output"=>'Ok, the media has been updated successfully'];
    } catch (\Exception $e) {
      return ["error"=>1, "output"=>$e->getMessage()];
    }
  }

  public function deleteMedia(array $dati): array {
    // return ["error"=> 0, "output"=>$dati['media']['path']];
    try {
      if(isset($dati['media']['path']) && !empty($dati['media']['path'])){
        $file = Config::dir($dati['media']['type']) . $dati['media']['path'];
        $res = $this->file->deleteFile($file);
        if($res['error'] === 1){ throw new \Exception($res['output'], 1); }
      }
      $sql = "delete from files where id = :id;";
      $this->prepared($sql,["id"=>$dati['media']['file']]);
      return ["error"=> 0, "output"=>'Ok, the media has been successfully removed.'];
    } catch (\Throwable $th) {
      return ["error"=>1, "output"=>$th->getMessage()];
    }
  }

  public function getMedia(array $data):array {
    $file = (int) $data['file'];
    $sql = $this->mediaQuery()." where f.id = :file;";
    $sttmt = $this->pdo()->prepare($sql);
    $sttmt->execute(['file' => $file]);
    $result = $sttmt->fetch(\PDO::FETCH_ASSOC);
    return $result ?: [];
  }

  /**
   * Verifica disponibilità e content-type di un URL esterno.
   * Esposto come metodo pubblico per essere chiamato dall'endpoint API.
   *
   * @return array { available: bool, status_code: int, content_type: string|null }
   * @throws \Exception se l'URL non è valido o punta a risorse interne
   */
  public function checkExternalUrl(array $data): array {
    $url = $data['url'] ?? '';
    $this->validateUrl($url);
    error_log("Checking external URL: $url");
    return $this->checkUrl($url);
  }

  public function getArtifactMedia(int $artifactId): array {
    $sql = "SELECT id, artifact, filetype, url FROM media WHERE artifact = ?";
    $stmt = $this->conn->prepare($sql);
    $stmt->execute([$artifactId]);
    return $stmt->fetchAll(\PDO::FETCH_ASSOC);
  }

  /**
   * Prova HEAD, se riceve 405 riprova con GET.
   */
  private function checkUrl(string $url): array {
    $result = $this->makeRequest($url, 'HEAD');
    if ($result['status_code'] === 405) {
      $result = $this->makeRequest($url, 'GET');
    }
    return $result;
  }

    /**
   * Esegue la richiesta HTTP con cURL.
   */
  private function makeRequest(string $url, string $method): array {
    $ch = curl_init($url);

    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_NOBODY         => ($method === 'HEAD'),
      CURLOPT_CUSTOMREQUEST  => $method,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_MAXREDIRS      => 5,
      CURLOPT_TIMEOUT        => 10,
      CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; MediaChecker/1.0)',
      CURLOPT_SSL_VERIFYPEER => true,
    ]);

    curl_exec($ch);

    $statusCode  = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: null;
    $error       = curl_error($ch);

    curl_close($ch);

    if ($error) {
      return ['available' => false, 'status_code' => 0, 'content_type' => null];
    }

    $cleanContentType = $contentType
      ? trim(explode(';', $contentType)[0])
      : null;

    return [
      'available'    => $statusCode >= 200 && $statusCode < 400,
      'blocked'      => $statusCode === 999 || $statusCode === 403,
      'status_code'  => $statusCode,
      'content_type' => $cleanContentType,
    ];
  }

    /**
   * Validazione sintattica + SSRF prevention.
   *
   * @throws \Exception
   */
  private function validateUrl(string $url): void {
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
      throw new \Exception('Invalid URL format.');
    }
    $host = parse_url($url, PHP_URL_HOST);
    if (!$host) {
      throw new \Exception('Unable to parse URL host.');
    }
    $ip = gethostbyname($host);

    // gethostbyname restituisce l'hostname invariato se non riesce a risolverlo
    if ($ip === $host) {
      throw new \Exception('Unable to resolve host.');
    }

    $isPrivate = filter_var($ip, FILTER_VALIDATE_IP, [
      'flags' => FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    ]) === false;

    if ($isPrivate || $ip === '127.0.0.1' || $ip === '::1') {
      throw new \Exception('URL not allowed.');
    }
  }
}
