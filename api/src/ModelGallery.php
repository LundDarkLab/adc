<?php
namespace Adc;

class ModelGallery extends Conn {
  private const SORTABLE_COLUMNS = [
    'artifact.id', 'artifact.name', 'institution', 'nation', 'county',
    'description', 'category', 'artifact.start', 'artifact.end'
  ];

  public function buildGallery(string $sortBy, array $filterArr = [], int $page = 1, int $limit = 10): array {
    $page = max(1, $page);
    $limit = max(1, $limit);
    $offset = ($page - 1) * $limit;

    $params = [];
    [$filterMaterial, $filterArtifact] = $this->buildGalleryFilters($filterArr, $params);
    $filter = !empty($filterArtifact) ? ' AND ' . implode(' AND ', $filterArtifact) : '';
    $conditions = $this->galleryConditions($filterMaterial, $filter);
    $order = $this->sanitizeSortBy($sortBy);

    $totStmt = $this->pdo()->prepare("SELECT count(*) as tot $conditions;");
    $totStmt->execute($params);

    $gallerySql = "SELECT " . $this->galleryFields() . " $conditions ORDER BY $order LIMIT $limit OFFSET $offset;";
    $galleryStmt = $this->pdo()->prepare($gallerySql);
    $galleryStmt->execute($params);

    return ["tot" => $totStmt->fetchAll(), "gallery" => $galleryStmt->fetchAll()];
  }

  /**
   * Parses the raw/associative filter array coming from the client into a
   * parametrized material filter and a list of parametrized artifact conditions.
   */
  private function buildGalleryFilters(array $filterArr, array &$params): array {
    $filterMaterial = '';
    $filterArtifact = [];
    $counter = 0;

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
      $this->appendArrayFilter($filter, $filterArtifact, $filterMaterial, $params, $counter);
    }

    return [$filterMaterial, $filterArtifact];
  }

  private function appendArrayFilter(array $filter, array &$filterArtifact, string &$filterMaterial, array &$params, int &$counter): void {
    foreach ($filter as $key => $value) {
      $placeholder = 'filter' . $counter++;
      if ($key === 'material.id') {
        $filterMaterial = "WHERE material.id = :$placeholder";
        $params[$placeholder] = (int) $value;
      } elseif ($key === 'description') {
        $filterArtifact[] = "artifact.description LIKE :$placeholder";
        $params[$placeholder] = "%$value%";
      } elseif (is_numeric($value)) {
        $filterArtifact[] = "$key = :$placeholder";
        $params[$placeholder] = (int) $value;
      } else {
        $filterArtifact[] = "$key LIKE :$placeholder";
        $params[$placeholder] = "%$value%";
      }
    }
  }

  /**
   * ORDER BY column names can't be bound as PDO parameters, so validate
   * against a whitelist instead.
   */
  private function sanitizeSortBy(string $sortBy): string {
    $parts = preg_split('/\s+/', trim($sortBy));
    $column = $parts[0] ?? 'artifact.id';
    $direction = strtoupper($parts[1] ?? 'ASC');

    if (!in_array($column, self::SORTABLE_COLUMNS, true)) { $column = 'artifact.id'; }
    if (!in_array($direction, ['ASC', 'DESC'], true)) { $direction = 'ASC'; }

    return "$column $direction";
  }

  private function galleryFields(): string {
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
      obj.thumbnail";
  }

  private function galleryConditions(string $filterMaterial, string $filter): string {
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
        " . $filterMaterial . "
        GROUP BY artifact.id
      )
    " . $filter . "
    GROUP BY artifact.id, artifact.name, gadm0.country, gadm1.name_1, inst.name, class.id, class.value, artifact.start, artifact.end, obj.object, obj.thumbnail";
  }
}
