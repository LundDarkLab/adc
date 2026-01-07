<?php 
namespace Adc;
session_start();
use Adc\Conn;
class Timeline{
  public $pdo;
  public function __construct() {
    $this->pdo = new Conn();
  }

  public function checkTimelineName(array $payload):array{
    $res = $this->pdo->read(table:'time_series', columns:['id'], conditions:['definition'=>$payload['name']]);
    if (count($res) > 0) { return ['error' => 1, 'message' => 'Timeline name already exists']; }
    return ['error' => 0, 'message' => 'Timeline name is available'];
  }

  public function updateTimelineName(array $payload):array{
    try {
      $this->pdo->beginTransaction();
      $this->pdo->update(
        table:'time_series',
        data:['definition'=>$payload['name']],
        conditions:['id'=>$payload['id']]
      );
      $this->pdo->commit();
      return ['error' => 0, 'message' => 'Timeline name updated successfully'];
    } catch (\Throwable $th) {
      $this->pdo->rollBack();
      return ['error' => 1, 'message' => $th->getMessage()];
    }
  }

  public function updateTimelineState(array $payload):array{
    try {
      $this->pdo->beginTransaction();
      $this->pdo->update(
        table:'time_series',
        data:['state'=>$payload['state']],
        conditions:['id'=>$payload['id']]
      );
      $this->pdo->commit();
      return ['error' => 0, 'message' => 'Timeline state updated successfully'];
    } catch (\Throwable $th) {
      $this->pdo->rollBack();
      return ['error' => 1, 'message' => $th->getMessage()];
    }
  }

  public function saveTimeline(array $payload):array{
    try {
      // return $payload;
      $this->pdo->beginTransaction();

      // inserisci la serie
      $this->pdo->create(
        table:'time_series',
        data:[
          'definition'=>$payload['name'], 
          'state'=>$payload['state'], 
          'author'=>$_SESSION['id']
        ]
      );

      // recupera l'id della serie
      $serieId = $this->pdo->lastInsertId();

      // associa id serie e inserisci macro
      $macroMap = [];
      foreach ($payload['macro'] as $row) {
        $macro = $row['id'];
        if (!isset($macroMap[$macro])) {
          $this->pdo->create(
            table:'time_series_macro',
            data:[
              'serie'=>$serieId, 
              'macro'=>$macro, 
              'start'=>$row['start'],
              'end'=>$row['end']
            ]
          );
          $macroMap[$macro] = $this->pdo->lastInsertId();
        }
      }

      // associa id macro e inserisci generic
      $genericMap = [];
      foreach ($payload['generic'] as $row) {
        $macro = $macroMap[$row['macro_id']];
        $id = $row['id'];
        if (!isset($genericMap[$id])) {
          $this->pdo->create(
            table:'time_series_generic',
            data:[
              'macro'=>$macro, 
              'definition'=>$row['definition'],
              'start'=>$row['start'],
              'end'=>$row['end']
            ]
          );
          $genericMap[$id] = $this->pdo->lastInsertId();
        }
      }

      // associa id generic e inserisci specific
      foreach ($payload['specific'] as $row) {
        $generic_id = $genericMap[$row['generic_id']];
        $this->pdo->create(
          table:'time_series_specific',
          data:[
            'generic' => $generic_id,
            'definition' => $row['definition'],
            'start' => $row['start'],
            'end' => $row['end']
          ]
        );
      }
      $this->pdo->commit();
      return ['error' => 0, 'message' => 'Timeline created successfully'];
    } catch (\Throwable $th) {
      $this->pdo->rollBack();
      return ['error' => 1, 'message' => $th->getMessage()];
    }
  }

  public function getTimelineList(array $filter):array{
    $payload = [
      "table"=>$filter['table'] ?? 'time_series',
      "columns"=>$filter['columns'] ?? ['*'],
      "conditions"=>$filter['conditions'] ?? [],
      "joins"=>$filter['joins'] ?? [],
      "orderBy"=>$filter['orderBy'] ?? [],
      "limit"=>$filter['limit'] ?? null,
      "offset"=>$filter['offset'] ?? null,
      "groupBy"=>$filter['groupBy'] ?? [],
      "having"=>$filter['having'] ?? [],
    ];
    return $this->pdo->read(
      $payload['table'], 
      $payload['columns'], 
      $payload['conditions'], 
      $payload['joins'], 
      $payload['orderBy'], 
      $payload['limit'], 
      $payload['offset'], 
      $payload['groupBy'],
      $payload['having'],
    );
  }
  
