<?php
namespace Adc;

class Model extends ModelFileHandler {

  public function getModelApi(array $data){
    try {
      $id = $data['modelId'] ?? null;
      if (!$id) {
        throw new \Exception("Missing required parameter: modelId", 1);
      }
      $modelDetails = $this->getModel($id);
      return ["error"=>0, "response"=>$modelDetails];
    } catch (\Exception $e) {
      return ["error"=>1, "response"=>$e->getMessage()];
    }
  }

  public function getModel(int $id){
    $stmt = $this->pdo()->prepare(
      "SELECT m.id, m.name, m.note, m.uuid,
        NULLIF(m.description, 'no description available') description,
        m.thumbnail, status.id status_id, status.value status,
        m.create_at, m.updated_at,
        CONCAT(p.last_name, ' ', p.first_name) created_by,
        m.doi, m.doi_svg, m.citation
      FROM model m
      INNER JOIN list_item_status status ON m.status = status.id
      INNER JOIN user ON m.created_by = user.id
      INNER JOIN person p ON user.person = p.id
      WHERE m.id = :id"
    );
    $stmt->execute([':id' => $id]);
    $out['model'] = $stmt->fetch();

    $stmt = $this->pdo()->prepare(
      "SELECT artifact FROM artifact_model WHERE model = :id"
    );
    $stmt->execute([':id' => $id]);
    $artifact_model = $stmt->fetchAll();
    if (!empty($artifact_model)) {
      $out['artifact'] = $artifact_model[0]['artifact'];
    }

    $stmt = $this->pdo()->prepare(
      "SELECT * FROM model_biblio WHERE model = :id"
    );
    $stmt->execute([':id' => $id]);
    $out['model_biblio'] = $stmt->fetchAll();

    $stmt = $this->pdo()->prepare(
      "SELECT obj.id, obj.object, obj.thumbnail,
        status.value status,
        obj.author author_id,
        CONCAT(author.first_name, ' ', author.last_name) author,
        obj.owner owner_id, owner.name owner,
        obj.license license_id, license.license license,
        license.acronym license_acronym, license.link license_link,
        obj.create_at, obj.updated_at,
        NULLIF(obj.description, 'no object description') description,
        obj.note, obj.uuid,
        method.value acquisition_method,
        param.software, param.points, param.polygons,
        param.textures, param.scans, param.pictures,
        param.encumbrance, param.measure_unit
      FROM model_object obj
      INNER JOIN list_item_status status ON obj.status = status.id
      INNER JOIN user ON obj.author = user.id
      INNER JOIN person author ON user.person = author.id
      INNER JOIN institution owner ON obj.owner = owner.id
      INNER JOIN license ON obj.license = license.id
      INNER JOIN model_param param ON param.object = obj.id
      INNER JOIN list_model_acquisition method ON param.acquisition_method = method.id
      WHERE obj.model = :id"
    );
    $stmt->execute([':id' => $id]);
    $out['model_object'] = $stmt->fetchAll();

    $stmt = $this->pdo()->prepare(
      "SELECT * FROM model_view WHERE model = :id AND default_view = true"
    );
    $stmt->execute([':id' => $id]);
    $out['model_view'] = $stmt->fetch();

    return $out;
  }

  public function getUnusedModels():array {
    $sql = "SELECT m.id, m.name, m.description, m.thumbnail,
              CONCAT(p.first_name, ' ', p.last_name) author,
              i.name institution
            FROM model m
            INNER JOIN list_item_status status ON m.status = status.id
            INNER JOIN user u ON m.created_by = u.id
            INNER JOIN person p ON u.person = p.id
            INNER JOIN institution i ON m.owner = i.id
            WHERE m.status > 0
              AND m.id NOT IN (SELECT model FROM artifact_model)
            ORDER BY m.id ASC, m.name ASC";
    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll();
  }

  public function getModels(array $search){
    $params = [];
    if ((int) $search['status'] === 0) {
      $filter = ["m.status > 0"];
    } else {
      $filter = ["m.status = :status"];
      $params['status'] = (int) $search['status'];
    }
    if(isset($search['to_connect'])){
      $filter[] = "m.id not in (select model from artifact_model)";
    }
    $where = "where ".join(" and ", $filter);
    $sql = "select m.id, m.name, m.create_at, m.description, m.status, m.thumbnail,
      concat(person.last_name, ' ', person.first_name) author, count(o.id) object
      from model m
      inner join model_object o on o.model = m.id
      inner join user on m.created_by = user.id
      inner join person on user.person = person.id
      $where
      group by m.id, m.name, m.create_at, m.description, m.status, m.thumbnail
      order by m.create_at desc;";
    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
  }

  public function modelList(array $payload): array {
    $params = [];
    $where = !empty($payload) ? $this->buildModelListConditions($payload, $params) : "";
    $sql = "SELECT id, model, name, description, thumbnail, author, author_id, owner, owner_id, CAST(updated_at AS DATE) last_update, status_id, status FROM model_query_view $where ORDER BY 1 ASC";

    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
  }

  private function buildModelListConditions(array $payload, array &$params): string {
    $whereClauses = [];
    foreach ($payload as $key => $value) {
        if ($key === 'to_connect') {
            $operator = $value == 1 ? "NOT" : "";
            $whereClauses[] = "id $operator IN (SELECT model FROM artifact_model)";
        } else {
            if (is_int($value)) {
                $whereClauses[] = "$key = :filter_$key";
                $params["filter_$key"] = $value;
            } else {
                $whereClauses[] = "$key LIKE :filter_$key";
                $params["filter_$key"] = "%$value%";
            }
        }
    }
    return !empty($whereClauses) ? " WHERE " . implode(" AND ", $whereClauses) : "";
  }

