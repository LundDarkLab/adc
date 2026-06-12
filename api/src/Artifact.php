<?php
namespace Adc;

use Adc\Config;
use Adc\Model;
use Adc\File;
use Adc\Media;
use Adc\Institution;

class Artifact extends Conn{
  private Model $model;
  private File $files;
  private Media $media;
  private Institution $institution;

  public function __construct(){
    $this->model = new Model();
    $this->files = new File();
    $this->media = new Media();
    $this->institution = new Institution();
  }

  // CRUD Operations ///////////////////////////////////////////////////////
  public function addArtifact(array $dati){
    try {
      $this->pdo()->beginTransaction();
      $institutionId = $dati['artifact']['storage_place'];
      $institution = $this->simple("SELECT abbreviation FROM institution WHERE id = $institutionId")[0];

      $sql = $this->buildInsert("artifact", $dati['artifact']);
      $this->prepared($sql, $dati['artifact']);
      $lastId = $this->pdo()->lastInsertId();

      $name = "DC{$lastId}_{$institution['abbreviation']}_{$dati['artifact']['inventory']}";
      $updateNameSql = "UPDATE artifact SET name = :name WHERE id = :id";
      $stmt = $this->pdo()->prepare($updateNameSql);
      $stmt->execute(['name' => $name, 'id' => $lastId]);

      foreach ($dati['artifact_material_technique'] as $value) {
        $data = array("artifact"=>$lastId, "material"=>$value['m'], "technique" =>$value['t']);
        $sql = $this->buildInsert("artifact_material_technique", $data);
        $this->prepared($sql, $data);
      }

      $dati['artifact_findplace']['artifact'] = $lastId;
      $sql = $this->buildInsert("artifact_findplace", $dati['artifact_findplace']);
      $this->prepared($sql, $dati['artifact_findplace']);

      $this->pdo()->commit();
      return ["error"=> 0, "message"=>'Ok, the artifact has been successfully created.', "id"=>$lastId];
    } catch (\Exception $e) {
      $this->pdo()->rollBack();
      return ["error"=>1, "message"=>$e->getMessage()];
    }
  }

  public function editArtifact(array $dati){
    error_log(print_r($dati, true));
    if (!isset($dati['artifact']['artifact'])) {
      return ["error" => 1, "message" => "Artifact ID is missing"];
    }
    
    $filter = $dati['artifact']['artifact'];
    unset($dati['artifact']['artifact']);
    try {
      $this->pdo()->beginTransaction();
      
      // Ottieni l'abbreviazione dell'istituzione (come in addArtifact)
      $institutionId = $dati['artifact']['storage_place'];
      $institution = $this->simple("SELECT abbreviation FROM institution WHERE id = $institutionId")[0];
      
      // Aggiorna l'artifact
      $artifactUpdateSql = $this->buildUpdate('artifact',['id'=>$filter],$dati['artifact']);
      $this->prepared($artifactUpdateSql, $dati['artifact']);
      
      // Rigenera il nome se necessario (basato su storage_place o inventory cambiati)
      $name = "DC{$filter}_{$institution['abbreviation']}_{$dati['artifact']['inventory']}";
      $updateNameSql = "UPDATE artifact SET name = :name WHERE id = :id";
      $stmt = $this->pdo()->prepare($updateNameSql);
      $stmt->execute(['name' => $name, 'id' => $filter]);
      
      // Aggiorna findplace
      $findPlaceUpdateSql = $this->buildUpdate('artifact_findplace',['artifact'=>$filter],$dati['artifact_findplace']);
      $this->prepared($findPlaceUpdateSql, $dati['artifact_findplace']);
      
      // Gestisci materiali (come prima)
      $deleteMaterialSql = $this->buildDelete('artifact_material_technique',array("artifact"=>$filter));
      $this->simple($deleteMaterialSql);
      foreach ($dati['artifact_material_technique'] as $value) {
        $data = array("artifact"=>$filter, "material"=>$value['m'], "technique" =>$value['t']);
        $sql = $this->buildInsert("artifact_material_technique", $data);
        $this->prepared($sql, $data);
      }
      
      $this->pdo()->commit();
      return ["error"=> 0, "message"=>'Ok, the artifact has been successfully updated.', "id"=>$filter];
    } catch (\Exception $e) {
      $this->pdo()->rollBack();
      return ["error"=>1, "message"=>$e->getMessage()];
    }
  }

