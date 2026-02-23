<?php
namespace Adc;
use Ramsey\Uuid\Uuid;

class Model extends Conn{
  public $uuid;
  public $modelDir;
  public $modelPreview;
  public $thumbDir;
  
  public function __construct(){
    $this->uuid = Uuid::uuid4();
  
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

  public function saveModel($data, $files){
    file_put_contents('/tmp/debug.log', print_r($data, true), FILE_APPEND);
    try {
      $this->pdo()->beginTransaction();
      $thumbExt = pathinfo($files['thumbnail']["name"], PATHINFO_EXTENSION);
      $modelExt = pathinfo($files['object']["name"], PATHINFO_EXTENSION);
      $data['model']['created_by'] = $data['model']['updated_by'] = $data['model_object']['author'];
      // $data['model']['thumbnail'] = $files['thumbnail']['name'];
      $data['model']['thumbnail'] = $this->uuid.".".$thumbExt;
      $sqlModel = $this->buildInsert("model", $data['model']);
      $stmt = $this->pdo()->prepare($sqlModel);
      $stmt->execute($data['model']);
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
      $sqlModelObject = $this->buildInsert("model_object", $data['model_object']);
      $stmt = $this->pdo()->prepare($sqlModelObject);
      $stmt->execute($data['model_object']);
      $modelObjectId = $this->pdo()->lastInsertId();
      
      //prepare & save object_param
      $data['model_param']['object'] = $modelObjectId;
      $sqlModelParam = $this->buildInsert('model_param', $data['model_param']);
      $stmt = $this->pdo()->prepare($sqlModelParam);
      $stmt->execute($data['model_param']);

      
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
      'uuid' => $this->uuid,
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

  // private function buildObjectView(array $data){
  //   $paramArray = [
  //     'model' => $data['model'],
  //     'default_view' => $data['default_view'],
  //     'grid' => $data['grid'],
  //     'lightDir' => $data['lightDir'],
  //     'lighting' => $data['lighting'],
  //     'ortho' => $data['ortho'],
  //     'solid' => $data['solid'],
  //     'specular' => $data['specular'],
  //     'texture' => $data['texture'],
  //     'viewside' => $data['viewside'],
  //     'xyz' => $data['xyz']
  //   ];
  //   return $paramArray;
  // }

  // private function buildObjectParam(array $data){
  //   $paramArray = [
  //     'object' => $data['object'],
  //     'acquisition_method' => $data['acquisition_method'],
  //     'software' => $data['software'],
  //     'points' => $data['points'],
  //     'polygons' => $data['polygons'],
  //     'textures' => $data['textures'],
  //     'scans' => $data['scans'],
  //     'pictures' => $data['pictures'],
  //     'encumbrance' => $data['encumbrance'],
  //     'measure_unit' => $data['measure_unit']
  //   ];
  //   return $paramArray;
  // }

  private function handle3dFile($file){
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
    return true;
  }

  private function handleImg($file){
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
    return true;

    //prima di scalare l'immagine devo caricarla sul server
  }

  public function buildGallery(string $sortBy, $filterArr = [], $page = 1, $limit = 10){
    // debug rapido: log tipo e anteprima valore
  error_log('buildGallery: $filterArr type=' . gettype($filterArr) . ' value=' . substr(var_export($filterArr, true), 0, 500));

    // Calcola offset per la paginazione
    $offset = ($page - 1) * $limit;
    $filterMaterial = "";
    $filterArtifact = [];
    
    if(!empty($filterArr)){
      foreach ($filterArr as $index => $filter) {
        // Se il filtro è già una stringa con condizione SQL completa
        if (is_string($filter)) {
          // Controlla se è un filtro per material
          if (strpos($filter, 'material.id') !== false) {
            $filterMaterial = "WHERE " . $filter;
          } else {
            // Aggiungi direttamente alla lista dei filtri per artifact
            $filterArtifact[] = $filter;
          }
          continue;
        }
        
        // Gestione del formato array (come prima)
        if (!is_array($filter)) {
          error_log('WARNING: filter at index ' . $index . ' is not an array or string, skipping');
          continue;
        }
        
        // Processa filtri in formato array
        foreach ($filter as $key => $value) {
          if ($key === 'material.id') {
            $filterMaterial = "WHERE material.id = " . intval($value);
          } elseif ($key === 'description') {
            $filterArtifact[] = "artifact.description LIKE '%" . addslashes($value) . "%'";
          } else {
            if (is_numeric($value)) {
              $filterArtifact[] = $key . " = " . intval($value);
            } else {
              $filterArtifact[] = $key . " LIKE '%" . addslashes($value) . "%'";
            }
          }
        }
      }
    }
    
    $filter = !empty($filterArtifact) ? " AND " . implode(" AND ", $filterArtifact) : "";
    
    error_log("Filter material: " . $filterMaterial);
    error_log("Filter artifact array: " . json_encode($filterArtifact));
    error_log("Final filter string: " . $filter);

    $totField = "count(*) as tot";
    $galleryFields = "
      artifact.id,
      artifact.name,
      inst.name institution,
      gadm0.country as nation,
      COALESCE(gadm1.name_1, '') AS county,
      COALESCE(artifact.description, 'no description available') AS description,
      class.id AS category_id,
      class.value AS category,
      JSON_OBJECTAGG(material.id, material.value) AS material,
      artifact.start,
      artifact.end,
      obj.object,
      obj.thumbnail";

    $conditions = "FROM artifact
    INNER JOIN list_category_class class ON artifact.category_class = class.id
    INNER JOIN artifact_material_technique amt ON amt.artifact = artifact.id
    INNER JOIN artifact_model am ON artifact.id = am.artifact
    INNER JOIN model_object obj ON obj.model = am.model
    INNER JOIN institution inst ON inst.id = artifact.storage_place
    LEFT JOIN list_material_specs material ON amt.material = material.id
    LEFT JOIN artifact_findplace af ON af.artifact = artifact.id
    LEFT JOIN gadm0 ON gadm0.gid_0 = af.gid_0
    LEFT JOIN gadm1 ON gadm1.gid_1 = af.gid_1
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
    GROUP BY artifact.id, artifact.name, gadm0.country, gadm1.name_1, inst.name, class.id, class.value, artifact.start, artifact.end, obj.object, obj.thumbnail ";
    
    $pagination = "ORDER BY ".$sortBy." LIMIT ".$limit." OFFSET ".$offset.";";
    
    $totSql = "SELECT ".$totField." ".$conditions.";";
    $gallerySql = "SELECT ".$galleryFields." ".$conditions." ".$pagination;

    error_log('Total SQL: ' . $totSql);
    error_log('Gallery SQL: ' . $gallerySql);

    return ["tot" => $this->simple($totSql), "gallery" => $this->simple($gallerySql)];
}

  public function getModel(int $id){
    $out['model'] = $this->simple("select m.id, m.name, m.note, m.uuid, NULLIF(m.description, 'no description available') description, m.thumbnail, status.id status_id, status.value status, m.create_at, m.updated_at, concat(p.last_name,' ',p.first_name) created_by, m.doi, m.doi_svg, m.citation from model m inner join list_item_status status ON m.status = status.id inner join user on m.created_by = user.id inner join person p on user.person = p.id where m.id =  ".$id.";")[0];
    //check if it's connected to an artifact
    $artifact_model = $this->simple("select artifact from artifact_model where model = ".$id.";");
    if(!empty($artifact_model)){$out['artifact'] = $artifact_model[0]['artifact'];}
    ////////////////////////////////////////
    $out['model_biblio'] = $this->simple("select * from model_biblio where model = ".$id.";");
    $out['model_object'] = $this->simple("select obj.id, obj.object, obj.thumbnail, status.value status, obj.author author_id, concat(author.first_name,' ',author.last_name) author, obj.owner owner_id, owner.name owner, obj.license license_id, license.license license, license.acronym license_acronym, license.link license_link, obj.create_at, obj.updated_at, nullif(obj.description,'no object description') description, obj.note, obj.uuid, method.value acquisition_method, param.software, param.points, param.polygons, param.textures, param.scans, param.pictures, param.encumbrance, param.measure_unit from model_object obj inner join list_item_status status ON obj.status = status.id inner join user on obj.author = user.id inner join person author on user.person = author.id inner join institution owner on obj.owner = owner.id inner join license on obj.license = license.id inner join model_param param on param.object = obj.id inner join list_model_acquisition method on param.acquisition_method = method.id where model =".$id.";");
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

public function modelList(array $payload): array {
    $params = [];
    $where = !empty($payload) ? $this->buildModelListConditions($payload, $params) : "";
    $sql = "SELECT id, model, name, description, thumbnail, author, author_id, owner, owner_id, CAST(updated_at AS DATE) last_update FROM model_query_view $where ORDER BY 1 ASC";

    error_log("Model SQL: " . $sql);
    error_log("Model Params: " . json_encode($params));

    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

  private function buildModelListConditions(array $payload, array &$params): string {
    $whereClauses = [];
    foreach ($payload as $key => $value) {
        if ($key === 'to_connect') {
            $operator = $value == 1 ? "NOT" : "";
            $whereClauses[] = "id $operator IN (SELECT model FROM artifact_model)";
        } else {
            if (is_int($value)) {
                $whereClauses[] = "$key = :filter_$key";
                $params["filter_$key"] = $value;
            } else {
                $whereClauses[] = "$key LIKE :filter_$key";
                $params["filter_$key"] = "%$value%";
            }
        }
    }
    return !empty($whereClauses) ? " WHERE " . implode(" AND ", $whereClauses) : "";
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
    $sql = "select * from model_object inner join model_param on model_param.object = model_object.id where model_object.id = ".$id.";";
    return $this->simple($sql)[0];
  }

  public function updateObjectMetadata(array $dati){
    try {
      $modelObjectSql = $this->buildUpdate('model_object',['id'=>$dati['model_object']['id']],$dati['model_object']);
      $modelParamSql = $this->buildUpdate('model_param',['object'=>$dati['model_param']['object']],$dati['model_param']);
      $this->pdo()->beginTransaction();
      $this->prepared($modelObjectSql, $dati['model_object']);
      $this->prepared($modelParamSql, $dati['model_param']);
      $this->pdo()->commit();
      return ["res"=> 1, "output"=>'Ok, the object has been successfully updated.'];
    } catch (\Exception $e) {
      $this->pdo()->rollback();
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }

  public function checkName(array $data): array {
    $payload = $data['payload'] ?? $data;
    $name = $payload['name'] ?? null;
  
    if (empty($name)) {
      return [
        'error' => 1,
        'message' => 'Missing required field: name'
      ];
    }
  
    $sql = "SELECT EXISTS(SELECT 1 FROM model WHERE name = :name) as `exists`;";
    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute(['name' => $name]);
    $exists = (bool) $stmt->fetchColumn();
  
    return [
      'error' => $exists ? 1 : 0,
      'exists' => $exists,
      'message' => $exists ? 'Name already exists' : 'Name is available'
    ];
  }
}
