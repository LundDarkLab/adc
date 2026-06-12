<?php
namespace Adc;
session_start();

use Adc\Get;
class Stats extends Conn{
  public $get;
  public function __construct() {
    $this->get = new Get();
  }

  public function statIndex(){
    return [
      "artifact" => $this->artifactTot(),
      "model" => $this->modelTot(),
      "institution" => $this->institutionTot(),
      "files" => $this->filesTot(),
      "typeChronologicalDistribution" => $this->typeChronologicalDistribution(),
      "institutionDistribution" => $this->institutionDistribution()
    ];
  }
 
  public function artifactTot(){
    return $this->simple("select count(*) tot from artifact where status = 2;")[0];
  }
  public function modelTot(){
    return $this->simple("select count(*) tot from model where status = 2;")[0];
  }
  public function institutionTot(){
    return $this->simple("select count(*) tot from institution;")[0];
  }
  public function filesTot(){
    return $this->simple("select count(*) tot from files;")[0];
  }

  public function typeChronologicalDistribution(array $payload = []): array{
    $filters = ["artifact.start <= c.end", "artifact.end >= c.start"];
    // if(!isset($_SESSION['id'])){ $filters[] = "artifact.status = 2";}
    if(isset($payload['id'])){ $filters[] = "artifact.category_class = ".$payload['id']; }
    $sql = "SELECT c.definition crono, count(*) tot, c.start, c.end
            FROM cultural_generic_period c, artifact
            WHERE ".join(" AND ", $filters)."
            GROUP BY c.definition, c.start, c.end
            ORDER BY c.id ASC;";
    return $this->simple($sql);
  }
  public function institutionDistribution(array $payload = []): array{
    $filter = [];
    // if(!isset($_SESSION['id'])){ $filter[] = "a.status = 2";}
    if(isset($payload['filter'])){ $filter = array_merge($filter, $payload['filter']); }
    $where = !empty($filter) ? "WHERE " . join(" AND ", $filter) : "";
    $sql = "select i.name, count(a.id) tot, i.color from institution i inner join artifact a on a.storage_place = i.id ".$where." group by i.id;";
    return $this->simple($sql);
  }

  public function artifactByCounty(array $filter){
    $where = 'WHERE a.status = 2 ';
    if(!empty($filter)){
        $where = $where . " and ". join(" AND ", $filter);
    }
    
    $sql = "SELECT g.gid_1, g.name_1, ST_AsGeoJSON(g.SHAPE) AS geometry, a.tot
      FROM gadm1 g
      INNER JOIN (
        SELECT af.gid_1, COUNT(*) AS tot, g2.name_1
        FROM artifact_findplace af
        INNER JOIN artifact a ON af.artifact = a.id
        INNER JOIN gadm1 g2 ON af.gid_1 = g2.gid_1
        {$where}
        GROUP BY af.gid_1, g2.name_1
        HAVING COUNT(*) > 0
        ORDER BY g2.name_1 ASC
      ) a ON g.gid_1 = a.gid_1";
    return $this->simple($sql);
  }
}
