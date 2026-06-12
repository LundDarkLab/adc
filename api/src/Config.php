<?php
namespace Adc;

class Config {
  private static ?array $config = null;

  private static function rootFolder(): string {
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    return match(true) {
      str_contains($requestUri, '/prototype_dev/') => '/prototype_dev',
      str_contains($requestUri, '/plus/')          => '/plus',
      default                                      => ''
    };
  }

  private static function load(): void {
    if (self::$config !== null) {return;} // carica una volta sola
    $root = $_SERVER['DOCUMENT_ROOT'] . self::rootFolder();
    self::$config = [
      'dirs' => [
        'document' => $root . '/archive/document/',
        'image'    => $root . '/archive/image/',
        'model'    => $root . '/archive/models/',
        'reference'=> $root . '/archive/reference/',
        'thumb'    => $root . '/archive/thumb/',
        'tmp'      => $root . '/archive/tmp/',
        'video'    => $root . '/archive/video/',
        'ico'      => $root . '/img/ico/',
        'logo'     => $root . '/img/logo/',
      ]
    ];
  }

  /**
   * Parametri SMTP: letti dall'ambiente (passati dal docker-compose via env_file),
   * con fallback sul vecchio file api/config/.env per le installazioni esistenti.
   */
  public static function mailParams(): array {
    $keys = ['MAILHOST','MAILPORT','MAILUSER','MAILPASSWORD','MAILSETFROM','MAILSETFROMNAME'];
    $params = [];
    foreach ($keys as $key) {
      $value = getenv($key);
      if ($value !== false && $value !== '') { $params[$key] = $value; }
    }
    if (count($params) < count($keys)) {
      $fromFile = @parse_ini_file('config/.env');
      if ($fromFile !== false) { $params += $fromFile; }
    }
    $missing = array_diff($keys, array_keys($params));
    if ($missing) {
      throw new \RuntimeException('Missing mail configuration: ' . implode(', ', $missing));
    }
    return $params;
  }

  public static function get(string $key): mixed {
    self::load();
    return self::$config[$key] ?? null;
  }

  public static function dir(string $name): string {
    self::load();
    $dir = self::$config['dirs'][$name] ?? null;
    if ($dir === null) {
      throw new \InvalidArgumentException("Directory '$name' not found in config.");
    }
    return $dir;
  }
}
