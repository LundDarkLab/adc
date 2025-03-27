<?php 
namespace Adc;
session_start();

class Timeline extends Conn{
  public function __construct() {}

  public function fetchUserTimeline():array { return $this->fetchTimeline(['author'=> $_SESSION['id']]); }

  public function fetchTimeline(array $payload = []): array {
    $timeline = [];
    try {
      if (!is_array($payload)) { throw new \Exception("is not an array", 1); }
      $timeline['serie'] = $this->read('time_series', $payload);
      $timeline['serie'] = $this->processSeries($timeline['serie']);
      return $timeline;
    } catch (\Throwable $th) {
      return ['error' => 1, 'message' => $th->getMessage()];
    }
  }

  private function processSeries(array $series): array {
    return array_map(function ($serieItem) {
      $serieItem['macro'] = $this->read("time_series_macro", ['serie' => $serieItem['id']]);
      $serieItem['macro'] = $this->processMacros($serieItem['macro']);
      return $serieItem;
    }, $series);
  }

  private function processMacros(array $macros): array {
    return array_map(function ($macroItem) {
      $macroItem['generic'] = $this->read("time_series_generic", ['macro' => $macroItem['id']]);
      $macroItem['generic'] = $this->processGenerics($macroItem['generic']);
      return $macroItem;
    }, $macros);
  }

  private function processGenerics(array $generics): array {
    return array_map(function ($genericItem) {
      $genericItem['specific'] = $this->read("time_series_specific", ['generic' => $genericItem['id']]);
      return $genericItem;
    }, $generics);
  }
}

?>