<?php
namespace Adc;
use Adc\Config;
use Ramsey\Uuid\Uuid;

class File{
  public $uuid;
  public $imageDir;
  public $documentDir;
  public $videoDir;
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
  public $videoAllowed = array(
    'mp4'  => 'video/mp4',
    'webm' => 'video/webm',
    'ogv'  => 'video/ogg',
  );
  public $modelAllowed = array(
    'nxz' => 'application/octet-stream',
    'ply' => 'application/octet-stream',
    'obj' => 'application/octet-stream',
  );
  public $maxSize = 536870912; //512MB

  public function __construct() {
    $this->uuid = Uuid::uuid4();
    $this->imageDir = Config::dir('image');
    $this->documentDir = Config::dir('document');
    $this->videoDir = Config::dir('video');
    ini_set('upload_tmp_dir', Config::dir('tmp'));
  }

  public function upload($file, $folder, $name, $type){
    $fileAllowed = match((int)$type) {
      1       => $this->imageAllowed,
      3       => $this->videoAllowed,
      default => $this->documentAllowed, // cover document and reference, for now
    };
    $this->checkError($file['error']);
    $this->checkType($file['name'], $file['type'],$fileAllowed);
    $this->checkSize($file['size']);
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
    $fileLoc = $folder.$name;
    if (!file_exists($file["tmp_name"])) {
      throw new \Exception("Temporary file does not exist: " . $file["tmp_name"], 1);
    }
    if(!move_uploaded_file($file["tmp_name"], $fileLoc)){
      error_log("Failed to move uploaded file. Source: " . $file["tmp_name"] . " Destination: " . $fileLoc . " Error: " . print_r(error_get_last(), true));
      error_log("File permissions: " . substr(sprintf('%o', fileperms($file["tmp_name"])), -4));
      error_log("Destination directory permissions: " . substr(sprintf('%o', fileperms($folder)), -4));
      throw new \Exception("Sorry but there was an error while uploading the file to the server, please try again or contact the system administrator", 1);
    }
    chmod($fileLoc, 0666);
    return true;
  }

  public function deleteFile(string $path){
    try {
      if (!file_exists($path)){
        error_log("File does not exist: " . $path);
        return ["error"=> 0, "output"=>'File does not exist, skipping deletion.'];
      }
      if(!unlink($path)){
        error_log("Failed to delete file:" . $path . " Error: " . print_r(error_get_last(), true));
        throw new \Exception("Error: file has not been deleted", 1);
      }
      return ["error"=> 0, "output"=>'Ok, the file has been successfully removed.'];
    } catch (\Throwable $th) {
      return ["error"=>1, "output"=>$th->getMessage()];
    }
  }
}