  private function getArtifactMeta(array $artifact): array {
    $metadata = [];
    
    $authorSql = "select u.id, p.first_name, p.last_name from person p inner join user u on u.person = p.id inner join artifact a on a.author = u.id where a.id = ".$artifact['id'].";";
    
    $ownerSql = "select i.id, i.name, i.abbreviation from institution i inner join artifact a on a.owner = i.id where a.id = ".$artifact['id'].";";
    
    $licenseSql = "select l.id, l.license, l.acronym, l.link from license l inner join artifact a on a.license = l.id where a.id = ".$artifact['id'].";";
    
    $metadata['author'] = $this->simple($authorSql)[0];
    $metadata['owner'] = $this->simple($ownerSql)[0];
    $metadata['license'] = $this->simple($licenseSql)[0];
    return $metadata;
  }
  
  public function getArtifact(array $payload): array {
    $id = (int)$payload['id'];

    $result = $this->simple("SELECT * FROM artifact_view WHERE id = $id");
    if (empty($result)) {
       throw new \Exception("Artifact not found for id: $id");
    }

    $out['artifact'] = $result[0];
    $out['artifact_material_technique'] = $this->getArtifactMaterial($id);
    $out['artifact_findplace'] = $this->getArtifactFindplace($id);
    $out['storage_place'] = $this->institution->getInstitutions(["filters"=>["id"=>$out['artifact']['storage_place']]])[0];

    $modelId = $this->getModelId($id);
    if (!empty($modelId)) {
      $out['model'] = $this->model->getModel($modelId[0]['model']);
    }

    $media = $this->media->getAllMedia($id);
    if (!empty($media)) {
      $out['media'] = $media;
    }

    if (!empty($out['artifact']['timeline'])) {
      $sql = "SELECT definition FROM time_series WHERE id = " . $out['artifact']['timeline'];
      $timeline = $this->simple($sql)[0];
      $out['crono']['timeline'] = $timeline['definition'];
      if (!empty($out['artifact']['start'])) {
        $out['crono']['start'] = $this->getChrono(
          $out['artifact']['timeline'],
          $out['artifact']['start']
        );
      }
      if (!empty($out['artifact']['end'])) {
        $out['crono']['end'] = $this->getChrono(
          $out['artifact']['timeline'],
          $out['artifact']['end']
        );
      }
    }

    $out['artifact_metadata'] = $this->getArtifactMeta($out['artifact']);

    return $out;
  }

  public function deleteArtifact(array $payload){
    try {
      $this->pdo()->beginTransaction();
      $id = $payload['id'];

      //check files related to the artifact
      $sql = "select id, type, path from files where artifact = ".$id." and path is not null;";
      $files = $this->simple($sql);
      //delete all related files
      if(count($files) > 0){
        foreach ($files as $file) {
          $folder = $file['type'] == 'image' ? Config::dir('image') : Config::dir('document');
          $path = $folder.$file['path'];
          $this->files->deleteFile($path);
        }
        //delete file records from db
        $this->delete("files",["artifact"=>$id]);
      }
      // delete artifact record
      $this->delete("artifact",["id"=>$id]);
      
      $this->pdo()->commit();
      return ["error"=> 0, "message"=>'Ok, the artifact has been successfully deleted.'];
    } catch (\Exception $e) {
      $this->pdo()->rollBack();
      return ["error"=>1, "message"=>$e->getMessage()];
    }
  }
  /////////////////////////////////////////////////////////

