<?php

namespace Adc\Traits;
trait ReadSelectParametersTrait{
  private function extractReadParameters(array $payload): array {
    return [
        'table' => $payload['table'] ?? null,
        'columns' => $payload['columns'] ?? ['*'],
        'conditions' => $payload['conditions'] ?? [],
        'joins' => $payload['joins'] ?? [],
        'orderBy' => $payload['orderBy'] ?? [],
        'limit' => isset($payload['limit']) && is_int($payload['limit']) ? $payload['limit'] : null,
        'offset' => isset($payload['offset']) && is_int($payload['offset']) ? $payload['offset'] : null,
        'groupBy' => isset($payload['groupBy']) && is_array($payload['groupBy']) ? $payload['groupBy'] : [],
        'having' => isset($payload['having']) && is_array($payload['having']) ? $payload['having'] : [],
    ];
  }
}
?>