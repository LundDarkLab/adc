<?php
namespace Adc;
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
use Ramsey\Uuid\Uuid;

class Model extends Conn{
  public $uuid;
  public $modelDir;
  public $modelPreview;
  public $thumbDir;
  function __construct(){
    $this->uuid = Uuid::uuid4();
    
    $this->modelDir = $_SERVER['DOCUMENT_ROOT']."/archive/models/";
    $this->modelPreview = $_SERVER['DOCUMENT_ROOT']."/archive/models/preview/";
    $this->thumbDir = $_SERVER['DOCUMENT_ROOT']."/archive/thumb/";
  }

  private function buildObjectData($data, $files){
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
      'thumbnail'=>$this->uuid.".".$thumbExt
    ];
    if(isset($data['object_note'])){$objectArray['note']=$data['object_note'];}
    return $objectArray;
  }

  public function saveObject($data, $files){
    try {
      $objectData = $this->buildObjectData($data, $files);
      $sqlObject = $this->buildInsert("model_object", $objectData);
      $this->prepared($sqlObject, $objectData);
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }

  public function buildGallery(string $sortBy, $filterArr = []){
    $filterMaterial="";
    // $filterArtifact=["artifact.id IN (SELECT artifact_id FROM ArtifactsWithMaterial)"];
    $filterArtifact=[];
    if(!empty($filterArr)){
      foreach ($filterArr as $index => $filter) {
        if (array_key_exists('material.id', $filter)) {
          $filterMaterial = "WHERE material.id ".$filter['material.id'];
          unset($filterArr[$index]['material.id']);
        }
        if (array_key_exists('description', $filter)) {
          array_push($filterArtifact,$filter['description']);
          unset($filterArr[$index]['description']);
        }
      }
      foreach ($filterArr as $index => $filter) {
        foreach ($filter as $key => $value) {
          $filterArtifact[] = $key . $value;
        }
      }
    }
    $filter = !empty($filterArtifact) ? " AND " . join(" and ", $filterArtifact) : "";
    $sql="
    SELECT 
      artifact.id,
      artifact.name,
      COALESCE(artifact.description, 'no description available') AS description,
      class.id AS category_id,
      class.value AS category,
      JSON_OBJECTAGG(material.id, material.value) AS material,
      artifact.start,
      artifact.end,
      obj.object,
      obj.thumbnail 
    FROM artifact 
    INNER JOIN list_category_class class ON artifact.category_class = class.id 
    INNER JOIN artifact_material_technique amt ON amt.artifact = artifact.id 
    INNER JOIN artifact_model am ON artifact.id = am.artifact 
    INNER JOIN model_object obj ON obj.model = am.model 
    LEFT JOIN list_material_specs material ON amt.material = material.id
    left join artifact_findplace af on af.artifact = artifact.id
    WHERE artifact.status = 2
      AND artifact.id IN (
      SELECT artifact.id
      FROM artifact
      INNER JOIN artifact_material_technique amt ON amt.artifact = artifact.id
      LEFT JOIN list_material_specs material ON amt.material = material.id
      ".$filterMaterial."
      GROUP BY artifact.id
    )
    ".$filter."
    GROUP BY artifact.id, artifact.name, class.id, class.value, artifact.start, artifact.end, obj.object, obj.thumbnail
    ORDER BY ".$sortBy.";";
    return $this->simple($sql);
  }

  public function getModel(int $id){
    $out['model'] = $this->simple("select m.id, m.name, m.note, m.uuid, NULLIF(m.description, 'no description available') description, m.thumbnail, status.id status_id, status.value status, m.create_at, m.updated_at, concat(p.last_name,' ',p.first_name) created_by, m.doi, m.doi_svg, m.citation from model m inner join list_item_status status ON m.status = status.id inner join user on m.created_by = user.id inner join person p on user.person = p.id where m.id =  ".$id.";")[0];
    //check if it's connected to an artifact
    $artifact_model = $this->simple("select artifact from artifact_model where model = ".$id.";");
    if(count($artifact_model) > 0){$out['artifact'] = $artifact_model[0]['artifact'];}
    ////////////////////////////////////////
    $out['model_biblio'] = $this->simple("select * from model_biblio where model = ".$id.";");
    $out['model_object'] = $this->simple("select obj.id, obj.object, obj.thumbnail, status.value status, obj.author author_id, concat(author.first_name,' ',author.last_name) author, obj.owner owner_id, owner.name owner, obj.license license_id, license.license license, license.acronym license_acronym, license.link license_link, obj.created_at, obj.updated_at, nullif(obj.description,'no object description') description, obj.note, method.value acquisition_method, param.software, param.points, param.polygons, param.textures, param.scans, param.pictures, param.encumbrance, param.measure_unit from model_object obj inner join list_item_status status ON obj.status = status.id inner join user on obj.author = user.id inner join person author on user.person = author.id inner join institution owner on obj.owner = owner.id inner join license on obj.license = license.id inner join model_param param on param.object = obj.id inner join list_model_acquisition method on param.acquisition_method = method.id where model =".$id.";");
    $out['model_view'] = $this->simple("select * from model_view where model = ".$id." and default_view = true;")[0];
    return $out;
  }

  public function getModels(array $search){
    $filter = [];
    $status = $search['status'] ==  0 ? 'm.status > 0' : 'm.status = '.$search['status'];
    array_push($filter, $status);
    if(isset($search['to_connect'])){
      array_push($filter,"m.id not in (select model from artifact_model)");
    }
    if(count($filter) > 0 ){ $filter = "where ".join(" and ", $filter);}
    $sql = "select m.id, m.name, m.create_at, m.description, m.status, m.thumbnail, concat(person.last_name, ' ', person.first_name) author, count(o.id) object from model m inner join model_object o on o.model = m.id inner join user on m.created_by = user.id inner join person on user.person = person.id ".$filter." group by m.id, m.name, m.create_at, m.description, m.status, m.thumbnail order by m.create_at desc;";
    return $this->simple($sql);
  }

  public function saveModelParam(array $dati){
    try {
      $sql = $this->buildInsert('model_view', $dati);
      $this->prepared($sql, $dati);
      return ["res"=>1, "msg"=>'ok, parameters saved'];
    } catch (\Exception $e) {
      return ["res"=>0, "msg"=>$e->getMessage()];
    }
  }

  public function updateModelMetadata(array $dati){
    try {
      $sql = $this->buildUpdate('model',['id'=>$dati['id']],$dati);
      $this->prepared($sql, $dati);
      return ["res"=> 1, "output"=>'Ok, the model has been successfully updated.'];
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }

  public function updateModelParam(array $dati){
    try {
      $filter = ["model"=>$dati['model']];
      unset($dati['model']);
      $sql = $this->buildUpdate("model_view", $filter, $dati);
      $this->prepared($sql, $dati);
      return ["res"=>1, "msg"=>'ok, parameters updated'];
    } catch (\Exception $e) {
      return ["res"=>0, "msg"=>$e->getMessage()];
    }
  }

  public function changeModelStatus(array $dati){
    try {
      $filter = ["id"=>$dati['id']];
      $sql = $this->buildUpdate("model", $filter, $dati);
      $this->prepared($sql, $dati);
      return ["res"=>0, "msg"=>'ok, model status has been successfully updated'];
    } catch (\Exception $e) {
      return ["res"=>1, "msg"=>$e->getMessage()];
    }
  }


  public function connectModel(array $dati){
    try {
      $sql = $this->buildInsert('artifact_model', $dati);
      $this->prepared($sql, $dati);
      return ["res"=>1, "msg"=>'ok, model connected'];
    } catch (\Exception $e) {
      return ["res"=>0, "msg"=>$e->getMessage()];
    }
  }

  public function deleteModel(int $id){
    try {
      $sql = $this->buildDelete('model',['id'=>$id]);
      $this->simple($sql);
      return ["res"=> 1, "output"=>'Ok, the model has been successfully deleted.'];
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }

  public function getObject(int $id){
    // $sql = "select * from model_object inner join model_param on model_param.object = model_object.id where model_object.id = :id;";
    $sql = "select mo.id, mo.model, mo.object, mo.status, mo.author,mo.owner, mo.license, mo.created_at, mo.updated_at, mo.updated_by, mo.description, mo.note, mo.thumbnail, mp.acquisition_method, mp.software, mp.points, mp.polygons, mp.textures, mp.scans, mp.pictures, mp.encumbrance, mp.measure_unit from model_object mo inner join model_param mp on mp.object = mo.id where mo.id = :id;";
    $sttmt = $this->pdo()->prepare($sql);
    $sttmt->execute(['id'=>$id]);
    return $sttmt->fetch(\PDO::FETCH_ASSOC);
    // return $this->simple($sql)[0];
  }

  public function updateObjectMetadata(array $dati){
    try {
      $pdo = $this->pdo();
      $pdo->beginTransaction();

      $modelObjectSql = $this->buildUpdate('model_object',['id'=>$dati['model_object']['id']],$dati['model_object']);
      $sttmt = $pdo->prepare($modelObjectSql);
      $sttmt->execute($dati['model_object']);
      
      $modelParamSql = $this->buildUpdate('model_param',['object'=>$dati['model_param']['object']],$dati['model_param']);
      $sttmt = $pdo->prepare($modelParamSql);
      $sttmt->execute($dati['model_param']);
      
      $pdo->commit();
      return ["res"=> 1, "output"=>'Ok, the object has been successfully updated.'];
    } catch (\Exception $e) {
      $pdo->rollback();
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }
  
  ###### test new method for insert model #######
  // Metodo indipendente: non usa Conn o altri metodi ereditati
  public function saveNewModel($data, $files) {
    try {
        ini_set('memory_limit', '256M');
        $pdo = $this->pdo();
        // Disabilita STRICT_TRANS_TABLES sulla connessione esistente
        // $pdo->exec("SET SESSION sql_mode = 'ONLY_FULL_GROUP_BY,NO_ZERO_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
        
        $uuid = $this->uuid->toString();
        $modelDir = $this->modelDir;
        $thumbDir = $this->thumbDir;
        $thumbExt = pathinfo($files['thumb']["name"], PATHINFO_EXTENSION);
        $modelExt = pathinfo($files['nxz']["name"], PATHINFO_EXTENSION);

        $pdo->beginTransaction();
        // 1. Insert into model
        $modelArray = [
            'name' => $data['name'],
            'description' => $data['description'],
            'thumbnail' => $uuid . "." . $thumbExt,
            'doi' => $data['doi'] ?? '',
            'doi_svg' => $data['doi_svg'] ?? '',
            'citation' => $data['citation'] ?? '',
            'created_by' => $data['author'],
            'updated_by' => $data['author']
        ];
        $sqlModel = "INSERT INTO model (name, description, thumbnail, doi, doi_svg, citation, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtModel = $pdo->prepare($sqlModel);
        $stmtModel->execute(array_values($modelArray));
        $modelId = $pdo->lastInsertId();  // Aggiungi questa riga

        // 2. Insert into model_object
        $objectArray = [
            'model' => $modelId,
            'object' => $uuid . "." . $modelExt,
            'author' => $data['author'],
            'updated_by' => $data['author'],
            'owner' => $data['owner'],
            'license' => $data['license'],
            'description' => $data['object_description'],
            'thumbnail' => $uuid . "." . $thumbExt
        ];
        $sqlObject = "INSERT INTO model_object (model, object, author, updated_by, owner, license, description, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtObject = $pdo->prepare($sqlObject);
        $stmtObject->execute(array_values($objectArray));
        $objectId = $pdo->lastInsertId();  // Aggiungi questa riga

        // 3. Insert into model_view
        $viewArray = [
            'model' => $modelId,
            'default_view' => $data['default_view'] ?? 1,
            'grid' => $data['grid'] ?? 1,
            'lightDir' => $data['lightDir'] ?? '[0,0]',
            'lighting' => $data['lighting'] ?? 1,
            'ortho' => $data['ortho'] ?? 0,
            'solid' => $data['solid'] ?? 0,
            'specular' => $data['specular'] ?? 0,
            'texture' => $data['texture'] ?? 1,
            'viewside' => $data['viewside'] ?? 'front',
            'xyz' => $data['xyz'] ?? '0,0,0'
        ];
        $sqlView = "INSERT INTO model_view (model, default_view, grid, lightDir, lighting, ortho, solid, specular, texture, viewside, xyz) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtView = $pdo->prepare($sqlView);
        $stmtView->execute(array_values($viewArray));

        // 4. Insert into model_param
        $paramArray = [
            'object' => $objectId,  // Usa $objectId
            'acquisition_method' => $data['acquisition_method'] ?? 1,
            'software' => $data['software'] ?? '',
            'points' => $data['points'] ?? 0,
            'polygons' => $data['polygons'] ?? 0,
            'textures' => $data['textures'] ?? 1,
            'scans' => $data['scans'] ?? 1,
            'pictures' => $data['pictures'] ?? 1,
            'encumbrance' => $data['encumbrance'] ?? 'none',
            'measure_unit' => $data['measure_unit'] ?? 'mm'
        ];
        $sqlParam = "INSERT INTO model_param (object, acquisition_method, software, points, polygons, textures, scans, pictures, encumbrance, measure_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtParam = $pdo->prepare($sqlParam);
        $stmtParam->execute(array_values($paramArray));

        // Commit transazione
        $pdo->commit();

        // 5. Upload file 3D e thumbnail usando la funzione stream
        $this->uploadFile($files['nxz'], $modelDir, $uuid, $modelExt, ["nxz", "nxs", "ply"], 'application/octet-stream');
        unlink($this->modelPreview . $files['nxz']["name"]);
        $this->uploadFile($files['thumb'], $thumbDir, $uuid, $thumbExt, ["jpg", "jpeg", "png"]);

        return ["res" => 1, "output" => "Model saved successfully", "id" => $modelId];
    } catch (\Exception $e) {
        if (isset($pdo)) $pdo->rollback();
        return ["res" => 0, "output" => $e->getMessage()];
    }
  }

  // Funzione privata per upload file con stream (riutilizzabile)
  private function uploadFile($file, $targetDir, $uuid, $ext, $allowedExts = [], $expectedType = null) {
      // Controlli base
      if (!$file["tmp_name"]) {
          throw new \Exception("Please browse for a file before clicking the upload button.", 1);
      }
      if (!empty($allowedExts) && !in_array(strtolower($ext), $allowedExts)) {
          throw new \Exception(strtolower($ext) . " - Invalid file type", 1);
      }
      if ($expectedType && $file["type"] !== $expectedType) {
          throw new \Exception("Sorry but you can upload only " . $expectedType . " files. You are trying to upload a " . $file["type"] . " file type", 1);
      }

      // Crea directory se non esiste
      if (!is_dir($targetDir)) {
          mkdir($targetDir, 0777, true);
      }

      // Percorso target
      $targetPath = $targetDir . $uuid . "." . $ext;

      // Upload con stream (evita caricamento in memoria)
      $src = fopen($file["tmp_name"], 'rb');
      $dest = fopen($targetPath, 'wb');
      if (!$src || !$dest) {
          throw new \Exception("Failed to open file streams", 1);
      }
      stream_copy_to_stream($src, $dest);
      fclose($src);
      fclose($dest);

      // Imposta permessi
      chmod($targetPath, 0777);

      return true;
  }
}


