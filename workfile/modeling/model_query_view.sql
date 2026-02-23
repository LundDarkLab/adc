CREATE OR REPLACE ALGORITHM=UNDEFINED 
DEFINER=`omeka`@`%` 
SQL SECURITY INVOKER 
VIEW `model_query_view` AS
SELECT 
    `obj`.`id`                                               AS `id`,
    `obj`.`model`                                            AS `model`,
    `obj`.`object`                                           AS `object`,
    `model`.`name`                                           AS `name`,
    `obj`.`thumbnail`                                        AS `thumbnail`,
    `obj`.`status`                                           AS `status_id`,
    `status`.`value`                                         AS `status`,
    `obj`.`author`                                           AS `author_id`,
    CONCAT(`person`.`first_name`, ' ', `person`.`last_name`) AS `author`,
    `obj`.`owner`                                            AS `owner_id`,
    `owner`.`name`                                           AS `owner`,
    `obj`.`license`                                          AS `license_id`,
    `license`.`license`                                      AS `license`,
    `license`.`acronym`                                      AS `license_acronym`,
    `license`.`link`                                         AS `license_link`,
    `obj`.`create_at`                                        AS `create_at`,
    `obj`.`updated_at`                                       AS `updated_at`,
    `obj`.`updated_by`                                       AS `updated_by`,
    `obj`.`description`                                      AS `description`,
    `obj`.`note`                                             AS `note`,
    `obj`.`uuid`                                             AS `uuid`,
    `param`.`acquisition_method`                             AS `method_id`,
    `method`.`value`                                         AS `acquisition_method`,
    `param`.`software`                                       AS `software`,
    `param`.`points`                                         AS `points`,
    `param`.`polygons`                                       AS `polygons`,
    `param`.`textures`                                       AS `textures`,
    `param`.`scans`                                          AS `scans`,
    `param`.`pictures`                                       AS `pictures`,
    `param`.`encumbrance`                                    AS `encumbrance`,
    `param`.`measure_unit`                                   AS `measure_unit`
FROM `model`
JOIN `model_object` `obj` ON `obj`.`model` = `model`.`id`
JOIN `model_param`            `param`  ON `param`.`object`             = `obj`.`id`
JOIN `list_item_status`       `status` ON `obj`.`status`               = `status`.`id`
JOIN `user`                            ON `obj`.`author`               = `user`.`id`
JOIN `person`                          ON `user`.`person`              = `person`.`id`
JOIN `institution`            `owner`  ON `obj`.`owner`                = `owner`.`id`
JOIN `license`                         ON `obj`.`license`              = `license`.`id`
JOIN `list_model_acquisition` `method` ON `param`.`acquisition_method` = `method`.`id`;