<?php
namespace Adc;
use Ramsey\Uuid\Uuid;

$tmpDir = $_SERVER['DOCUMENT_ROOT'].'/archive/tmp/';
if (!is_dir($tmpDir)) { mkdir($tmpDir, 0777, true); }
ini_set('upload_tmp_dir', $tmpDir);

class File extends Conn{
  public $uuid;
  public $imageDir;
  public $documentDir;
  public $logoDir;
  public $name;

  public $imageAllowed = array(
    'png' => 'image/png',
    'jpe' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'jpg' => 'image/jpeg', 
  );
  public $documentAllowed = array(
    'pdf' => 'application/pdf',
    'doc' => 'application/msword',
    'odt' => 'application/vnd.oasis.opendocument.text',
    'ods' => 'application/vnd.oasis.opendocument.spreadsheet'
  );
  public $modelAllowed = array(
    'nxz' => 'application/octet-stream', 
    'ply' => 'application/octet-stream', 
    'obj' => 'application/octet-stream', 
  );
  public $maxSize = 536870912; //512MB

  public function __construct() {
    $this->uuid = Uuid::uuid4();
    $baseDir = $_SERVER['DOCUMENT_ROOT'] . "/archive/";
    
    $this->imageDir = $baseDir . "image/";
    $this->documentDir = $baseDir . "document/";
    $this->logoDir = $baseDir . "logo/";
    // Crea le sottocartelle se non esistono
    if (!is_dir($this->imageDir)) { mkdir($this->imageDir, 0777, true); }
    if (!is_dir($this->documentDir)) { mkdir($this->documentDir, 0777, true); }
    if (!is_dir($this->logoDir)) { mkdir($this->logoDir, 0777, true); }  // Crea logo in archive
    if (!is_dir($baseDir . "tmp/")) { mkdir($baseDir . "tmp/", 0777, true); }
  }

  public function addMedia($data, $file=null){
    try {
      if($file && $file !== null){
        if ($data['type'] == 'logo') {
          $folder = $this->logoDir;
        } elseif ($data['type'] == 'image') {
          $folder = $this->imageDir;
        } else {
          $folder = $this->documentDir;
        }
        $ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
        $name = $this->uuid.".".$ext;
        $data['path'] = $name;
        $this->upload($file, $folder, $name, $data['type']);
      }
      $sql = $this->buildInsert("files", $data);
      $this->prepared($sql, $data);
      return ["res"=> 1, "output"=>'Ok, the media has been added successfully'];
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }

  public function editImage(array $data){
    try {
      $sql = $this->buildUpdate("files", ['id'=>$data['id']], $data);
      $this->prepared($sql, $data);
      return ["error"=> 0, "output"=>'Ok, the media has been added successfully'];
    } catch (\Exception $e) {
      return ["error"=>1, "output"=>$e->getMessage()];
    }
  }

  public function getMedia(int $id){
    return $this->simple("select f.id file, f.type, f.path, f.url, f.text, f.downloadable, l.id license_id, l.license, l.acronym, l.link, l.file deed from files f left join license l on f.license = l.id where f.artifact = ".$id.";");
  }

  public function upload($file, $folder, $name, $type){
    $fileAllowed = $type == 'image' ? $this->imageAllowed : $this->documentAllowed;
    $this->checkError($file['error']);
    $this->checkType($file['name'], $file['type'],$fileAllowed);
    $this->checkSize($file['error']);
    $this->moveFile($file, $folder, $name);
    return true;
  }

  protected function checkError($error){
    if($error == 1){
      throw new \Exception("Sorry but something went wrong during the loading process, please try again or contact the system administrator.", 1);
    }
    return true;
  }

  protected function checkType($fileExt, $fileMime, array $fileAllowed){
    $ext = explode('.', $fileExt);
    $ext = array_pop($ext);
    $ext = mb_strtolower(strval($ext));
    if(!array_key_exists($ext,$fileAllowed)){
      throw new \Exception("Sorry but you are trying to upload a file with an extension that is not allowed", 1);
    }
    if($fileMime !== $fileAllowed[$ext]){
      throw new \Exception("Sorry but you are trying to upload an invalid file type", 1);
    }
    return true;
  }

  protected function checkSize($size){
    if($size > $this->maxSize){
      throw new \Exception("Sorry but the file exceeds the maximum size allowed", 1);
    }
    return true;
  }

  protected function moveFile($file, $folder, $name){
    // Ensure the target directory exists
    if (!is_dir($folder)) { 
      mkdir($folder, 0777, true); 
    }
    // Check if directory is writable (without trying to chmod, to avoid permission errors on mounted volumes)
    if (!is_writable($folder)) {
      throw new \Exception("Destination directory is not writable: " . $folder, 1);
    }
    $fileLoc = $folder.$name;
    if (!file_exists($file["tmp_name"])) {
      throw new \Exception("Temporary file does not exist: " . $file["tmp_name"], 1);
    }
    if(!move_uploaded_file($file["tmp_name"], $fileLoc)){ 
      error_log("Failed to move uploaded file. Source: " . $file["tmp_name"] . " Destination: " . $fileLoc . " Error: " . print_r(error_get_last(), true));
      error_log("File permissions: " . substr(sprintf('%o', fileperms($file["tmp_name"])), -4));
      error_log("Destination directory permissions: " . substr(sprintf('%o', fileperms($folder)), -4));
      error_log("PHP process user: " . get_current_user() . " UID: " . posix_getuid() . " GID: " . posix_getgid());
      throw new \Exception("Sorry but there was an error while uploading the file to the server, please try again or contact the system administrator", 1); 
    }
    chmod($fileLoc, 0666);
    return true;
  }

    public function deleteMedia(array $dati){
    error_log("deleteMedia called with data: " . print_r($dati, true));
    try {
      if(isset($dati['file']) && isset($dati['type'])){
        // Determina folder basato su type
        if ($dati['type'] == 'logo') {
          $folder = $this->logoDir;
        } elseif ($dati['type'] == 'image') {
          $folder = $this->imageDir;
        } else {
          $folder = $this->documentDir;
        }
        $file = $folder . $dati['file'];
        if (!file_exists($file)){ throw new \Exception("Error: file $file does not exist", 1); }
        if(!unlink($file)){ throw new \Exception("Error: file $file has not been deleted", 1); }
      }
      $sql = "delete from files where id = :id;";
      $this->prepared($sql,["id"=>$dati['id']]);
      return ["error"=> 0, "output"=>'Ok, the media has been successfully removed.'];
    } catch (\Throwable $th) {
      return ["error"=>1, "output"=>$th->getMessage()];
    }
  }

  public function deleteFile(string $path){
    try {
       if (!file_exists($path)) {
        throw new \Exception("Error: file $path does not exist", 1);
      }
      if(!unlink($path)){ 
        error_log("Failed to delete file:" . $path . " Error: " . print_r(error_get_last(), true));
        throw new \Exception("Error: file has not been deleted", 1); 
      }
      return ["error"=> 0, "output"=>'Ok, the image has been successfully removed.'];
    } catch (\Throwable $th) {
      return ["error"=>1, "output"=>$th->getMessage()];
    }
  }
}

?>