  public function saveModelParam(array $dati){
    try {
      $this->create('model_view', $dati);
      return ["res"=>1, "msg"=>'ok, parameters saved'];
    } catch (\Exception $e) {
      return ["res"=>0, "msg"=>$e->getMessage()];
    }
  }

  public function updateModelMetadata(array $dati){
    try {
      $this->update('model', $dati, ['id' => $dati['id']]);
      return ["res"=> 1, "output"=>'Ok, the model has been successfully updated.'];
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }

  public function updateModelParam(array $dati){
    try {
      $model = $dati['model'];
      unset($dati['model']);
      $this->update("model_view", $dati, ["model" => $model]);
      return ["res"=>1, "msg"=>'ok, parameters updated'];
    } catch (\Exception $e) {
      return ["res"=>0, "msg"=>$e->getMessage()];
    }
  }

  public function changeModelStatus(array $dati){
    try {
      $this->update("model", $dati, ["id" => $dati['id']]);
      return ["error"=>0, "message"=>'ok, model status has been successfully updated'];
    } catch (\Exception $e) {
      return ["error"=>1, "message"=>$e->getMessage()];
    }
  }

  public function connectModel(array $dati){
    try {
      $this->create('artifact_model', $dati);
      return ["error"=>0, "message"=>'ok, model connected'];
    } catch (\Exception $e) {
      return ["error"=>1, "message"=>$e->getMessage()];
    }
  }

  public function deleteModel(int $id){
    try {
      $this->delete('model', ['id' => $id]);
      return ["res"=> 1, "output"=>'Ok, the model has been successfully deleted.'];
    } catch (\Exception $e) {
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }

  public function getObject(array $data):array{
    $id = $data['id'] ?? null;
    $stmt = $this->pdo()->prepare(
      "select o.id, o.model, o.object as nxz, o.status, o.author, o.owner, o.license, o.description, o.note, o.thumbnail, p.acquisition_method, p.software, p.points, p.polygons, p.textures, p.scans, p.pictures, p.encumbrance, p.measure_unit from model_object o inner join model_param p on p.object = o.id where o.id = :id;"
    );
    $stmt->execute([':id' => $id]);
    $rows = $stmt->fetchAll();
    return $rows[0] ?? null;
  }

  public function updateObjectMetadata(array $dati, array $files = []){
    // endpoint_private.php's dry_run wraps the whole call in its own transaction:
    // only begin/commit/rollback here if this call isn't already nested in one,
    // otherwise the dry-run's own rollback ends up with nothing to roll back.
    $ownsTransaction = !$this->pdo()->inTransaction();
    try {
      if ($ownsTransaction) { $this->pdo()->beginTransaction(); }

      if (!empty($files['object']['tmp_name']) || !empty($files['thumbnail']['tmp_name'])) {
        $this->replaceObjectFiles($dati['model_object']['id'], $files, $dati['model_object']);
      }

      $this->update('model_object', $dati['model_object'], ['id' => $dati['model_object']['id']]);
      $this->update('model_param', $dati['model_param'], ['object' => $dati['model_param']['object']]);
      if ($ownsTransaction) { $this->pdo()->commit(); }
      return ["res"=> 1, "output"=>'Ok, the object has been successfully updated.'];
    } catch (\Exception $e) {
      if ($ownsTransaction && $this->pdo()->inTransaction()) { $this->pdo()->rollback(); }
      return ["res"=>0, "output"=>$e->getMessage()];
    }
  }

  /**
   * Replaces the physical 3d model file and/or thumbnail of an existing
   * model_object: deletes the old file(s) before moving the new one(s) in,
   * and writes the new filenames into $modelObjectData for the caller's
   * update() call. Never overwrites a file in place.
   */
  private function replaceObjectFiles(int $objectId, array $files, array &$modelObjectData): void {
    $stmt = $this->pdo()->prepare("SELECT object, thumbnail FROM model_object WHERE id = :id");
    $stmt->execute([':id' => $objectId]);
    $current = $stmt->fetch();

    if (!empty($files['object']['tmp_name'])) {
      if (!empty($current['object'])) {
        $this->deleteObjectFile($this->modelDir . $current['object']);
      }
      $modelObjectData['object'] = $this->handle3dFile($files['object']);
    }

    if (!empty($files['thumbnail']['tmp_name'])) {
      if (!empty($current['thumbnail'])) {
        $this->deleteObjectFile($this->thumbDir . $current['thumbnail']);
      }
      $modelObjectData['thumbnail'] = $this->handleImg($files['thumbnail']);
    }
  }

  public function checkName(array $data): array {
    $payload = $data['payload'] ?? $data;
    $name = $payload['name'] ?? null;

    if (empty($name)) {
      return [
        'error' => 1,
        'message' => 'Missing required field: name'
      ];
    }

    $sql = "SELECT EXISTS(SELECT 1 FROM model WHERE name = :name) as `exists`;";
    $stmt = $this->pdo()->prepare($sql);
    $stmt->execute(['name' => $name]);
    $exists = (bool) $stmt->fetchColumn();

    return [
      'error' => $exists ? 1 : 0,
      'exists' => $exists,
      'message' => $exists ? 'Name already exists' : 'Name is available'
    ];
  }

  public function objectAcquisitionMethodList(){
    $stmt = $this->pdo()->prepare("SELECT id, value FROM list_model_acquisition ORDER BY value ASC");
    $stmt->execute();
    return $stmt->fetchAll();
  }
}
