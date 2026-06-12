-- ============================================================================
-- 2026-06-12 — Drop legacy tables superseded by the GADM dataset and
--              leftovers from the early Omeka-based prototype.
--
-- Brings pre-existing databases in line with db-init/00-schema.sql.
-- Fresh installations do NOT need this: their schema is already clean.
--
-- WHAT IT REMOVES
--   - city / county / nation + the legacy county/city columns of
--     artifact_findplace (find sites now use the gadm0..gadm5 tables)
--   - artifact_by_nation (view built on the legacy chain, unused)
--   - vocabulary / property / custom_vocab / item_set (Omeka leftovers;
--     item_set carried a foreign key to the non-existent `resource` table)
--   - test_replica, nordic_generic_period, cultural_specific_period (unused)
--
-- BEFORE RUNNING
--   1. Take a backup:
--        docker exec lund-db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" \
--          --routines "$MYSQL_DATABASE"' | gzip > backup-pre-migration.sql.gz
--   2. Sanity check — every find place must already be GADM-based;
--      this query must return 0:
--        SELECT COUNT(*) FROM artifact_findplace
--        WHERE (county IS NOT NULL OR city IS NOT NULL) AND gid_0 IS NULL;
--
-- RUN (once):
--   docker exec -i lund-db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" \
--     "$MYSQL_DATABASE"' < scripts/migrations/2026-06-12-drop-legacy-tables.sql
--
-- NOTE: the ALTER TABLE is not idempotent — running the script twice
-- fails harmlessly on the already-dropped constraints.
-- ============================================================================

DROP VIEW IF EXISTS artifact_by_nation;

ALTER TABLE artifact_findplace
  DROP FOREIGN KEY artifact_findplace_ibfk_2,
  DROP FOREIGN KEY artifact_findplace_ibfk_3,
  DROP COLUMN county,
  DROP COLUMN city;

-- Drop order respects the foreign keys inside the legacy group
DROP TABLE IF EXISTS city;
DROP TABLE IF EXISTS county;
DROP TABLE IF EXISTS nation;

DROP TABLE IF EXISTS property;     -- references vocabulary
DROP TABLE IF EXISTS vocabulary;
DROP TABLE IF EXISTS custom_vocab; -- references item_set
DROP TABLE IF EXISTS item_set;

DROP TABLE IF EXISTS test_replica;
DROP TABLE IF EXISTS nordic_generic_period;
DROP TABLE IF EXISTS cultural_specific_period;
