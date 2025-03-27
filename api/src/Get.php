<?php
namespace Adc;

use Adc\Traits\ReadSelectParametersTrait;

class Get extends Conn{
  function __construct(){}
  use ReadSelectParametersTrait;

  public function getSelectOptions(string $list, $filter = null, $orderBy=null){
    $where = '';
    $field = '';
    switch ($list) {
      case 'material':
        return $this->getMaterial();
      break;
      case 'institution':
        $field = "id, concat(abbreviation, ' - ',name) as value";
      break;
      case 'person':
        $field = "id, concat(last_name, ' ',first_name) as name";
      break;
      case 'user':
        $field = "u.id, concat(p.last_name, ' ',p.first_name) as name";
        $list = "user u inner join person p on u.person = p.id ";
      break;
      case 'license':
        $field = "id, concat(acronym, ' - ',license) as name";
      break;
      case 'city':
        $field = "id, concat(name,' (', iso, ')') name, county";
      break;
      case 'county':
        $field = "id, concat(name,' (', iso, ')') name";
      break;
      case 'jsonCity':
        $field = "'city' as type, name, st_asgeojson(shape) geometry";
        $list = 'city';
      break;
      case 'jsonCounty':
        $field = "'county' as type, name, st_asgeojson(shape) geometry";
        $list = 'county';
      break;
      case 'jsonNation':
        $field = "id, name, st_asgeojson(shape) geometry";
        $list = 'nation';
      break;
      default: $field = '*'; break;
    }
    if($filter){$where = "where ".$filter;}
    $sort = $orderBy ? $orderBy : 2;
    $out = "select ".$field." from ".$list." ".$where." order by ".$sort." asc;";
    return $this->simple($out);
  }
  public function getMaterial(){
    $out = [];
    $sqlClass = "select s.id, s.value from list_material_class c inner join list_material_specs s on s.material_class = c.id where s.value = c.value order by 2 asc;";
    $sqlSpecs = "select s.id, s.value from list_material_class c inner join list_material_specs s on s.material_class = c.id where s.value != c.value order by 2 asc;";
    $out['class'] = $this->simple($sqlClass);
    $out['specs'] = $this->simple($sqlSpecs);
    return $out;
  }

  public function getFilterList(){
    $out['category'] = $this->simple("select l.id, l.value from list_category_class l inner join artifact a on a.category_class = l.id group by l.id order by 2 asc;");
    $out['material'] = $this->simple("select l.id, l.value from list_material_specs l inner join artifact_material_technique a on a.material = l.id group by l.id order by 2 asc;");
    $out['institution'] = $this->simple("select i.id, i.name value from institution i inner join artifact a on a.storage_place = i.id group by i.id order by 2 asc;");
    return $out;
  }

  public function getCountyByCity(int $city){
    $sql = "select county.id, county.name from county, city where city.id = ".$city." and city.county = county.id;";
    return $this->simple($sql)[0];
  }
  public function checkName(array $data){
    $sql = "select id from ".$data['element']." where name = '".$data['name']."';";
    return $this->simple($sql);
  }

  function getTimeSeries(array $filters){
    $where = "where ".join(" and ", $filters);
    $sql = "SELECT macro.id AS macro_id, macro.definition AS macro_definition, MIN(spec.start) AS macro_min_start, MAX(spec.end) AS macro_max_end, generic.id AS generic_id, generic.definition AS generic_definition, MIN(spec.start) AS generic_min_start, MAX(spec.end) AS generic_max_end, spec.id AS specific_id, spec.definition AS specific_definition, spec.start AS specific_start, spec.end AS specific_end FROM time_series_macro macro JOIN time_series_generic generic ON generic.macro = macro.id JOIN time_series_specific spec ON spec.generic = generic.id ".$where." GROUP BY macro.id, generic.id, spec.id ORDER BY macro.id, generic.id, spec.id;";
    return $this->simple($sql);
  }

  public function chronoFilter(){
    $out = [];
    $macroQuery = "select macro.id as id, macro.definition as definition, MIN(spec.start) AS start, MAX(spec.end) AS end from time_series_macro macro JOIN time_series_generic generic ON generic.macro = macro.id JOIN time_series_specific spec ON spec.generic = generic.id where macro.serie = 2 GROUP BY macro.id order by macro.id asc;";
    $out['macro'] = $this->simple($macroQuery);
    foreach ($out['macro'] as $key => $value) {
      $genericQuery = "select generic.id as id, generic.definition as definition, MIN(spec.start) AS start, MAX(spec.end) AS end from time_series_generic generic JOIN time_series_specific spec ON spec.generic = generic.id where generic.macro = ".$value['id']." GROUP BY generic.id order by generic.id asc;";
      $out['macro'][$key]['generic'] = $this->simple($genericQuery);
      foreach ($out['macro'][$key]['generic'] as $key2 => $value2) {
        $specificQuery = "select id, generic, definition, start, end from time_series_specific where generic = ".$value2['id']." order by id asc;";
        $out['macro'][$key]['generic'][$key2]['specific'] = $this->simple($specificQuery);
      }
    }
    return $out;
  }

