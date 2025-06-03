<?php 
namespace Adc;
session_start();
use Adc\Conn;
class Timeline{
  public $pdo;
  public function __construct() {
    $this->pdo = new Conn();
  }

  public function saveTimeline(array $payload):array{
    try {
      $this->pdo->beginTransaction();

      // inserisci la serie
      $this->pdo->create(
        table:'time_series',
        data:['definition'=>$payload['name'], 'state'=>$payload['state'], 'author'=>$_SESSION['id']]
      );

      // recupera l'id della serie
      $serieId = $this->pdo->lastInsertId();

      // associa id serie e inserisci macro
      $macroMap = [];
      foreach ($payload['data'] as $row) {
        $macro = $row['macro_id'];
        $txt = $row['macro_text'];
        if (!isset($macroMap[$macro])) {
          $this->pdo->create(
            table:'time_series_macro',
            data:['serie'=>$serieId, 'macro'=>$macro, 'definition'=>$txt]
          );
          $macroMap[$macro] = $this->pdo->lastInsertId();
        }
      }

      // associa id macro e inserisci generic
      $genericMap = [];
      foreach ($payload['data'] as $row) {
        $macro_id = $macroMap[$row['macro_id']];
        $key = $macro_id . "|" . $row['generic'];
        if (!isset($genericMap[$key])) {
          $this->pdo->create(
            table:'time_series_generic',
            data:['macro'=>$macroMap[$row['macro_id']], 'definition'=>$row['generic']]
          );
          $genericMap[$key] = $this->pdo->lastInsertId();
        }
      }

      // associa id generic e inserisci specific
      foreach ($payload['data'] as $row) {
        $macro_id = $macroMap[$row['macro_id']];
        $key = $macro_id . "|" . $row['generic'];
        $generic_id = $genericMap[$key];
        $this->pdo->create(
          table:'time_series_specific',
          data:[
            'generic' => $generic_id,
            'definition' => $row['specific'],
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

  public function getTimelineList():array{
    $payload = [
      "table"=>'time_series',
      "columns"=>['time_series.id', 'time_series.definition', 'time_series.state'],
      "conditions"=>[],
      "joins"=>[
        // ['table' => 'user', 'first' => 'user.id', 'operator' => '=', 'second' => 'time_series.author'],
        // ['table' => 'person', 'first' => 'person.id', 'operator' => '=', 'second' => 'user.person']
      ],
      "orderBy"=>["time_series.definition"=>'ASC']
    ];
    return $this->pdo->read($payload['table'], $payload['columns'], $payload['conditions'], $payload['joins'], $payload['orderBy']);
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
        columns:['time_series.id', 'time_series.definition','user.id user', 'concat(person.first_name," ",person.last_name) as `author`'],
        conditions:['time_series.id'=>$data['timelineId']],
        joins:[
          ['table' => 'user', 'first' => 'user.id', 'operator' => '=', 'second' => 'time_series.author'],
          ['table' => 'person', 'first' => 'person.id', 'operator' => '=', 'second' => 'user.person']
        ]
      );

      $res['macro'] = $this->pdo->read(
        table:'time_series_macro macro',
        columns:['macro.id', 'macro_def.definition'],
        joins: [
          ['table' => 'time_series_macro_definition macro_def', 'first' => 'macro_def.id', 'operator' => '=', 'second' => 'macro.macro']
        ],
        conditions:['macro.serie'=>$data['timelineId']],
        orderBy: ['macro_def.id'=>'ASC']
      );
      
      $res['generic'] = $this->pdo->read(
        table:'time_series_generic generic',
        columns:['macro.id as macro_id', 'macro_def.definition as macro','generic.id as generic_id', 'generic.definition as generic'],
        joins: [
          ['table' => 'time_series_macro macro', 'first' => 'macro.id', 'operator' => '=', 'second' => 'generic.macro'],
          ['table' => 'time_series_macro_definition macro_def', 'first' => 'macro_def.id', 'operator' => '=', 'second' => 'macro.macro']
        ],
        conditions:['macro.serie'=>$data['timelineId']],
        orderBy: ['macro_def.id'=>'ASC']
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
      "orderBy"=>["definition"=>'ASC']
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

  // public function fetchUserTimeline():array { return $this->fetchTimeline(['author'=> $_SESSION['id']]); }

  // public function fetchTimeline(array $payload = []): array {
  //   $timeline = [];
  //   try {
  //     if (!is_array($payload)) { throw new \Exception("is not an array", 1); }
  //     $timeline['serie'] = $this->read('time_series', $payload);
  //     $timeline['serie'] = $this->processSeries($timeline['serie']);
  //     return $timeline;
  //   } catch (\Throwable $th) {
  //     return ['error' => 1, 'message' => $th->getMessage()];
  //   }
  // }

  // private function processSeries(array $series): array {
  //   return array_map(function ($serieItem) {
  //     $serieItem['macro'] = $this->read("time_series_macro", ['serie' => $serieItem['id']]);
  //     $serieItem['macro'] = $this->processMacros($serieItem['macro']);
  //     return $serieItem;
  //   }, $series);
  // }

  // private function processMacros(array $macros): array {
  //   return array_map(function ($macroItem) {
  //     $macroItem['generic'] = $this->read("time_series_generic", ['macro' => $macroItem['id']]);
  //     $macroItem['generic'] = $this->processGenerics($macroItem['generic']);
  //     return $macroItem;
  //   }, $macros);
  // }

  // private function processGenerics(array $generics): array {
  //   return array_map(function ($genericItem) {
  //     $genericItem['specific'] = $this->read("time_series_specific", ['generic' => $genericItem['id']]);
  //     return $genericItem;
  //   }, $generics);
  // }
}

?>