  public function getList(array $payload):array{
    $sql = "select * from ".$payload['table'];
    if(isset($payload['filters']) && count($payload['filters'])>0){
      $where = " where ";
      $clauses = [];
      foreach ($payload['filters'] as $key => $value) {
        $clauses[] = $key." = '".$value."'";
      }
      $where .= implode(" and ", $clauses);
      $sql .= $where;
    }
    $sql .= ";";
    return $this->simple($sql);
  }

  public function deleteRecord(array $post) :array{
    try {
      //check if the record has related files
      $sql = "select id, type, path from files where artifact = ".$post['conditions']['id']." and path is not null;";
      $files = $this->simple($sql);
      //delete all related files
      if(count($files) > 0){
        foreach ($files as $file) {
          $folder = $file['type'] == 'image' ? Config::dir('image') : Config::dir('document');
          $path = $folder.$file['path'];
          $this->files->deleteFile($path);
        }
      }
      $this->delete($post['table'],$post['conditions']);
      return ["error" => 0, "message" => 'Record and all related files were successfully deleted'];
    } catch (\Throwable $th) {
      return ["error"=>1, "message"=>$th->getMessage(), "dati"=>$post];
    }
  }

  public function gadm(array $dati){
    $level = (int)$dati["gid"] == 0 ? $dati["gid"] : (int)$dati["gid"] - 1;
    $fields = (int)$dati["gid"] == 0 ? "gid_0 gid, country as name" : "gid_".$dati["gid"]." gid, name_".$dati["gid"]." as name, st_asgeojson(`SHAPE`) as geom";
    $table = "gadm".$dati["gid"];
    $sql = "select ".$fields." from ".$table;
    if(isset($dati['value'])){ $sql.= " where gid_".$level. " = '".$dati['value']."'";}
    $sql .= " order by 2 asc;";
    return ["query"=>$sql,"items"=>$this->simple($sql), "data"=>$dati];
  }


  

  public function artifactList(array $payload):array{
    $whereClauses = [];
    $params = [];
    
    if(!empty($payload)){
      foreach ($payload as $key => $value) {
        if(is_int($value)){
          $whereClauses[] = "a.".$key." = :filter_".$key;
          $params['filter_'.$key] = $value;
        } else {
          $whereClauses[] = "(a.name LIKE :filter_$key OR a.description LIKE :filter_$key)";
          $params['filter_'.$key] = '%'.$value.'%';
        }
      }
    }
    
    $where = !empty($whereClauses) ? " WHERE ".implode(" AND ", $whereClauses) : "";
    $sql = "SELECT a.id, a.name, a.description, a.status, i.name AS institution, CONCAT(p.first_name, ' ', p.last_name) AS author, u.id as author_id, CAST(a.last_update AS DATE) as last_update FROM artifact a JOIN institution i ON a.owner = i.id JOIN user u ON a.author = u.id JOIN person p ON u.person = p.id ".$where." ORDER BY a.last_update DESC";
    
    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
  }

  

  private function getChrono(int $timeline, int $year){
    // generic/specific sono opzionali: LEFT JOIN così la cronologia si ricostruisce
    // anche fino al solo livello disponibile. Si sceglie l'intervallo più profondo
    // (e fra pari, il più stretto) che contiene l'anno.
    $sql = "SELECT m.definition AS macro, g.definition AS generic, s.definition AS spec
      FROM time_series_macro m
      LEFT JOIN time_series_generic g ON g.macro = m.id AND {$year} BETWEEN g.start AND g.end
      LEFT JOIN time_series_specific s ON s.generic = g.id AND {$year} BETWEEN s.start AND s.end
      WHERE m.serie = {$timeline} AND {$year} BETWEEN m.start AND m.end
      ORDER BY (s.start IS NOT NULL) DESC, (g.start IS NOT NULL) DESC, (s.end - s.start) ASC, (g.end - g.start) ASC
      LIMIT 1";
    error_log("getChrono SQL: ".$sql);
    $rows = $this->simple($sql);
    return $rows[0] ?? ['macro'=>null, 'generic'=>null, 'spec'=>null];
  }

