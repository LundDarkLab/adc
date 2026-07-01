<?php
namespace Adc;
use Ramsey\Uuid\Uuid;

class ModelFileHandler extends ModelGallery {
  public string $uuid;
  public string $modelDir;
  public string $modelPreview;
  public string $thumbDir;
  private File $file;

  public function __construct(){
    $this->uuid = Uuid::uuid4();
    $this->file = new File();

    // Same detection as File.php
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($requestUri, '/prototype_dev/') !== false) {
      $rootFolder = '/prototype_dev';
    } elseif (strpos($requestUri, '/plus/') !== false) {
      $rootFolder = '/plus';
    } else {
      $rootFolder = '';
    }

    $this->modelDir = $_SERVER['DOCUMENT_ROOT'] . $rootFolder . "/archive/models/";
    $this->modelPreview = $_SERVER['DOCUMENT_ROOT'] . $rootFolder . "/archive/models/preview/";
    $this->thumbDir = $_SERVER['DOCUMENT_ROOT'] . $rootFolder . "/archive/thumb/";
  }

  public function saveModel(array $data, array $files):array {
    try {
      $this->pdo()->beginTransaction();
      $thumbExt = pathinfo($files['thumbnail']["name"], PATHINFO_EXTENSION);
      $modelExt = pathinfo($files['object']["name"], PATHINFO_EXTENSION);
      $data['model']['created_by'] = $data['model']['updated_by'] = $data['model_object']['author'];
      $data['model']['thumbnail'] = $this->uuid.".".$thumbExt;
      $data['model']['owner'] = $data['model_object']['owner'];
      $this->create("model", $data['model']);
      $modelId = $this->pdo()->lastInsertId();

      // prepare & save model_object data
      if (isset($data['model_object']['object_description'])) {
        $data['model_object']['description'] = $data['model_object']['object_description'];
        unset($data['model_object']['object_description']);
      }
      if (isset($data['model_object']['object_note'])) {
        $data['model_object']['note'] = $data['model_object']['object_note'];
        unset($data['model_object']['object_note']);
      }
      $data['model_object']['updated_by'] = $data['model_object']['author'];
      $data['model_object']['model'] = $modelId;
      $data['model_object']['thumbnail'] = $this->uuid.".".$thumbExt;
      $data['model_object']['object'] = $this->uuid.".".$modelExt;
      $this->create("model_object", $data['model_object']);
      $modelObjectId = $this->pdo()->lastInsertId();

      //prepare & save object_param
      $data['model_param']['object'] = $modelObjectId;
      $this->create('model_param', $data['model_param']);

      //upload, move, handle image and 3d file
      $this->handle3dFile($files['object']);
      $this->handleImg($files['thumbnail']);

      $this->pdo()->commit();

      return [
        "error"=> 0,
        "output"=>'Ok, the model has been successfully created.',
        "id"=>$modelId,
        "data"=>$data,
        "files"=>$files
      ];
    } catch (\Exception $e) {
      $this->pdo()->rollback();
      return [
        "error"=>1,
        "output"=>$e->getMessage()
      ];
    }
  }

  private function buildObjectData(array $data, array $files):array {
    $modelExt = pathinfo($files['nxz']["name"], PATHINFO_EXTENSION);
    $thumbExt = pathinfo($files['thumb']["name"], PATHINFO_EXTENSION);
    $objectArray = [
      'model' => $data['model'],
      'object' => $this->uuid.".".$modelExt,
      'author' => $data['author'],
      'updated_by' => $data['author'],
      'owner' => $data['owner'],
      'license' => $data['license'],
      'description' => $data['object_description'],
      'uuid' => $this->uuid,
      'thumbnail'=>$this->uuid.".".$thumbExt
    ];
    if(isset($data['object_note'])){$objectArray['note']=$data['object_note'];}
    return $objectArray;
  }

  public function saveObject(array $data, array $files){
    try {
      $objectData = $this->buildObjectData($data, $files);
      $this->create("model_object", $objectData);
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }

  protected function handle3dFile(array $file){
    $allowed = ["nxz", "nxs", "ply"];
    $ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
    $newName = $this->uuid.".".$ext;
    if (!$file["tmp_name"]) {
      throw new \Exception("Please browse for a file before clicking the upload button.", 1);
    }
    if($file["type"] !== 'application/octet-stream'){
      throw new \Exception("Sorry but you can upload only nxz files. You are trying to upload a ".$file["type"]." file type", 1);
    }
    if (!in_array($ext, $allowed)) {
      throw new \Exception($ext." - Invalid 3d model file");
    }
    if(!move_uploaded_file($file["tmp_name"], $this->modelDir.$newName)){
      throw new \Exception("move_uploaded_file function failed, view server log for more details", 1);
    }
    if(!unlink($this->modelPreview.$file["name"])){
      throw new \Exception("unlink function failed", 1);
    }
    chmod($this->modelDir.$newName, 0777);
    return $newName;
  }

  protected function handleImg(array $file){
    $allowed = ["jpg", "jpeg", "png"];
    $ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
    $newName = $this->uuid.".".$ext;
    if (!in_array($ext, $allowed)) {
      throw new \Exception($ext." - Invalid image file type",1);
    }
    if (!$file["tmp_name"]) {
      throw new \Exception("Please browse for a file before clicking the upload button.", 1);
    }
    if(!move_uploaded_file($file["tmp_name"], $this->thumbDir.$newName)){
      throw new \Exception("move_uploaded_file function failed, view server log for more details", 1);
    }
    chmod($this->thumbDir.$newName, 0777);
    return $newName;
  }

  protected function deleteObjectFile(string $path): void {
    $result = $this->file->deleteFile($path);
    if ($result['error'] === 1) {
      throw new \Exception($result['output'], 1);
    }
  }
}
