<?php 
namespace Adc;
session_start();

use Adc\Traits\ReadSelectParametersTrait;

class Geom extends Conn{
  use ReadSelectParametersTrait;

  function __construct(){}

  public function getAvailableLevels(array $payload): array {
    // $levels = [0,1,2,3,4,5];
    $availableLevels = [];
    error_log("Payload received: " . print_r($payload, true));
    if (!isset($payload['levels']) || !is_array($payload['levels'])) {
      return ['success' => false, 'message' => 'Invalid levels parameter'];
    }
    foreach ($payload['levels'] as $level) {
      // Query per contare le features distinte
      $sql = "SELECT COUNT(DISTINCT af.gid_$level) as tot FROM artifact_findplace af INNER JOIN artifact a ON af.artifact = a.id and a.status = 2 AND af.gid_$level IS NOT NULL;";

      error_log("SQL for level $level: $sql");
      
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

  public function getBoundaries(array $payload): array {
    $start = microtime(true);
    try {
      $level = $payload['level'] ?? 0;
      $filter = $payload['filter'] ?? null;
      $status = !isset($payload['status']) ? ' and a.status = 2 ' : '';

      $tolerances = [0 => 3000, 1 => 100, 2 => 80, 3 => 60, 4 => 40, 5 => 20];
      $tolerance = $tolerances[$level] ?? 20;

      $fields = "g.gid_$level as gid";
      $fields .= $level == 0 ? ", g.country as name" : ", g.name_$level as name";
      $geom = "ST_AsGeoJSON(ST_Transform(ST_Simplify(ST_Transform(g.SHAPE, 3857), $tolerance), 4326)) as geom";

      $subquery = "SELECT af.gid_$level FROM artifact_findplace af INNER JOIN artifact a ON af.artifact = a.id $status GROUP BY af.gid_$level";
      $where = "";
      if (!empty($filter)) {
        $where = " WHERE ";
        if(is_array($filter)){
          $where .= implode(" AND ", $filter);
        } else {
          $where .= " $filter ";
        }
      }

      $sql = "SELECT $fields, $geom FROM ( $subquery ) artifact INNER JOIN gadm$level g ON g.gid_$level = artifact.gid_$level $where;";
      error_log("SQL: $sql");
      error_log("filter: $filter");
      $result = $this->simple($sql);
      $end = microtime(true);
      error_log("level: $level, tolerance: $tolerance");
      error_log("getBoundaries query time: " . ($end - $start) . " seconds for level " . $level);
      return ["query"=>$sql,"items"=>$result];
    } catch (\Throwable $th) {
      return ["error" => "API Error: " . $th->getMessage(), "sql" => $sql];
    }
  }

  public function getInstitutionPoint(array $payload): array {
    try {
      $id = $payload['id'] ?? null;
      $filter = $id === null ? '' : "and i.id = $id";
      $sql = "SELECT i.id, i.name, i.abbreviation, i.lat, i.lon, i.logo, count(a.id) AS count FROM institution i INNER JOIN artifact a ON a.storage_place = i.id where a.status = 2 $filter GROUP BY i.id, i.name, i.abbreviation, i.lat, i.lon, i.logo ORDER BY i.name ASC;";
      return ["query"=>$sql,"items"=>$this->simple($sql)];
    } catch (\Throwable $th) {
      return ["error" => "API Error: " . $th->getMessage(), "sql" => $sql];
    }
  }

  public function getFindPlacePoint(array $payload): array {
    try {
      $id = $payload['id'] ?? null;
      $payload = [
        'table' => 'artifact_findplace af',
        'columns' => ['a.id', 'a.name', 'class.value AS category', 'i.name as institution', 'a.description', 'a.start', 'a.end', 'af.latitude', 'af.longitude', "COALESCE(gadm0.country, '') AS nation", "COALESCE(gadm1.name_1, '') AS county", 'm.thumbnail'],
        'conditions' => $id !== null ? ['a.id' => $id] : [],
        'joins' => 
          [
            ['table' => 'artifact a', 'first' => 'af.artifact', 'operator' => '=', 'second' => 'a.id AND a.status = 2 AND af.longitude IS NOT NULL AND af.latitude IS NOT NULL'],
            ['table' => 'institution i', 'first' => 'a.storage_place', 'operator' => '=', 'second' => 'i.id'],
            ['table' => 'list_category_class class', 'first' => 'a.category_class', 'operator' => '=', 'second' => 'class.id'],
            ['table' => 'artifact_model am', 'first' => 'am.artifact', 'operator' => '=', 'second' => 'a.id'],
            ['table' => 'model m', 'first' => 'am.model', 'operator' => '=', 'second' => 'm.id'],
            ['table' => 'gadm0', 'first' => 'af.gid_0', 'operator' => '=', 'second' => 'gadm0.gid_0', 'type' => 'left'],
            ['table' => 'gadm1', 'first' => 'af.gid_1', 'operator' => '=', 'second' => 'gadm1.gid_1', 'type' => 'left']
          ],
        'orderBy' => ['a.name' => 'asc']
      ];

      $params = $this->extractReadParameters($payload);
      $results = $this->read(
        $params['table'],
        $params['columns'],
        $params['conditions'],
        $params['joins'],
        $params['orderBy'],
        $params['limit'],
        $params['offset'],
        $params['groupBy'],
        $params['having']
      );
      return ["items"=>$results];
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