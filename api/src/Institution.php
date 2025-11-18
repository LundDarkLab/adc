<?php
namespace Adc;
session_start();
use \Adc\File;
class Institution extends Conn{
  public $fileCls;
  public $logoFolder;
  function __construct(){
    $this->fileCls = new File();
    
    // Same detection
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($requestUri, '/prototype_dev/') !== false) {
      $rootFolder = '/prototype_dev';
    } elseif (strpos($requestUri, '/plus/') !== false) {
      $rootFolder = '/plus';
    } else {
      $rootFolder = '';
    }
    $this->logoFolder = $_SERVER['DOCUMENT_ROOT'] . $rootFolder . "/img/logo/";
  }

  public function categoryList(){
    return $this->simple("select distinct c.id, c.value from list_institution_category c inner join institution i on i.category = c.id order by 2 asc;");
  }

  public function institutionsList(){
    return $this->simple("select id, name from institution order by name asc;");
  }

  public function locationList(){
    return $this->simple("select distinct geo.`OGR_FID`, geo.gid_0, geo.name_1 `district` from institution i join gadm1 geo on ST_Within(ST_SRID(Point(i.lon, i.lat), 4326), geo.`SHAPE`) order by geo.name_1 asc;");
  }

  public function getInstitutions(array $payload = []): array {
    $filters = [];
    if (!empty($payload['filters'])) {
      if(isset($payload['filters']['id']) && is_int($payload['filters']['id'])) {
        $filters[] = 'i.id = '.$payload['filters']['id'];
      } 
      if(isset($payload['filters']['category']) && is_int($payload['filters']['category'])) {
        $filters[] = 'i.category = '.$payload['filters']['category'];
      }
      if(isset($payload['filters']['location']) && is_int($payload['filters']['location'])) {
        $filters[] = 'ST_Within(ST_SRID(Point(i.lon, i.lat), 4326), (select geo.`SHAPE` from gadm1 geo where geo.`OGR_FID` = '.$payload['filters']['location'].'))';
      }
      if(isset($payload['filters']['description']) && is_string($payload['filters']['description'])) {
        $desc = trim($payload['filters']['description']);
        $filters[] = "(i.name LIKE '%".$desc."%' OR i.abbreviation LIKE '%".$desc."%' OR i.address LIKE '%".$desc."%')";
      }
    }
    $where = '';
    if (count($filters) > 0) {
      $where = "WHERE " . join(" AND ", $filters);
    }
    $sql = "SELECT i.id, i.name, i.abbreviation, cat.id as category_id, cat.value AS category, i.city, i.address, i.lat, i.lon, i.url, i.logo, COALESCE(b.tot, 0) AS artifact_count FROM institution i INNER JOIN list_institution_category cat ON i.category = cat.id LEFT JOIN (SELECT owner, COUNT(*) AS tot FROM artifact GROUP BY owner) b ON b.owner = i.id ".$where." ORDER BY i.id ASC;";
    return $this->simple($sql);
  }

  public function addInstitution(array $dati, $file){
    // return [$dati, $file];
    try {
      if(count($file) > 0){
        // $folder = $_SERVER['DOCUMENT_ROOT']."/prototype/img/logo/";
        $ext = explode('.', $file['logo']['name']);
        $ext = array_pop($ext);
        $ext = mb_strtolower(strval($ext));
        $dati['logo'] = $dati['abbreviation']."_logo.".$ext;
        $this->fileCls->upload($file['logo'],$this->logoFolder,$dati['logo'], 'image');
      }
      $sql = $this->buildInsert('institution', $dati);
      $this->prepared($sql, $dati);
      return ["res"=>1, "output"=>'Ok, the item has been successfully created'];
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }
  
  public function editInstitution(array $dati, $file){
    try {
      if(count($file) > 0){
        $logo = $this->simple("select logo from institution where id = ".$dati['id'].";");
        if ($logo[0]['logo']) {
          $path = $this->logoFolder.$logo[0]['logo'];
          $this->fileCls->deleteFile($path);
        }
        $ext = explode('.', $file['logo']['name']);
        $ext = array_pop($ext);
        $ext = mb_strtolower(strval($ext));
        $dati['logo'] = $dati['abbreviation']."_logo.".$ext;
        $this->fileCls->upload($file['logo'],$this->logoFolder,$dati['logo'], 'image');
      }
      $sql = $this->buildupdate('institution',array("id"=>$dati['id']), $dati );
      $this->prepared($sql, $dati);
      return ["res"=>1, "output"=>'Ok, the item has been successfully updated'];
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage(), "logofolder"=>$this->logoFolder];
    }
  }

  public function deleteInstitution(int $id){
    try {
      $logo = $this->simple("select logo from institution where id = ".$id.";");
      if ($logo[0]['logo']) {
        // $folder = $_SERVER['DOCUMENT_ROOT']."/prototype/img/logo/";
        $path = $this->logoFolder.$logo[0]['logo'];
        $this->fileCls->deleteFile($path);
      }
      $dati = array("id"=>$id);
      // $sql = $this->buildDelete('institution', $dati);
      $sql = "delete from institution where id = :id;";
      $this->prepared($sql,$dati);
      return ["res"=>1, "output"=>'Ok, the item has been successfully deleted'];
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }

}
?>
