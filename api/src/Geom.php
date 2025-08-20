<?php 
namespace Adc;
session_start();

class Geom extends Conn{
  function __construct(){}

  public function getAvailableLevels(): array {
    $levels = [0,1,2,3,4,5];
    $availableLevels = [];
    
    foreach ($levels as $level) {
      // Query per contare le features distinte
      $sql = "SELECT COUNT(DISTINCT af.gid_$level) as tot FROM artifact_findplace af INNER JOIN artifact a ON af.artifact = a.id WHERE a.status = 2 AND af.gid_$level IS NOT NULL;";
      
      $result = $this->simple($sql);
      
      // Gestione empty set: se non ci sono risultati, $result sarà vuoto
      if (empty($result) || !isset($result[0]['tot'])) {
        $count = 0;
      } else {
        $count = (int)$result[0]['tot'];
      }
      
      // Aggiungi solo i livelli che hanno almeno una feature
      if ($count > 0) {
        $availableLevels[] = [
          'level' => $level,
          'count' => $count,
          'name' => $this->getLevelName($level)
        ];
      }
    }
    
    return [
      'success' => true,
      'levels' => $availableLevels
    ];
  }

  // Metodo helper per i nomi dei livelli
  private function getLevelName(int $level): string {
    $levelNames = [
      0 => 'Country',
      1 => 'Provinces', 
      2 => 'Districts',
      3 => 'Municipalities',
      4 => 'Admin Boundaries Level 1',
      5 => 'Admin Boundaries Level 2'
    ];
    return $levelNames[$level] ?? "Level $level";
  }

  public function getAdminList (array $payload,): array{
    $sql='';
    if($payload['gid'] == 0 && empty($payload['filter'])){
      $sql = "select gid_0 gid, country as name from gadm0 order by 2 asc;";
    }else if(!empty($payload['filter'])){
      $nextLevel = $payload['gid'] == 5 ? $payload['gid'] : ($payload['gid'] + 1);
      $sql = "select gid_".$nextLevel." gid, name_".$nextLevel." as name from gadm".$nextLevel." where gid_".$payload['gid']." = '".$payload['filter']."' order by 2 asc;";
    }
    return ["query"=>$sql,"items"=>$this->simple($sql)];
  }

  public function getBoundaries(int $level, ?string $filter): array {
    try {
      $fields = "g.gid_$level as gid";
      $fields .= $level == 0 ? ", g.country as name" : ", g.name_$level as name";
      $geom = "st_asgeojson(g.SHAPE) as geom";

      $subquery = "SELECT af.gid_$level FROM artifact_findplace af INNER JOIN artifact a ON af.artifact = a.id WHERE a.status = 2 GROUP BY af.gid_$level";

      if (!empty($filter)) {
        $where .= $level == 0 ? " and g.country = '$filter'" : " and g.gid_$level = '$filter'";
      }

      $sql = "SELECT $fields, $geom FROM ( $subquery ) artifact INNER JOIN gadm$level g ON g.gid_$level = artifact.gid_$level;";
      
      return ["query"=>$sql,"items"=>$this->simple($sql)];
    } catch (\Throwable $th) {
      return ["error" => "API Error: " . $th->getMessage(), "sql" => $sql];
    }
  }

  public function getInstitutionPoint(?int $id): array {
    try {
      $where = $id === null ? '' : "WHERE id = $id";
      $sql = "SELECT id, name, abbreviation, lat,lon, logo FROM institution $where order by name asc;";
      return ["query"=>$sql,"items"=>$this->simple($sql)];
    } catch (\Throwable $th) {
      return ["error" => "API Error: " . $th->getMessage(), "sql" => $sql];
    }
  }

  public function getFindPlacePoint(?int $id): array {
    try {
      $where = "where a.status = 2 and af.longitude is not null and af.latitude is not null";
      $where .= $id === null ? '' : " and id = $id";
      $sql = "select a.name, a.description, af.latitude, af.longitude from artifact_findplace af inner join artifact a on af.artifact = a.id $where order by a.name asc;";
      return ["query"=>$sql,"items"=>$this->simple($sql)];
    } catch (\Throwable $th) {
      return ["error" => "API Error: " . $th->getMessage(), "sql" => $sql];
    }
  }

  /**
 * Returns administrative areas according to the specified level.
 * @param int $level The level of the administrative area to be searched 0-5.
 * @param string $filter The "gid_$level" field used as filter condition.
 * @param string $type The type of geometry to search, the possible values are: single, collection.
 */
  public function administrativeBoundaries(int $level, string $filter, string $type){
    $current = $level;
    if($type === 'collection' && $level < 5) {$current = $level + 1;}
    $sql = "select gid_".$current." gid, name_".$current." as name, st_asgeojson(`SHAPE`) as geom from gadm".$current." where gid_".$level." = '".$filter."';";
    $items = $this->simple($sql);
    if(count($items) == 0){
      $sql = "select gid_".$level." gid, name_".$level." as name, st_asgeojson(`SHAPE`) as geom from gadm".$level." where gid_".$level." = '".$filter."';";
      $items = $this->simple($sql);
    }
    error_log("SQL: $sql");
    return ["query"=>$sql,"items"=>$items];
  }

  public function reverseGeoLocation(array $ll){
    $out = [];
    $condition = "where st_contains(`SHAPE`, ST_SRID(ST_GeomFromText('POINT(".$ll[0]." ".$ll[1].")'), 4326))";
    $levels = [
      5 => "gid_0, gid_1, gid_2, gid_3, gid_4, gid_5, country, name_1, name_2, name_3, name_4, name_5",
      4 => "gid_0, gid_1, gid_2, gid_3, gid_4, country, name_1, name_2, name_3, name_4",
      3 => "gid_0, gid_1, gid_2, gid_3, country, name_1, name_2, name_3",
      2 => "gid_0, gid_1, gid_2, country, name_1, name_2",
      1 => "gid_0, gid_1, country, name_1"
    ];

    foreach ($levels as $level => $fields) {
      $sql = "select $fields from gadm$level $condition order by country, name_1 asc;";
      $data = $this->simple($sql);
      if (!empty($data)) {
        $geo = "select gid_$level, name_$level, st_asgeojson(`SHAPE`) as geom from gadm$level $condition;";
        $out['data'] = $data[0];
        $out["geoJson"] = $this->simple($geo)[0];
        $out['query'] = $sql;
        $out['geoQuery'] = $geo;
        return $out;
      }
    }
    return ["res"=>0];
  }
}
?>