  private function getModelId($artifact){
    $sql = "select model from artifact_model where artifact = ".$artifact;
    return $this->simple($sql);
  }

  private function getArtifactMaterial(int $id){ return $this->simple("select item.material material_id, material.value material, item.technique from artifact_material_technique item inner join list_material_specs material on item.material = material.id where item.artifact = ".$id.";");}

  private function getArtifactFindplace(int $id){
    $sql = "SELECT gadm0.country gid0, gadm0.gid_0 bounds_0, gadm1.name_1 gid1, gadm1.gid_1 bounds_1, gadm2.name_2 gid2, gadm2.gid_2 bounds_2, gadm3.name_3 gid3, gadm3.gid_3 bounds_3, gadm4.name_4 gid4, gadm4.gid_4 bounds_4, gadm5.name_5 gid5, gadm5.gid_5 bounds_5, a.parish, a.toponym, a.latitude, a.longitude, a.findplace_notes notes
    FROM artifact_findplace a
    INNER JOIN gadm0 ON a.gid_0 = gadm0.gid_0
    LEFT JOIN gadm1 ON a.gid_1 = gadm1.gid_1
    LEFT JOIN gadm2 ON a.gid_2 = gadm2.gid_2
    LEFT JOIN gadm3 ON a.gid_3 = gadm3.gid_3
    LEFT JOIN gadm4 ON a.gid_4 = gadm4.gid_4
    LEFT JOIN gadm5 ON a.gid_5 = gadm5.gid_5
    WHERE a.artifact = $id;";
    return $this->simple($sql)[0];
  }

  public function getArtifactName(array $data) {
    return $this->simple("select name from artifact where id = ".$data['id'].";");
  }

  public function artifactIssues(){
    $chronoNotInRange = "SELECT a.id, a.name, a.start, coalesce(a.end, '-') end FROM artifact a LEFT JOIN time_series_specific time ON a.start BETWEEN time.start AND time.end OR a.end BETWEEN time.start AND time.end OR (a.start <= time.start AND a.end >= time.end) WHERE time.start IS NULL and a.start is not null order by a.id asc;";
    $chronoNullValue = "SELECT a.id, a.name, coalesce(a.start, '-') start, coalesce(a.end, '-') end FROM artifact a where a.start is null and a.end is null order by a.id asc";
    $sqlNoDescription = "SELECT a.id, a.name FROM artifact a where a.description is null order by a.id asc";
    $out['chronoNotInRange'] = $this->simple($chronoNotInRange);
    $out['chronoNullValue'] = $this->simple($chronoNullValue);
    $out['noDescription'] = $this->simple($sqlNoDescription);

    $db_files = [];
    $files = $this->simple("select object from model_object;");
    foreach ($files as $file) {$db_files[]=$file['object'];}
    
    $folder = Config::dir('model');
    $folder_files = array_diff(scandir($folder), array('..', '.'));
    
    $missingModel = array_diff($db_files,$folder_files);
    $missingModelList = implode("','", array_map('addslashes', $missingModel));
    $missingModelList = "'".$missingModelList."'";
    $sqlMissingModel = "select a.id artifact, m.model, a.name, m.object from artifact a inner join artifact_model am on am.artifact = a.id inner join model_object m on am.model = m.model where m.object in (".$missingModelList.") order by a.id asc;";
    $out['missingModel'] = $this->simple($sqlMissingModel);

    return $out;
  }

  
  public function artifactsByAuthor(array $payload):array{
    try {
      if(!isset($payload['author'])){throw new \Exception("User id is required", 1);}
      $sql = "select id, name, description, created_at, status from artifact where author = :author order by created_at desc;";
      $stmt = $this->pdo()->prepare($sql);
      $stmt->execute(['author' => $payload['author']]);
      $res = $stmt->fetchAll(\PDO::FETCH_ASSOC);
      return ["error"=>0, "artifacts"=>$res];
    } catch (\Throwable $th) {
      return ["error"=>1, "message"=>$th->getMessage()];
    }

  }
}
