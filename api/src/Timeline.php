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

  /**
   * Salva una nuova timeline a partire da un albero annidato.
   *
   * Payload atteso:
   * [
   *   'name'  => string,
   *   'state' => 'draft'|'complete',
   *   'tree'  => [
   *     [
   *       'macroId' => int,        // FK a time_series_macro_definition
   *       'start'   => int,
   *       'end'     => int,
   *       'generics'=> [
   *         [
   *           'definition' => string,
   *           'start'      => int,
   *           'end'        => int,
   *           'specifics'  => [ ['definition'=>string,'start'=>int,'end'=>int], ... ]
   *         ], ...
   *       ]
   *     ], ...
   *   ]
   * ]
   *
   * I livelli generic/specific sono opzionali; non sono ammessi salti di livello
   * (uno specific richiede un generic, un generic richiede un macro).
   */
  public function saveTimeline(array $payload):array{
    $name  = trim($payload['name'] ?? '');
    $state = $payload['state'] ?? 'draft';
    $tree  = $payload['tree'] ?? [];

    if ($name === '') { return ['error' => 1, 'message' => 'Timeline name is required']; }
    if (!in_array($state, ['draft', 'complete'], true)) { return ['error' => 1, 'message' => 'Invalid timeline state']; }
    if (!is_array($tree) || count($tree) === 0) { return ['error' => 1, 'message' => 'Timeline must contain at least one macro period']; }

    $treeError = $this->validateTree($tree);
    if ($treeError !== null) { return ['error' => 1, 'message' => $treeError]; }

    $nameCheck = $this->checkTimelineName(['name' => $name]);
    if ($nameCheck['error'] === 1) { return $nameCheck; }

    try {
      $this->pdo->beginTransaction();

      $this->pdo->create(
        table:'time_series',
        data:[
          'definition'=>$name,
          'state'=>$state,
          'author'=>$_SESSION['id']
        ]
      );
      $serieId = $this->pdo->lastInsertId();

      $this->insertTree($serieId, $tree);

      $this->pdo->commit();
      return ['error' => 0, 'message' => 'Timeline created successfully'];
    } catch (\Throwable $th) {
      $this->pdo->rollBack();
      return ['error' => 1, 'message' => $th->getMessage()];
    }
  }

  /* Inserisce l'albero (macro -> generic -> specific) per una serie già esistente. */
  private function insertTree($serieId, array $tree):void{
    foreach ($tree as $macro) {
      $this->pdo->create(
        table:'time_series_macro',
        data:[
          'serie'=>$serieId,
          'macro'=>$macro['macroId'],
          'start'=>(int)$macro['start'],
          'end'=>(int)$macro['end']
        ]
      );
      $macroPk = $this->pdo->lastInsertId();

      foreach ($macro['generics'] ?? [] as $generic) {
        $this->pdo->create(
          table:'time_series_generic',
          data:[
            'macro'=>$macroPk,
            'definition'=>$generic['definition'],
            'start'=>(int)$generic['start'],
            'end'=>(int)$generic['end']
          ]
        );
        $genericPk = $this->pdo->lastInsertId();

        foreach ($generic['specifics'] ?? [] as $specific) {
          $this->pdo->create(
            table:'time_series_specific',
            data:[
              'generic'=>$genericPk,
              'definition'=>$specific['definition'],
              'start'=>(int)$specific['start'],
              'end'=>(int)$specific['end']
            ]
          );
        }
      }
    }
  }

  /* Cancella tutte le righe macro/generic/specific di una serie (in ordine figlio->padre). */
  private function clearTree($serieId):void{
    $serieId = (int)$serieId;
    $this->pdo->simple("DELETE s FROM time_series_specific s INNER JOIN time_series_generic g ON g.id = s.generic INNER JOIN time_series_macro m ON m.id = g.macro WHERE m.serie = {$serieId}");
    $this->pdo->simple("DELETE g FROM time_series_generic g INNER JOIN time_series_macro m ON m.id = g.macro WHERE m.serie = {$serieId}");
    $this->pdo->simple("DELETE FROM time_series_macro WHERE serie = {$serieId}");
  }

  /*
   * Aggiorna una timeline esistente: nome, stato e intero albero.
   * Gli artefatti restano agganciati per timeline_id + start/end, quindi è
   * sicuro cancellare e ricreare le righe dei livelli (gli id non sono referenziati).
   */
  public function updateTimeline(array $payload):array{
    $serieId = (int)($payload['timelineId'] ?? 0);
    $name  = trim($payload['name'] ?? '');
    $state = $payload['state'] ?? 'draft';
    $tree  = $payload['tree'] ?? [];

    if ($serieId === 0) { return ['error' => 1, 'message' => 'Timeline id is required']; }
    if ($name === '') { return ['error' => 1, 'message' => 'Timeline name is required']; }
    if (!in_array($state, ['draft', 'complete'], true)) { return ['error' => 1, 'message' => 'Invalid timeline state']; }
    if (!is_array($tree) || count($tree) === 0) { return ['error' => 1, 'message' => 'Timeline must contain at least one macro period']; }

    $treeError = $this->validateTree($tree);
    if ($treeError !== null) { return ['error' => 1, 'message' => $treeError]; }

    // nome univoco, escludendo la serie corrente
    $clash = $this->pdo->read(table:'time_series', columns:['id'], conditions:['definition'=>$name]);
    foreach ($clash as $row) {
      if ((int)$row['id'] !== $serieId) { return ['error' => 1, 'message' => 'Timeline name already exists']; }
    }

    try {
      $this->pdo->beginTransaction();
      $this->pdo->update(
        table:'time_series',
        data:['definition'=>$name, 'state'=>$state],
        conditions:['id'=>$serieId]
      );
      $this->clearTree($serieId);
      $this->insertTree($serieId, $tree);
      $this->pdo->commit();
      return ['error' => 0, 'message' => 'Timeline updated successfully'];
    } catch (\Throwable $th) {
      $this->pdo->rollBack();
      return ['error' => 1, 'message' => $th->getMessage()];
    }
  }

  /*
   * Elimina un'intera timeline. Per evitare artefatti orfani, rifiuta la
   * cancellazione se esistono artefatti che la referenziano: la ri-associazione
   * a una timeline "default" è una decisione separata da definire.
   */
  public function deleteTimeline(array $payload):array{
    $serieId = (int)($payload['timelineId'] ?? 0);
    if ($serieId === 0) { return ['error' => 1, 'message' => 'Timeline id is required']; }

    $linked = $this->pdo->read(table:'artifact', columns:['id'], conditions:['timeline'=>$serieId]);
    if (count($linked) > 0) {
      return ['error' => 1, 'message' => 'Cannot delete: ' . count($linked) . ' artifact(s) still reference this timeline.'];
    }

    try {
      $this->pdo->beginTransaction();
      $this->clearTree($serieId);
      $this->pdo->delete(table:'time_series', conditions:['id'=>$serieId]);
      $this->pdo->commit();
      return ['error' => 0, 'message' => 'Timeline deleted successfully'];
    } catch (\Throwable $th) {
      $this->pdo->rollBack();
      return ['error' => 1, 'message' => $th->getMessage()];
    }
  }

  /*
   * Rete di sicurezza server-side: rispecchia le regole dell'editor frontend.
   *  - ogni macro referenzia una definizione standard, senza duplicati;
   *  - range valido (start < end) e figlio contenuto nel range del padre;
   *  - fratelli ordinati in modo monotòno (overlap di transizione ammesso,
   *    contenimenti e start/end coincidenti vietati);
   *  - definition univoca fra i fratelli per generic/specific.
   * Ritorna un messaggio d'errore oppure null se l'albero è valido.
   */
  private function validateTree(array $tree):?string{
    $macroIds = [];
    foreach ($tree as $macro) {
      if (empty($macro['macroId'])) { return 'Each macro must reference a standard macro definition.'; }
      if (in_array($macro['macroId'], $macroIds, true)) { return 'A macro period was added more than once.'; }
      $macroIds[] = $macro['macroId'];
    }

    $err = $this->validateGroup($tree, null, false);
    if ($err !== null) { return $err; }

    foreach ($tree as $macro) {
      $generics = $macro['generics'] ?? [];
      $err = $this->validateGroup($generics, $macro, true);
      if ($err !== null) { return $err; }
      foreach ($generics as $generic) {
        $err = $this->validateGroup($generic['specifics'] ?? [], $generic, true);
        if ($err !== null) { return $err; }
      }
    }
    return null;
  }

  private function validateGroup(array $nodes, ?array $parent, bool $needDefinition):?string{
    $definitions = [];
    foreach ($nodes as $node) {
      $start = (int)$node['start'];
      $end = (int)$node['end'];
      if ($start >= $end) { return 'Start must be less than End.'; }
      if ($parent !== null && ($start < (int)$parent['start'] || $end > (int)$parent['end'])) {
        return 'A period range must be within its parent range.';
      }
      if ($needDefinition) {
        $definition = strtolower(trim($node['definition'] ?? ''));
        if ($definition === '') { return 'Definition is required.'; }
        if (in_array($definition, $definitions, true)) { return 'Definition must be unique among siblings.'; }
        $definitions[] = $definition;
      }
    }

    $count = count($nodes);
    for ($i = 0; $i < $count; $i++) {
      for ($j = $i + 1; $j < $count; $j++) {
        if ($this->badOrder($nodes[$i], $nodes[$j])) {
          return 'Periods may overlap as a transition, but one cannot contain another or share a start/end.';
        }
      }
    }
    return null;
  }

  private function badOrder(array $a, array $b):bool{
    $as = (int)$a['start']; $ae = (int)$a['end'];
    $bs = (int)$b['start']; $be = (int)$b['end'];
    return ($as <= $bs && $ae >= $be) || ($as >= $bs && $ae <= $be);
  }

  public function getTimelineList(array $filter):array{
    $payload = [
      "table"=>$filter['table'] ?? 'time_series',
      "columns"=>$filter['columns'] ?? ['*'],
      "conditions"=>$filter['conditions'] ?? [],
      "joins"=>$filter['joins'] ?? [],
      "orderBy"=>$filter['orderBy'] ?? ['definition'=>'ASC'],
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

  public function getTimeline(array $data):array{
    try {
      $out = [];
      $out['timelineMetadata'] = $this->pdo->read(
        table:'time_series t',
        columns:['t.id time_id', 't.definition time_name', 't.state time_state', 'u.id as user_id', 'concat(p.first_name," ",p.last_name) as `author`', "i.id institution_id", "i.name institution_name"],
        conditions:['t.id'=>$data['timeline_id']],
        joins:[
          ['table' => 'user u', 'first' => 'u.id', 'operator' => '=', 'second' => 't.author'],
          ['table' => 'person p', 'first' => 'p.id', 'operator' => '=', 'second' => 'u.person'],
          ['table' => 'institution i', 'first' => 'i.id', 'operator' => '=', 'second' => 'p.institution']
        ]
      )[0];
      $out['timeline'] = $this->pdo->read(
        table:'time_series_complete',
        columns:['*'],
        conditions:['timeline_id'=>$data['timeline_id']],
      );
      return $out;
    } catch (\Throwable $th) {
      return ['error' => 1, 'message' => $th->getMessage()];
    }
  }

  public function getTimelineChronoGroups(array $data):array{
    try {
      $res = [
        "macro"=>[],
        "generic"=>[],
        "specific"=>[],
      ];

      $res['macro'] = $this->pdo->read(
        table:'time_series_macro m',
        columns:[
          'm.id',
          'm.macro as macroId',
          'd.definition',
          'm.start',
          'm.end'
        ],
        joins: [
          [
            'table' => 'time_series_macro_definition d',
            'first' => 'd.id',
            'operator' => '=',
            'second' => 'm.macro'
          ]
        ],
        conditions:['m.serie'=>$data['timelineId']],
        orderBy: ['m.macro'=>'ASC']
      );
      
      $res['generic'] = $this->pdo->read(
        table:'time_series_generic g',
        columns:[
          'g.id',
          'g.macro',
          'g.definition',
          'g.start',
          'g.end'],
        joins: [
          [
            'table' => 'time_series_macro m',
            'first' => 'm.id',
            'operator' => '=',
            'second' => 'g.macro'
          ]
        ],
        conditions:['m.serie'=>$data['timelineId']],
        orderBy: ['g.macro'=>'ASC', 'g.id'=>'ASC']
      );
        
      $res['specific'] = $this->pdo->read(
        table:'time_series_specific s',
        columns:['s.generic', 's.definition', 's.start', 's.end'],
        joins: [
          [
            'table' => 'time_series_generic g',
            'first' => 'g.id',
            'operator' => '=',
            'second' => 's.generic'
          ],[
            'table' => 'time_series_macro m',
            'first' => 'm.id',
            'operator' => '=',
            'second' => 'g.macro'
          ]
        ],
        conditions:['m.serie'=>$data['timelineId']],
      );
      return ['error'=>0, 'data'=>$res];
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

