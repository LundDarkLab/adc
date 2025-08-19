<?php 
namespace Adc;
session_start();

class Geom extends Conn{
  function __construct(){}

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

  public function getBoundaries(int $level, string $filter): array {
    try {
      $fields = "gid_$level, st_asgeojson(`SHAPE`) as geom";
      $fields .= $level == 0 ? ", country" : ", name_$level";

      $table = 'artifact_findplace af';

      $join = "inner join artifact a on af.artifact = a.id";
      $join .= "inner join gadm_$level g on af.gid_$level = g.gid_$level";

      $where = "WHERE a.status = 2";

      if (!empty($filter)) {
        $where .= $level == 0 ? " and g.country = '$filter'" : " and g.gid_$level = '$filter'";
      }
           
      $sql = "select $fields from $table $join $where ;";
      return ["query"=>$sql,"items"=>$this->simple($sql)];
    } catch (\Throwable $th) {
      return ["error" => "API Error: " . $th->getMessage()];
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