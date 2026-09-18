-- ============================================================================
-- 2026-09-18 — Mark the generic rows of list_material_specs with an explicit flag.
--
-- Brings pre-existing databases in line with db-init/00-schema.sql.
-- Fresh installations do NOT need this: their schema already has the column.
--
-- WHY
--   artifact_material_technique.material is a foreign key to list_material_specs,
--   so the material select of the artifact form must only ever offer specs ids.
--   The form used to fill its "generic value" optgroup with list_material_class
--   ids, and the two tables have overlapping id ranges (class 8 = Wood,
--   spec 8 = Silver): picking a generic material silently stored an unrelated
--   specific one.
--
--   The generic rows already live in list_material_specs (they were added when
--   the form went from two cascading selects down to a single list), but they
--   could only be told apart by comparing their value with the class value.
--   is_generic makes that explicit, so no query has to match strings any more.
--
-- WHAT IT DOES
--   - adds list_material_specs.is_generic (tinyint, default 0)
--   - flags the rows whose value matches the value of their own material class
--     (Alloy, Bone, Ceramics, Leather, Metal, Plaster, Stone, Wood, not defined)
--
--   list_material_class is left untouched: nothing reads it any more except the
--   vocabularies page, and it still carries the only record of which class each
--   specific material belongs to.
--
-- BEFORE RUNNING
--   1. Take a backup:
--        docker exec lund-db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" \
--          --routines "$MYSQL_DATABASE"' | gzip > backup-pre-migration.sql.gz
--   2. Sanity check — every material class must have exactly one mirror row,
--      this query must return 0:
--        SELECT COUNT(*) FROM list_material_class c
--        LEFT JOIN list_material_specs s
--          ON s.material_class = c.id AND s.value = c.value
--        WHERE s.id IS NULL;
--
-- RUN (once):
--   docker exec -i lund-db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" \
--     "$MYSQL_DATABASE"' < scripts/migrations/2026-09-18-material-is-generic.sql
--
-- NOTE: the ALTER TABLE is not idempotent — running the script twice fails
-- harmlessly on the already-existing column.
--
-- AFTER RUNNING
--   Check the flagged rows (9 expected on the reference dataset):
--     SELECT id, value FROM list_material_specs WHERE is_generic = 1 ORDER BY value;
--   Values saved before the fix cannot be repaired automatically: an id <= 9 is
--   a valid specific material as well, so the rows below need a human eye.
--     SELECT a.id, a.name, a.last_update, s.value AS saved_as, c.value AS picked_in_form
--       FROM artifact_material_technique amt
--       JOIN artifact a ON a.id = amt.artifact
--       JOIN list_material_specs s ON s.id = amt.material
--       JOIN list_material_class c ON c.id = amt.material
--      ORDER BY a.last_update DESC;
-- ============================================================================

ALTER TABLE list_material_specs
  ADD COLUMN is_generic tinyint(1) NOT NULL DEFAULT 0 AFTER material_class;

UPDATE list_material_specs s
  JOIN list_material_class c ON c.id = s.material_class
   SET s.is_generic = 1
 WHERE s.value = c.value;