  public function getTimelineBounds(array $data):array{
    error_log("getTimelineBounds called with data: " . print_r($data, true));
    if(!isset($data['conditions']['timeline'])) { throw new \Exception("timelineId is required"); }
    $timeline = $data['conditions']['timeline'];
    $res = [];
    try {
      $macro = $this->getTimelineList([
        'table'=>'time_series_complete',
        'columns'=>['macro_id', 'macro', 'MIN(start) as start', 'MAX(end) as end'],
        'conditions'=>['timeline_id'=>$timeline],
        'orderBy'=>['MIN(start)'=>'ASC'],
        'groupBy'=>['macro_id', 'macro'],
        'having'=>['MIN(start) IS NOT NULL', 'MAX(end) IS NOT NULL']
      ]);
      foreach ($macro as $m) {
        $res[$m['macro_id']] = $m;
        $generic = $this->getTimelineList([
          'table'=>'time_series_complete',
          'columns'=>['generic_id', 'generic', 'MIN(start) as start', 'MAX(end) as end'],
          'conditions'=>['timeline_id'=>$timeline, 'macro_id'=>$m['macro_id']],
          'orderBy'=>['MIN(start)'=>'ASC'],
          'groupBy'=>['generic_id', 'generic'],
          'having'=>['MIN(start) IS NOT NULL', 'MAX(end) IS NOT NULL']
        ]);
        foreach ($generic as $g) {
          $res[$m['macro_id']][$g['generic_id']] = $g;
          $specific = $this->getTimelineList([
            'table'=>'time_series_complete',
            'columns'=>['specific_id', '`specific`', '`start`', '`end`'],
            'conditions'=>[
              'timeline_id'=>$timeline, 
              'macro_id'=>$m['macro_id'], 
              'generic_id'=>$g['generic_id'],
              'start'=>['IS NOT NULL'],
              'end'=>['IS NOT NULL'],
            ],
            'orderBy'=>['start'=>'ASC'],
          ]);
          foreach ($specific as $s) {
            $res[$m['macro_id']][$g['generic_id']][$s['specific_id']] = $s;
          }
        }
      }
      return $res;
    } catch (\Throwable $th) {
      return ['error' => 1, 'message' => $th->getMessage()];
    }
  } 

  public function getTimelineDetails(array $data):array{
    try {
      $res = [
        "timeline"=>[],
        "macro"=>[],
        "generic"=>[],
        "specific"=>[],
      ];

      $res['timeline'] = $this->pdo->read(
        table:'time_series',
        columns:['time_series.id', 'time_series.definition', 'time_series.state','user.id user', 'concat(person.first_name," ",person.last_name) as `author`'],
        conditions:['time_series.id'=>$data['timelineId']],
        joins:[
          ['table' => 'user', 'first' => 'user.id', 'operator' => '=', 'second' => 'time_series.author'],
          ['table' => 'person', 'first' => 'person.id', 'operator' => '=', 'second' => 'user.person']
        ]
      );

      $res['macro'] = $this->pdo->read(
        table:'time_series_macro macro',
        columns:['macro.id','macro.macro', 'macro_def.definition', 'macro.start', 'macro.end'],
        joins: [
          ['table' => 'time_series_macro_definition macro_def', 'first' => 'macro_def.id', 'operator' => '=', 'second' => 'macro.macro']
        ],
        conditions:['macro.serie'=>$data['timelineId']],
        orderBy: ['macro.id'=>'ASC']
      );
      
      $res['generic'] = $this->pdo->read(
        table:'time_series_generic generic',
        columns:['generic.id','macro.id as macro_id', 'macro_def.definition as macro', 'generic.definition as generic', 'generic.start', 'generic.end'],
        joins: [
          ['table' => 'time_series_macro macro', 'first' => 'macro.id', 'operator' => '=', 'second' => 'generic.macro'],
          ['table' => 'time_series_macro_definition macro_def', 'first' => 'macro_def.id', 'operator' => '=', 'second' => 'macro.macro']
        ],
        conditions:['macro.serie'=>$data['timelineId']],
        orderBy: ['macro_def.id'=>'ASC', 'generic.id'=>'ASC']
      );

      $res['specific'] = $this->pdo->read(
        table:'time_series_complete',
        columns:['*'],
        conditions:['timeline_id'=>$data['timelineId']]
      );
      return $res;
    } catch (\Throwable $th) {
      return ['error' => 1, 'message' => $th->getMessage()];
    }
  }

  public function getMacroList():array{
    $payload = [
      "table"=>'time_series_macro_definition',
      "columns"=>['id', 'definition'],
      "conditions"=>[],
      "orderBy"=>["id"=>'ASC']
    ];
    return $this->pdo->read($payload['table'], $payload['columns'], $payload['conditions'], [], $payload['orderBy']);
  }

  
  public function getGenericList(array $data):array{
    $payload = [
      "table"=>'time_series_generic',
      "columns"=>['id', 'definition'],
      "conditions"=>['macro'=>$data['macroId']],
      "orderBy"=>["definition"=>'ASC']
    ];
    return $this->pdo->read($payload['table'], $payload['columns'], $payload['conditions'], [], $payload['orderBy']);
  }
}

?>