  public function getVocabulary(array $payload):array{
    $out = [];
    $table = $payload['table'];
    $defaultJoin = [
      ["table" => 'artifact', "column" => 'conservation_state', "join" => 'list_conservation_state'],
      ["table" => 'artifact', "column" => 'license', "join" => 'license'],
      ["table" => 'artifact', "column" => 'object_condition', "join" => 'list_object_condition'],
      ["table" => 'files', "column" => 'filetype', "join" => 'list_file_type'],
      ["table" => 'institution', "column" => 'category', "join" => 'list_institution_category'],
      ["table" => 'model_param', "column" => 'acquisition_method', "join" => 'list_model_acquisition'],
      ["table" => 'person', "column" => 'position', "join" => 'list_person_position'],
      ["table" => 'user', "column" => 'role', "join" => 'list_user_role'],
    ];
    switch ($table) {
      case 'list_category_class':
        $payload['columns'] = ["{$table}.id", "{$table}.value", "count(artifact.category_class) tot" ]; 
        $payload['joins']= [
          ["table" => "artifact", "first" => "artifact.category_class", "operator" => "=", "second" => "{$table}.id","type" => "left"]
        ]; 
        $payload['orderBy'] = ["{$table}.value"=>"asc"]; 
        $payload['groupBy'] = ["{$table}.id", "{$table}.value"];
        break;

      case 'list_category_specs':
        $payload['columns'] = ["{$table}.id", "{$table}.category_class", "{$table}.value", "count(artifact.category_specs) tot" ];
        $payload['joins']= [
          ["table" => "artifact", "first" => "artifact.category_specs", "operator" => "=", "second" => "{$table}.id","type" => "left"]
        ];
        $payload['orderBy'] = ["{$table}.value"=>"asc"];
        $payload['groupBy'] = ["{$table}.id", "{$table}.category_class", "{$table}.value"];
        $out['lists'] = $this->read("list_category_class", ['*'], [], [], ['value'=>'asc']);
        break;

      case 'list_material_class':
        $payload['columns'] = ["{$table}.id", "{$table}.value", "count(list_material_class.value) tot" ];
        $payload['joins']= [
          ["table" => "list_material_specs", "first" => "list_material_specs.material_class", "operator" => "=", "second" => "{$table}.id","type" => "inner"],
          ["table" => "artifact_material_technique", "first" => "artifact_material_technique.material", "operator" => "=", "second" => "list_material_specs.id","type" => "left"]
        ];
        $payload['orderBy'] = ["{$table}.value"=>"asc"];
        $payload['groupBy'] = ["{$table}.id", "{$table}.value"];
        break;

      case 'list_material_specs':
          $payload['columns'] = ["{$table}.id", "{$table}.material_class", "{$table}.value", "count(artifact_material_technique.material) tot" ];
          $payload['joins']= [
            ["table" => "artifact_material_technique", "first" => "artifact_material_technique.material", "operator" => "=", "second" => "{$table}.id","type" => "left"]
          ];
          $payload['orderBy'] = ["{$table}.value"=>"asc"];
          $payload['groupBy'] = ["{$table}.id", "{$table}.material_class", "{$table}.value"];
          $out['lists'] = $this->read("list_material_class", ['*'], [], [], ['value'=>'asc']);
          break;
        
      case 'license':
          $payload['columns'] = ["{$table}.id", "{$table}.acronym", "{$table}.license", "{$table}.link", "{$table}.file", "count(artifact.license) tot" ];
          $payload['joins']= [
            ["table" => "artifact", "first" => "artifact.license", "operator" => "=", "second" => "{$table}.id", "type" => "left"]
          ];
          $payload['groupBy'] = ["{$table}.id", "{$table}.acronym", "{$table}.license", "{$table}.link", "{$table}.file" ];
          $payload['orderBy'] = ["{$table}.acronym"=>"asc", "{$table}.license"=>"asc"];
        break;

      default:
        $match = false;
        foreach ($defaultJoin as $key => $value) {
          if(trim($table) == trim($value['join'])){
            $payload['columns'] = ["{$table}.id", "{$table}.value", "count({$value['table']}.{$value['column']}) tot" ];
            $payload['joins']= [
              ["table" => $value['table'], "first" => "{$value['table']}.{$value['column']}", "operator" => "=", "second" => "{$table}.id","type" => "left"]
            ]; 
            $payload['orderBy'] = ["{$table}.value"=>"asc"]; 
            $payload['groupBy'] = ["{$table}.id", "{$table}.value"];
            $match = true;
            break;
          }
        } 
        if (!$match) {return ['error' => true,'message' => "No matching join found for table: $table"];}
        break;
    }
    $params = $this->extractReadParameters($payload);
    $out['items'] = $this->read($params['table'], $params['columns'], $params['conditions'], $params['joins'], $params['orderBy'],$params['limit'], $params['offset'], $params['groupBy'],$params['having']);
    return $out;
  }
}
?>
