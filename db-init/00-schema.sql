
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `artifact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL DEFAULT 'pending',
  `status` bigint unsigned NOT NULL DEFAULT '1',
  `storage_place` bigint unsigned NOT NULL,
  `inventory` varchar(25) DEFAULT NULL,
  `conservation_state` bigint unsigned NOT NULL,
  `object_condition` bigint unsigned DEFAULT '1',
  `is_museum_copy` tinyint(1) DEFAULT '0',
  `category_class` bigint unsigned NOT NULL,
  `category_specs` bigint unsigned DEFAULT NULL,
  `type` text,
  `start` int DEFAULT NULL,
  `end` int DEFAULT NULL,
  `description` text,
  `notes` text,
  `author` int NOT NULL,
  `owner` bigint unsigned NOT NULL,
  `license` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_update` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `uuid` varchar(36) DEFAULT NULL,
  `timeline` int DEFAULT '1',
  `weight` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `artifact_unique` (`name`),
  KEY `art_status_fk` (`status`),
  KEY `art_place_fk` (`storage_place`),
  KEY `art_conservation_state_fk` (`conservation_state`),
  KEY `art_obj_condition_fk` (`object_condition`),
  KEY `art_cat_class_fk` (`category_class`),
  KEY `art_cat_specs_fk` (`category_specs`),
  KEY `artifact_author_fki` (`author`),
  KEY `artifact_owner_fki` (`owner`),
  KEY `artifact_license_fki` (`license`),
  KEY `timeline` (`timeline`),
  KEY `idx_artifact_category_class` (`category_class`),
  KEY `idx_artifacts_status` (`status`),
  CONSTRAINT `art_cat_class_fk` FOREIGN KEY (`category_class`) REFERENCES `list_category_class` (`id`) ON DELETE CASCADE,
  CONSTRAINT `art_cat_specs_fk` FOREIGN KEY (`category_specs`) REFERENCES `list_category_specs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `art_conservation_state_fk` FOREIGN KEY (`conservation_state`) REFERENCES `list_conservation_state` (`id`) ON DELETE CASCADE,
  CONSTRAINT `art_obj_condition_fk` FOREIGN KEY (`object_condition`) REFERENCES `list_object_condition` (`id`) ON DELETE CASCADE,
  CONSTRAINT `art_place_fk` FOREIGN KEY (`storage_place`) REFERENCES `institution` (`id`) ON DELETE CASCADE,
  CONSTRAINT `art_status_fk` FOREIGN KEY (`status`) REFERENCES `list_item_status` (`id`) ON DELETE CASCADE,
  CONSTRAINT `artifact_author_fki` FOREIGN KEY (`author`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `artifact_license_fki` FOREIGN KEY (`license`) REFERENCES `license` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `artifact_owner_fki` FOREIGN KEY (`owner`) REFERENCES `institution` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_artifact_timeline` FOREIGN KEY (`timeline`) REFERENCES `time_series` (`id`) ON DELETE SET DEFAULT,
  CONSTRAINT `check_artifact_chrono` CHECK ((`end` >= `start`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `artifact_biblio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact_biblio` (
  `artifact` int NOT NULL,
  `reference` int NOT NULL,
  PRIMARY KEY (`artifact`,`reference`),
  KEY `ab_biblio_fk` (`reference`),
  CONSTRAINT `ab_artifact_fk` FOREIGN KEY (`artifact`) REFERENCES `artifact` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ab_biblio_fk` FOREIGN KEY (`reference`) REFERENCES `bibliography` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `artifact_findplace`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact_findplace` (
  `artifact` int NOT NULL,
  `parish` varchar(250) DEFAULT NULL,
  `toponym` varchar(250) DEFAULT NULL,
  `longitude` decimal(10,6) DEFAULT NULL,
  `latitude` decimal(10,6) DEFAULT NULL,
  `findplace_notes` text,
  `gid_0` varchar(256) NOT NULL,
  `gid_1` varchar(256) DEFAULT NULL,
  `gid_2` varchar(256) DEFAULT NULL,
  `gid_3` varchar(256) DEFAULT NULL,
  `gid_4` varchar(256) DEFAULT NULL,
  `gid_5` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`artifact`),
  KEY `idx_artifact_findplace_gid1` (`gid_1`),
  KEY `idx_artifact_findplace_artifact` (`artifact`),
  KEY `idx_af_artifact_gid1` (`artifact`,`gid_1`),
  KEY `idx_artifact_status_gid` (`artifact`,`gid_0`),
  KEY `idx_artifact_gid_status` (`gid_0`,`artifact`),
  KEY `idx_af_gid_artifact` (`gid_0`,`artifact`),
  CONSTRAINT `artifact_findplace_ibfk_1` FOREIGN KEY (`artifact`) REFERENCES `artifact` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `artifact_material_technique`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact_material_technique` (
  `id` int NOT NULL AUTO_INCREMENT,
  `artifact` int NOT NULL,
  `material` bigint unsigned NOT NULL,
  `technique` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_amt_artifact` (`artifact`),
  KEY `idx_amt_material` (`material`),
  CONSTRAINT `amt_art_fk` FOREIGN KEY (`artifact`) REFERENCES `artifact` (`id`) ON DELETE CASCADE,
  CONSTRAINT `amt_material_fk` FOREIGN KEY (`material`) REFERENCES `list_material_specs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `artifact_measure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact_measure` (
  `id` int NOT NULL AUTO_INCREMENT,
  `artifact` int NOT NULL,
  `weight` decimal(6,2) DEFAULT NULL,
  `length` decimal(6,2) DEFAULT NULL,
  `width` decimal(6,2) DEFAULT NULL,
  `diameter` decimal(6,2) DEFAULT NULL,
  `depth` decimal(6,2) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `am_art_fk` (`artifact`),
  CONSTRAINT `am_art_fk` FOREIGN KEY (`artifact`) REFERENCES `artifact` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `artifact_model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact_model` (
  `artifact` int NOT NULL,
  `model` int NOT NULL,
  PRIMARY KEY (`artifact`,`model`),
  KEY `model` (`model`),
  CONSTRAINT `artifact_model_ibfk_1` FOREIGN KEY (`artifact`) REFERENCES `artifact` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `artifact_model_ibfk_2` FOREIGN KEY (`model`) REFERENCES `model` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `artifact_view`;
/*!50001 DROP VIEW IF EXISTS `artifact_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `artifact_view` AS SELECT 
 1 AS `id`,
 1 AS `weight`,
 1 AS `name`,
 1 AS `status_id`,
 1 AS `status`,
 1 AS `storage_place`,
 1 AS `inventory`,
 1 AS `conservation_state_id`,
 1 AS `conservation_state`,
 1 AS `object_condition_id`,
 1 AS `object_condition`,
 1 AS `is_museum_copy`,
 1 AS `category_class_id`,
 1 AS `category_class`,
 1 AS `category_specs_id`,
 1 AS `category_specs`,
 1 AS `type`,
 1 AS `timeline`,
 1 AS `start`,
 1 AS `end`,
 1 AS `description`,
 1 AS `notes`,
 1 AS `author`,
 1 AS `owner`,
 1 AS `license`,
 1 AS `created_at`,
 1 AS `last_update`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `artifact_websource`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact_websource` (
  `id` int NOT NULL AUTO_INCREMENT,
  `artifact` int NOT NULL,
  `link` varchar(2000) DEFAULT NULL,
  `description` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ar_art_fk` (`artifact`),
  CONSTRAINT `ar_art_fk` FOREIGN KEY (`artifact`) REFERENCES `artifact` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `bibliography`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bibliography` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reference` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `chronological_period`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chronological_period` (
  `id` int NOT NULL AUTO_INCREMENT,
  `definition` varchar(50) NOT NULL,
  `start` int NOT NULL,
  `end` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `definition` (`definition`),
  CONSTRAINT `check_cp_start_end` CHECK ((`end` >= `start`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `complete_collection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complete_collection` (
  `id` int DEFAULT NULL,
  `name` text,
  `status` int DEFAULT NULL,
  `storage_place` int DEFAULT NULL,
  `inventory` text,
  `conservation_state` int DEFAULT NULL,
  `category_class` int DEFAULT NULL,
  `category_specs` int DEFAULT NULL,
  `type` text,
  `start` int DEFAULT NULL,
  `end` text,
  `artifact_description` text,
  `district` text,
  `province` text,
  `parish` text,
  `findplace_notes` text,
  `material` int DEFAULT NULL,
  `weight` text,
  `artifact_author` int DEFAULT NULL,
  `artifact_owner` int DEFAULT NULL,
  `artifact_license` int DEFAULT NULL,
  `nxz` text,
  `thumbnail_256` text,
  `thumbnail_512` text,
  `model_description` text,
  `model_notes` text,
  `model_author` int DEFAULT NULL,
  `model_owner` int DEFAULT NULL,
  `model_license` int DEFAULT NULL,
  `model_updated_by` int DEFAULT NULL,
  `software` text,
  `points` text,
  `polygons` int DEFAULT NULL,
  `textures` int DEFAULT NULL,
  `scans` int DEFAULT NULL,
  `pictures` text,
  `acquisition_method` text,
  `reference` text,
  `artifact` int DEFAULT NULL,
  `model` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cultural_generic_period`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cultural_generic_period` (
  `id` int NOT NULL,
  `definition` varchar(50) NOT NULL,
  `start` int NOT NULL,
  `end` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `definition` (`definition`),
  CONSTRAINT `check_cgp_start_end` CHECK ((`end` >= `start`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `files` (
  `id` smallint NOT NULL AUTO_INCREMENT,
  `artifact` int NOT NULL,
  `type` enum('image','document','video','reference','link') COLLATE utf8mb4_unicode_ci NOT NULL,
  `path` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `license` bigint unsigned DEFAULT NULL,
  `downloadable` tinyint DEFAULT '0',
  `filetype` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `artifact` (`artifact`),
  KEY `files_license_fk` (`license`),
  KEY `files_filetype_fk` (`filetype`),
  CONSTRAINT `files_filetype_fk` FOREIGN KEY (`filetype`) REFERENCES `list_file_type` (`id`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`artifact`) REFERENCES `artifact` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `files_license_fk` FOREIGN KEY (`license`) REFERENCES `license` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `gadm0`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gadm0` (
  `OGR_FID` int NOT NULL AUTO_INCREMENT,
  `SHAPE` geometry NOT NULL /*!80003 SRID 4326 */,
  `gid_0` varchar(256) DEFAULT NULL,
  `country` varchar(256) DEFAULT NULL,
  UNIQUE KEY `OGR_FID` (`OGR_FID`),
  SPATIAL KEY `SHAPE` (`SHAPE`),
  KEY `idx_gid_0` (`gid_0`),
  KEY `idx_geometry_gid0` (`gid_0`),
  KEY `idx_gadm0_gid_country` (`gid_0`,`country`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `gadm1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gadm1` (
  `OGR_FID` int NOT NULL AUTO_INCREMENT,
  `SHAPE` geometry NOT NULL /*!80003 SRID 4326 */,
  `gid_1` varchar(256) DEFAULT NULL,
  `gid_0` varchar(256) DEFAULT NULL,
  `country` varchar(256) DEFAULT NULL,
  `name_1` varchar(256) DEFAULT NULL,
  `varname_1` varchar(256) DEFAULT NULL,
  `nl_name_1` varchar(256) DEFAULT NULL,
  `type_1` varchar(256) DEFAULT NULL,
  `engtype_1` varchar(256) DEFAULT NULL,
  `cc_1` varchar(256) DEFAULT NULL,
  `hasc_1` varchar(256) DEFAULT NULL,
  `iso_1` varchar(256) DEFAULT NULL,
  UNIQUE KEY `OGR_FID` (`OGR_FID`),
  SPATIAL KEY `SHAPE` (`SHAPE`),
  KEY `idx_gid_1` (`gid_0`,`gid_1`),
  KEY `idx_gadm1_gid_1` (`gid_1`),
  KEY `idx_gadm1_gid1` (`gid_1`),
  KEY `idx_geometry_gid1` (`gid_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `gadm2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gadm2` (
  `OGR_FID` int NOT NULL AUTO_INCREMENT,
  `SHAPE` geometry NOT NULL /*!80003 SRID 4326 */,
  `gid_2` varchar(256) DEFAULT NULL,
  `gid_0` varchar(256) DEFAULT NULL,
  `country` varchar(256) DEFAULT NULL,
  `gid_1` varchar(256) DEFAULT NULL,
  `name_1` varchar(256) DEFAULT NULL,
  `nl_name_1` varchar(256) DEFAULT NULL,
  `name_2` varchar(256) DEFAULT NULL,
  `varname_2` varchar(256) DEFAULT NULL,
  `nl_name_2` varchar(256) DEFAULT NULL,
  `type_2` varchar(256) DEFAULT NULL,
  `engtype_2` varchar(256) DEFAULT NULL,
  `cc_2` varchar(256) DEFAULT NULL,
  `hasc_2` varchar(256) DEFAULT NULL,
  UNIQUE KEY `OGR_FID` (`OGR_FID`),
  SPATIAL KEY `SHAPE` (`SHAPE`),
  KEY `idx_gid_2` (`gid_1`,`gid_2`),
  KEY `idx_geometry_gid2` (`gid_2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `gadm3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gadm3` (
  `OGR_FID` int NOT NULL AUTO_INCREMENT,
  `SHAPE` geometry NOT NULL /*!80003 SRID 4326 */,
  `gid_3` varchar(256) DEFAULT NULL,
  `gid_0` varchar(256) DEFAULT NULL,
  `country` varchar(256) DEFAULT NULL,
  `gid_1` varchar(256) DEFAULT NULL,
  `name_1` varchar(256) DEFAULT NULL,
  `nl_name_1` varchar(256) DEFAULT NULL,
  `gid_2` varchar(256) DEFAULT NULL,
  `name_2` varchar(256) DEFAULT NULL,
  `nl_name_2` varchar(256) DEFAULT NULL,
  `name_3` varchar(256) DEFAULT NULL,
  `varname_3` varchar(256) DEFAULT NULL,
  `nl_name_3` varchar(256) DEFAULT NULL,
  `type_3` varchar(256) DEFAULT NULL,
  `engtype_3` varchar(256) DEFAULT NULL,
  `cc_3` varchar(256) DEFAULT NULL,
  `hasc_3` varchar(256) DEFAULT NULL,
  UNIQUE KEY `OGR_FID` (`OGR_FID`),
  SPATIAL KEY `SHAPE` (`SHAPE`),
  KEY `idx_gid_3` (`gid_2`,`gid_3`),
  KEY `idx_geometry_gid3` (`gid_3`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `gadm4`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gadm4` (
  `OGR_FID` int NOT NULL AUTO_INCREMENT,
  `SHAPE` geometry NOT NULL /*!80003 SRID 4326 */,
  `gid_4` varchar(256) DEFAULT NULL,
  `gid_0` varchar(256) DEFAULT NULL,
  `country` varchar(256) DEFAULT NULL,
  `gid_1` varchar(256) DEFAULT NULL,
  `name_1` varchar(256) DEFAULT NULL,
  `gid_2` varchar(256) DEFAULT NULL,
  `name_2` varchar(256) DEFAULT NULL,
  `gid_3` varchar(256) DEFAULT NULL,
  `name_3` varchar(256) DEFAULT NULL,
  `name_4` varchar(256) DEFAULT NULL,
  `varname_4` varchar(256) DEFAULT NULL,
  `type_4` varchar(256) DEFAULT NULL,
  `engtype_4` varchar(256) DEFAULT NULL,
  `cc_4` varchar(256) DEFAULT NULL,
  UNIQUE KEY `OGR_FID` (`OGR_FID`),
  SPATIAL KEY `SHAPE` (`SHAPE`),
  KEY `idx_gid_4` (`gid_3`,`gid_4`),
  KEY `idx_geometry_gid4` (`gid_4`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `gadm5`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gadm5` (
  `OGR_FID` int NOT NULL AUTO_INCREMENT,
  `SHAPE` geometry NOT NULL /*!80003 SRID 4326 */,
  `gid_0` varchar(256) DEFAULT NULL,
  `country` varchar(256) DEFAULT NULL,
  `gid_1` varchar(256) DEFAULT NULL,
  `name_1` varchar(256) DEFAULT NULL,
  `gid_2` varchar(256) DEFAULT NULL,
  `name_2` varchar(256) DEFAULT NULL,
  `gid_3` varchar(256) DEFAULT NULL,
  `name_3` varchar(256) DEFAULT NULL,
  `gid_4` varchar(256) DEFAULT NULL,
  `name_4` varchar(256) DEFAULT NULL,
  `gid_5` varchar(256) DEFAULT NULL,
  `name_5` varchar(256) DEFAULT NULL,
  `type_5` varchar(256) DEFAULT NULL,
  `engtype_5` varchar(256) DEFAULT NULL,
  `cc_5` varchar(256) DEFAULT NULL,
  UNIQUE KEY `OGR_FID` (`OGR_FID`),
  SPATIAL KEY `SHAPE` (`SHAPE`),
  KEY `idx_gid_5` (`gid_4`,`gid_5`),
  KEY `idx_geometry_gid5` (`gid_5`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `geodata`;
/*!50001 DROP VIEW IF EXISTS `geodata`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `geodata` AS SELECT 
 1 AS `gid_0`,
 1 AS `country`,
 1 AS `gid_1`,
 1 AS `name_1`,
 1 AS `gid_2`,
 1 AS `name_2`,
 1 AS `gid_3`,
 1 AS `name_3`,
 1 AS `gid_4`,
 1 AS `name_4`,
 1 AS `gid_5`,
 1 AS `name_5`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `institution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `institution` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category` bigint unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `abbreviation` varchar(5) NOT NULL,
  `address` varchar(255) NOT NULL,
  `lat` decimal(10,6) NOT NULL,
  `lon` decimal(10,6) NOT NULL,
  `url` varchar(2000) DEFAULT NULL,
  `logo` varchar(255) NOT NULL DEFAULT 'default.jpg',
  `uuid` varchar(36) NOT NULL DEFAULT (uuid()),
  `color` varchar(50) DEFAULT '#c5cae9',
  `city` varchar(100) NOT NULL,
  `is_storage_place` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `abbreviation` (`abbreviation`),
  KEY `inst_cat_fk` (`category`),
  CONSTRAINT `inst_cat_fk` FOREIGN KEY (`category`) REFERENCES `list_institution_category` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `license`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `license` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `license` varchar(100) NOT NULL,
  `acronym` varchar(100) NOT NULL,
  `link` varchar(2000) DEFAULT NULL,
  `file` varchar(512) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `license` (`license`),
  UNIQUE KEY `acronym` (`acronym`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_category_class`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_category_class` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `value` varchar(25) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_category_specs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_category_specs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_class` bigint unsigned DEFAULT NULL,
  `value` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_specs` (`category_class`,`value`),
  CONSTRAINT `cat_class_fki` FOREIGN KEY (`category_class`) REFERENCES `list_category_class` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_conservation_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_conservation_state` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `value` varchar(25) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_file_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_file_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `value` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_institution_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_institution_category` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `value` varchar(25) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_item_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_item_status` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `value` varchar(25) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_material_class`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_material_class` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `value` varchar(25) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_material_specs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_material_specs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `material_class` int NOT NULL,
  `value` varchar(25) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `material_class` (`material_class`,`value`),
  KEY `idx_material_value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_measure_unit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_measure_unit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `value` varchar(50) NOT NULL,
  `acronym` varchar(2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `measure_unique` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_model_acquisition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_model_acquisition` (
  `id` int NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_model_grid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_model_grid` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `value` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_model_view`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_model_view` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `value` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_object_condition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_object_condition` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `value` varchar(25) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_person_position`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_person_position` (
  `id` int NOT NULL AUTO_INCREMENT,
  `value` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_PERSON_CAT` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_reference_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_reference_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `value` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `list_user_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_user_role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `value` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_USER_ROLE` (`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mail_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mail_template` (
  `id` int NOT NULL AUTO_INCREMENT,
  `object` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('draft','private','shared') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mail_unique` (`object`,`type`),
  KEY `mail_usr_fki` (`created_by`),
  CONSTRAINT `mail_usr_fki` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `uuid` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT (uuid()),
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbnail` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` bigint unsigned DEFAULT '1',
  `create_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int NOT NULL,
  `created_by` int DEFAULT NULL,
  `doi` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `citation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `doi_svg` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `status` (`status`),
  KEY `model_institution_FK` (`owner`),
  CONSTRAINT `model_ibfk_1` FOREIGN KEY (`status`) REFERENCES `list_item_status` (`id`),
  CONSTRAINT `model_institution_FK` FOREIGN KEY (`owner`) REFERENCES `institution` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `model_biblio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_biblio` (
  `model` int NOT NULL,
  `reference` int NOT NULL,
  PRIMARY KEY (`model`,`reference`),
  KEY `mb_biblio_fk` (`reference`),
  CONSTRAINT `mb_biblio_fk` FOREIGN KEY (`reference`) REFERENCES `bibliography` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `model_object`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_object` (
  `id` int NOT NULL AUTO_INCREMENT,
  `model` int NOT NULL,
  `object` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` bigint unsigned NOT NULL DEFAULT '1',
  `author` int NOT NULL,
  `owner` bigint unsigned NOT NULL,
  `license` bigint unsigned NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `uuid` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT (uuid()),
  `thumbnail` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`),
  KEY `model` (`model`),
  KEY `status` (`status`),
  KEY `author` (`author`),
  KEY `owner` (`owner`),
  KEY `license` (`license`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `model_object_ibfk_1` FOREIGN KEY (`model`) REFERENCES `model` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `model_object_ibfk_2` FOREIGN KEY (`status`) REFERENCES `list_item_status` (`id`),
  CONSTRAINT `model_object_ibfk_3` FOREIGN KEY (`author`) REFERENCES `user` (`id`),
  CONSTRAINT `model_object_ibfk_4` FOREIGN KEY (`owner`) REFERENCES `institution` (`id`),
  CONSTRAINT `model_object_ibfk_5` FOREIGN KEY (`license`) REFERENCES `license` (`id`),
  CONSTRAINT `model_object_ibfk_6` FOREIGN KEY (`updated_by`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `model_param`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_param` (
  `object` int NOT NULL,
  `acquisition_method` int NOT NULL,
  `software` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `points` bigint DEFAULT NULL,
  `polygons` bigint DEFAULT NULL,
  `textures` bigint DEFAULT NULL,
  `scans` bigint DEFAULT NULL,
  `pictures` bigint DEFAULT NULL,
  `encumbrance` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `measure_unit` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`object`),
  KEY `acquisition_method` (`acquisition_method`),
  CONSTRAINT `model_param_ibfk_1` FOREIGN KEY (`object`) REFERENCES `model_object` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `model_param_ibfk_2` FOREIGN KEY (`acquisition_method`) REFERENCES `list_model_acquisition` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `model_query_view`;
/*!50001 DROP VIEW IF EXISTS `model_query_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `model_query_view` AS SELECT 
 1 AS `id`,
 1 AS `model`,
 1 AS `object`,
 1 AS `name`,
 1 AS `thumbnail`,
 1 AS `status_id`,
 1 AS `status`,
 1 AS `author_id`,
 1 AS `author`,
 1 AS `owner_id`,
 1 AS `owner`,
 1 AS `license_id`,
 1 AS `license`,
 1 AS `license_acronym`,
 1 AS `license_link`,
 1 AS `create_at`,
 1 AS `updated_at`,
 1 AS `updated_by`,
 1 AS `description`,
 1 AS `note`,
 1 AS `uuid`,
 1 AS `method_id`,
 1 AS `acquisition_method`,
 1 AS `software`,
 1 AS `points`,
 1 AS `polygons`,
 1 AS `textures`,
 1 AS `scans`,
 1 AS `pictures`,
 1 AS `encumbrance`,
 1 AS `measure_unit`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `model_view`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_view` (
  `id` int NOT NULL AUTO_INCREMENT,
  `default_view` tinyint(1) NOT NULL DEFAULT '0',
  `grid` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'gridBase',
  `lightdir` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0,0',
  `lighting` tinyint(1) NOT NULL DEFAULT '0',
  `ortho` tinyint(1) NOT NULL DEFAULT '0',
  `solid` tinyint(1) NOT NULL DEFAULT '0',
  `specular` tinyint(1) NOT NULL DEFAULT '0',
  `texture` tinyint(1) NOT NULL DEFAULT '0',
  `viewside` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '15,15,0,0,0,2',
  `xyz` tinyint(1) NOT NULL DEFAULT '0',
  `model` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `model` (`model`),
  CONSTRAINT `model_view_ibfk_2` FOREIGN KEY (`model`) REFERENCES `model` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `person`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `person` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `institution` bigint unsigned DEFAULT NULL,
  `position` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `institution` (`institution`),
  KEY `position` (`position`),
  CONSTRAINT `person_ibfk_1` FOREIGN KEY (`institution`) REFERENCES `institution` (`id`) ON DELETE CASCADE,
  CONSTRAINT `person_ibfk_2` FOREIGN KEY (`position`) REFERENCES `list_person_position` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `reference`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reference` (
  `id` int NOT NULL AUTO_INCREMENT,
  `artifact` int NOT NULL,
  `type` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `main_authors` text,
  `secondary_authors` text,
  `year` year DEFAULT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `journal` varchar(255) DEFAULT NULL,
  `volume` varchar(50) DEFAULT NULL,
  `issue` varchar(50) DEFAULT NULL,
  `pages` varchar(50) DEFAULT NULL,
  `doi` varchar(128) DEFAULT NULL,
  `url` text,
  `editor` varchar(255) DEFAULT NULL,
  `place` varchar(255) DEFAULT NULL,
  `isbn` varchar(32) DEFAULT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  KEY `artifact` (`artifact`),
  CONSTRAINT `reference_ibfk_1` FOREIGN KEY (`type`) REFERENCES `list_reference_type` (`id`),
  CONSTRAINT `reference_ibfk_2` FOREIGN KEY (`artifact`) REFERENCES `artifact` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `reset_password`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reset_password` (
  `email` varchar(100) NOT NULL,
  `token` varchar(255) NOT NULL,
  `exp_date` varchar(250) NOT NULL DEFAULT ((now() + interval 1 day)),
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `time_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_series` (
  `id` int NOT NULL AUTO_INCREMENT,
  `definition` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` int DEFAULT NULL,
  `state` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE_TIME_SERIES` (`definition`),
  KEY `fk_timeline_author` (`author`),
  CONSTRAINT `fk_timeline_author` FOREIGN KEY (`author`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `time_series_complete`;
/*!50001 DROP VIEW IF EXISTS `time_series_complete`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `time_series_complete` AS SELECT 
 1 AS `timeline_id`,
 1 AS `timeline`,
 1 AS `state`,
 1 AS `macro_id`,
 1 AS `macro`,
 1 AS `generic_id`,
 1 AS `generic`,
 1 AS `specific_id`,
 1 AS `specific`,
 1 AS `start`,
 1 AS `end`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `time_series_generic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_series_generic` (
  `id` int NOT NULL AUTO_INCREMENT,
  `macro` int NOT NULL,
  `definition` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start` int DEFAULT NULL,
  `end` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE_TIME_SERIES_GENERIC` (`macro`,`definition`),
  CONSTRAINT `FK_GENERIC_MACRO` FOREIGN KEY (`macro`) REFERENCES `time_series_macro` (`id`) ON DELETE CASCADE,
  CONSTRAINT `time_series_generic_start_end_check` CHECK ((`start` < `end`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `time_series_macro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_series_macro` (
  `id` int NOT NULL AUTO_INCREMENT,
  `serie` int NOT NULL,
  `definition` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `macro` int NOT NULL,
  `start` int DEFAULT NULL,
  `end` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE_TIME_SERIES_GENERIC` (`serie`,`definition`),
  CONSTRAINT `FK_MACRO_SERIE` FOREIGN KEY (`serie`) REFERENCES `time_series` (`id`) ON DELETE CASCADE,
  CONSTRAINT `time_series_macro_start_end_check` CHECK ((`start` < `end`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `time_series_macro_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_series_macro_definition` (
  `id` int NOT NULL AUTO_INCREMENT,
  `definition` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `definition` (`definition`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `time_series_specific`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_series_specific` (
  `id` int NOT NULL AUTO_INCREMENT,
  `generic` int NOT NULL,
  `definition` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start` int NOT NULL,
  `end` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE_TIME_SERIES_GENERIC` (`generic`,`definition`),
  CONSTRAINT `FK_SPECIFIC_GENERIC` FOREIGN KEY (`generic`) REFERENCES `time_series_generic` (`id`) ON DELETE CASCADE,
  CONSTRAINT `CHECK_START_END` CHECK ((`end` >= `start`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `password_hash` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `role` int NOT NULL,
  `person` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `person` (`person`),
  KEY `role` (`role`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`person`) REFERENCES `person` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_ibfk_2` FOREIGN KEY (`role`) REFERENCES `list_user_role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_artifact_view`;
/*!50001 DROP VIEW IF EXISTS `user_artifact_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `user_artifact_view` AS SELECT 
 1 AS `person_id`,
 1 AS `user_id`,
 1 AS `name`,
 1 AS `role`,
 1 AS `is_active`,
 1 AS `artifact`,
 1 AS `model`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `user_person`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_person` (
  `person` int NOT NULL,
  `user` int NOT NULL,
  `role` int NOT NULL DEFAULT '6',
  PRIMARY KEY (`person`,`user`),
  KEY `user` (`user`),
  KEY `role` (`role`),
  CONSTRAINT `user_person_ibfk_1` FOREIGN KEY (`person`) REFERENCES `person` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_person_ibfk_2` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_person_ibfk_3` FOREIGN KEY (`role`) REFERENCES `list_user_role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50001 DROP VIEW IF EXISTS `artifact_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY INVOKER */
/*!50001 VIEW `artifact_view` AS select `a`.`id` AS `id`,`a`.`weight` AS `weight`,`a`.`name` AS `name`,`a`.`status` AS `status_id`,`status`.`value` AS `status`,`a`.`storage_place` AS `storage_place`,`a`.`inventory` AS `inventory`,`a`.`conservation_state` AS `conservation_state_id`,`conservation`.`value` AS `conservation_state`,`a`.`object_condition` AS `object_condition_id`,`object_condition`.`value` AS `object_condition`,`a`.`is_museum_copy` AS `is_museum_copy`,`a`.`category_class` AS `category_class_id`,`category_class`.`value` AS `category_class`,`a`.`category_specs` AS `category_specs_id`,`category_specs`.`value` AS `category_specs`,`a`.`type` AS `type`,`a`.`timeline` AS `timeline`,`a`.`start` AS `start`,`a`.`end` AS `end`,`a`.`description` AS `description`,`a`.`notes` AS `notes`,`a`.`author` AS `author`,`a`.`owner` AS `owner`,`a`.`license` AS `license`,`a`.`created_at` AS `created_at`,`a`.`last_update` AS `last_update` from (((((`artifact` `a` join `list_item_status` `status` on((`a`.`status` = `status`.`id`))) join `list_conservation_state` `conservation` on((`a`.`conservation_state` = `conservation`.`id`))) left join `list_category_class` `category_class` on((`a`.`category_class` = `category_class`.`id`))) left join `list_category_specs` `category_specs` on((`a`.`category_specs` = `category_specs`.`id`))) left join `list_object_condition` `object_condition` on((`a`.`object_condition` = `object_condition`.`id`))) order by `a`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `geodata`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY INVOKER */
/*!50001 VIEW `geodata` AS select `gadm0`.`gid_0` AS `gid_0`,`gadm0`.`country` AS `country`,`gadm1`.`gid_1` AS `gid_1`,`gadm1`.`name_1` AS `name_1`,`gadm2`.`gid_2` AS `gid_2`,`gadm2`.`name_2` AS `name_2`,`gadm3`.`gid_3` AS `gid_3`,`gadm3`.`name_3` AS `name_3`,`gadm4`.`gid_4` AS `gid_4`,`gadm4`.`name_4` AS `name_4`,`gadm5`.`gid_5` AS `gid_5`,`gadm5`.`name_5` AS `name_5` from (((((`gadm0` left join `gadm1` on((`gadm0`.`gid_0` = `gadm1`.`gid_0`))) left join `gadm2` on((`gadm1`.`gid_1` = `gadm2`.`gid_1`))) left join `gadm3` on((`gadm2`.`gid_2` = `gadm3`.`gid_2`))) left join `gadm4` on((`gadm3`.`gid_3` = `gadm4`.`gid_3`))) left join `gadm5` on((`gadm4`.`gid_4` = `gadm5`.`gid_4`))) order by `gadm0`.`country`,`gadm1`.`name_1`,`gadm2`.`name_2`,`gadm3`.`name_3`,`gadm4`.`name_4`,`gadm5`.`name_5` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `model_query_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY INVOKER */
/*!50001 VIEW `model_query_view` AS select `obj`.`id` AS `id`,`obj`.`model` AS `model`,`obj`.`object` AS `object`,`model`.`name` AS `name`,`obj`.`thumbnail` AS `thumbnail`,`obj`.`status` AS `status_id`,`status`.`value` AS `status`,`obj`.`author` AS `author_id`,concat(`person`.`first_name`,' ',`person`.`last_name`) AS `author`,`obj`.`owner` AS `owner_id`,`owner`.`name` AS `owner`,`obj`.`license` AS `license_id`,`license`.`license` AS `license`,`license`.`acronym` AS `license_acronym`,`license`.`link` AS `license_link`,`obj`.`create_at` AS `create_at`,`obj`.`updated_at` AS `updated_at`,`obj`.`updated_by` AS `updated_by`,`obj`.`description` AS `description`,`obj`.`note` AS `note`,`obj`.`uuid` AS `uuid`,`param`.`acquisition_method` AS `method_id`,`method`.`value` AS `acquisition_method`,`param`.`software` AS `software`,`param`.`points` AS `points`,`param`.`polygons` AS `polygons`,`param`.`textures` AS `textures`,`param`.`scans` AS `scans`,`param`.`pictures` AS `pictures`,`param`.`encumbrance` AS `encumbrance`,`param`.`measure_unit` AS `measure_unit` from ((((((((`model` join `model_object` `obj` on((`obj`.`model` = `model`.`id`))) join `model_param` `param` on((`param`.`object` = `obj`.`id`))) join `list_item_status` `status` on((`obj`.`status` = `status`.`id`))) join `user` on((`obj`.`author` = `user`.`id`))) join `person` on((`user`.`person` = `person`.`id`))) join `institution` `owner` on((`obj`.`owner` = `owner`.`id`))) join `license` on((`obj`.`license` = `license`.`id`))) join `list_model_acquisition` `method` on((`param`.`acquisition_method` = `method`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `time_series_complete`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY INVOKER */
/*!50001 VIEW `time_series_complete` AS select `time_series`.`id` AS `timeline_id`,`time_series`.`definition` AS `timeline`,`time_series`.`state` AS `state`,`macro_def`.`id` AS `macro_id`,`macro_def`.`definition` AS `macro`,`generic`.`id` AS `generic_id`,`generic`.`definition` AS `generic`,`specific`.`id` AS `specific_id`,`specific`.`definition` AS `specific`,coalesce(`specific`.`start`,`generic`.`start`,`macro`.`start`) AS `start`,coalesce(`specific`.`end`,`generic`.`end`,`macro`.`end`) AS `end` from ((((`time_series` left join `time_series_macro` `macro` on((`macro`.`serie` = `time_series`.`id`))) left join `time_series_macro_definition` `macro_def` on((`macro`.`macro` = `macro_def`.`id`))) left join `time_series_generic` `generic` on((`generic`.`macro` = `macro`.`id`))) left join `time_series_specific` `specific` on((`specific`.`generic` = `generic`.`id`))) order by `time_series`.`definition`,`macro_def`.`id`,coalesce(`specific`.`start`,`generic`.`start`,`macro`.`start`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `user_artifact_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY INVOKER */
/*!50001 VIEW `user_artifact_view` AS with `user` as (select `p`.`id` AS `person_id`,`u`.`id` AS `user_id`,concat(`p`.`first_name`,' ',`p`.`last_name`) AS `name`,`role`.`value` AS `role`,`u`.`is_active` AS `is_active` from ((`person` `p` join `user` `u` on((`u`.`person` = `p`.`id`))) join `list_user_role` `role` on((`u`.`role` = `role`.`id`)))), `artifact` as (select `user`.`user_id` AS `author`,coalesce(count(`artifact`.`id`),0) AS `tot` from (`user` left join `artifact` on((`artifact`.`author` = `user`.`user_id`))) group by `user`.`user_id`), `model` as (select `user`.`user_id` AS `author`,coalesce(count(`model`.`id`),0) AS `tot` from (`user` left join `model_object` `model` on((`model`.`author` = `user`.`user_id`))) group by `user`.`user_id`) select `user`.`person_id` AS `person_id`,`user`.`user_id` AS `user_id`,`user`.`name` AS `name`,`user`.`role` AS `role`,`user`.`is_active` AS `is_active`,`artifact`.`tot` AS `artifact`,`model`.`tot` AS `model` from ((`user` join `model` on((`model`.`author` = `user`.`user_id`))) join `artifact` on((`artifact`.`author` = `user`.`user_id`))) order by `user`.`name` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

