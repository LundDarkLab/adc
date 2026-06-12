<?php
namespace Adc;

use Adc\Conn;

class Collection {
  private $conn;

  public function __construct() { $this->conn = new Conn(); }

  public function getGallery(array $payload): array {
    try {
      $sortBy    = $payload['sortBy']    ?? 'artifact.id';
      $sortDir   = $payload['sortDir']   ?? 'ASC';
      $filterArr = $payload['filterArr'] ?? [];
      $page      = $payload['page']      ?? 1;
      $limit     = $payload['limit']     ?? 10;
      error_log('buildGallery: $filterArr type=' . gettype($filterArr) . ' value=' . substr(var_export($filterArr, true), 0, 500));
  
      $offset = ($page - 1) * $limit;
  
      [$filterMaterial, $filterArtifact] = self::buildFilters($filterArr);
      $filter = !empty($filterArtifact) ? " AND " . implode(" AND ", $filterArtifact) : "";
  
      $galleryFields = self::getGalleryFields();
      $conditions = self::getQueryConditions($filterMaterial, $filter);
      $groupBy = self::getQueryGroupBy();
  
      $totField = "count(distinct artifact.id) as tot";
      $pagination = "ORDER BY $sortBy $sortDir LIMIT $limit OFFSET $offset";
  
      $totSql = "SELECT $totField $conditions ;";
      $gallerySql = "SELECT $galleryFields $conditions $groupBy $pagination;";

      error_log('Total SQL: ' . $totSql);
      error_log('Gallery SQL: ' . $gallerySql);

      if (isset($payload['getAll']) && $payload['getAll'] === true) {
        $gallerySql = "SELECT $galleryFields $conditions $groupBy ORDER BY $sortBy $sortDir;";
        error_log('Gallery SQL (no pagination): ' . $gallerySql);
      }

      return ["tot" => $this->conn->simple($totSql), "gallery" => $this->conn->simple($gallerySql)];
    } catch (\Throwable $th) {
      return ['error' => 1, 'message' => $th->getMessage()];
    }
  }

  private static function buildFilters($filterArr): array {
    $filterMaterial = "";
    $filterArtifact = [];

    if (!empty($filterArr)) {
      foreach ($filterArr as $index => $filter) {
        if (is_string($filter)) {
          if (strpos($filter, 'material.id') !== false) {
            $filterMaterial = "WHERE " . $filter;
          } else {
            $filterArtifact[] = $filter;
          }
          continue;
        }

        if (!is_array($filter)) {
          error_log('WARNING: filter at index ' . $index . ' is not an array or string, skipping');
          continue;
        }

        foreach ($filter as $key => $value) {
          if ($key === 'material.id') {
            $filterMaterial = "WHERE material.id = " . intval($value);
          } else if ($key === 'description') {
            $filterArtifact[] = "artifact.description LIKE '%" . addslashes($value) . "%'";
          } else {
            if (is_numeric($value)) {
              $filterArtifact[] = $key . " = " . intval($value);
            } else {
              $filterArtifact[] = $key . " LIKE '%" . addslashes($value) . "%'";
            }
          }
        }
      }
    }

    return [$filterMaterial, $filterArtifact];
  }

  private static function getGalleryFields(): string {
    return "
      artifact.id,
      artifact.name,
      inst.name institution,
      gadm0.country as nation,
      COALESCE(gadm1.name_1, '') AS county,
      COALESCE(artifact.description, 'no description available') AS description,
      class.id AS category_id,
      class.value AS category,
      JSON_OBJECTAGG(material.id, material.value) AS material,
      artifact.start,
      artifact.end,
      obj.object,
      af.latitude,
      af.longitude,
      obj.thumbnail";
  }

  private static function getQueryConditions(string $filterMaterial, string $filter): string {
    return "FROM artifact 
    INNER JOIN list_category_class class ON artifact.category_class = class.id 
    INNER JOIN artifact_material_technique amt ON amt.artifact = artifact.id 
    INNER JOIN artifact_model am ON artifact.id = am.artifact 
    INNER JOIN model_object obj ON obj.model = am.model 
    INNER JOIN institution inst ON inst.id = artifact.storage_place
    LEFT JOIN list_material_specs material ON amt.material = material.id
    LEFT JOIN artifact_findplace af ON af.artifact = artifact.id
    LEFT JOIN gadm0 ON gadm0.gid_0 = af.gid_0
    LEFT JOIN gadm1 ON gadm1.gid_1 = af.gid_1
    WHERE artifact.status = 2
      AND artifact.id IN (
        SELECT artifact.id
        FROM artifact
        INNER JOIN artifact_material_technique amt ON amt.artifact = artifact.id
        LEFT JOIN list_material_specs material ON amt.material = material.id
        " . $filterMaterial . " ) " . $filter;
  }

  private static function getQueryGroupBy(): string {
    return "GROUP BY artifact.id, artifact.name, gadm0.country, gadm1.name_1, inst.name, class.id, class.value, artifact.start, artifact.end, obj.object, obj.thumbnail";
  }
}
?>