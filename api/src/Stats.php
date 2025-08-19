<?php
namespace Adc;
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
 
  public function artifactTot(){ return $this->simple("select count(*) tot from artifact where status = 2;")[0]; }
  public function modelTot(){ return $this->simple("select count(*) tot from model where status = 2;")[0]; }
  public function institutionTot(){ return $this->simple("select count(*) tot from institution;")[0]; }
  public function filesTot(){ return $this->simple("select count(*) tot from files;")[0]; }

  public function typeChronologicalDistribution(int $type = null){
    $filter = $type !== null ? "artifact.category_class = ".$type." and ": ''; 
    $sql = "select c.definition crono, count(*) tot, c.start, c.end
    from cultural_generic_period c, artifact 
    where 
      ".$filter."
      artifact.start between c.start and c.end 
      and artifact.end between c.start and c.end 
      and artifact.status = 2
    group by c.definition, c.start, c.end
    order by c.id asc;";
    return $this->simple($sql);
  }
  public function institutionDistribution(int $i = null){
    $filter = $i != null ? 'and i.id = '.$i : '';
    $sql = "select i.name, count(a.id) tot, i.color from institution i inner join artifact a on a.storage_place = i.id where a.status = 2 ".$filter." group by i.id;";
    return $this->simple($sql);
  }

  public function artifactByCounty(array $filter){
    $where = 'WHERE a.status = 2 ';
    if(count($filter) > 0){ 
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
    
    error_log("SQL: ".$sql);
    
    return $this->simple($sql);
  }
}

?>