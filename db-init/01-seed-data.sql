
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

LOCK TABLES `list_conservation_state` WRITE;
/*!40000 ALTER TABLE `list_conservation_state` DISABLE KEYS */;
INSERT INTO `list_conservation_state` (`id`, `value`) VALUES (10,'bad'),(7,'excellent'),(8,'good'),(9,'mediocre'),(11,'not defined');
/*!40000 ALTER TABLE `list_conservation_state` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_file_type` WRITE;
/*!40000 ALTER TABLE `list_file_type` DISABLE KEYS */;
INSERT INTO `list_file_type` (`id`, `value`) VALUES (2,'document'),(1,'image'),(5,'link'),(4,'reference'),(3,'video');
/*!40000 ALTER TABLE `list_file_type` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_institution_category` WRITE;
/*!40000 ALTER TABLE `list_institution_category` DISABLE KEYS */;
INSERT INTO `list_institution_category` (`id`, `value`) VALUES (2,'biblioteque'),(3,'museum'),(4,'public administration'),(6,'research institute'),(1,'uncategorized');
/*!40000 ALTER TABLE `list_institution_category` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_item_status` WRITE;
/*!40000 ALTER TABLE `list_item_status` DISABLE KEYS */;
INSERT INTO `list_item_status` (`id`, `value`) VALUES (2,'complete data'),(1,'under processing');
/*!40000 ALTER TABLE `list_item_status` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_material_class` WRITE;
/*!40000 ALTER TABLE `list_material_class` DISABLE KEYS */;
INSERT INTO `list_material_class` (`id`, `value`) VALUES (1,'Alloy'),(2,'Bone'),(3,'Ceramics'),(4,'Leather'),(5,'Metal'),(9,'not defined'),(6,'Plaster'),(7,'Stone'),(8,'Wood');
/*!40000 ALTER TABLE `list_material_class` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_material_specs` WRITE;
/*!40000 ALTER TABLE `list_material_specs` DISABLE KEYS */;
INSERT INTO `list_material_specs` (`id`, `material_class`, `value`) VALUES (20,1,'Alloy'),(1,1,'Bronze'),(2,2,'Antlers'),(21,2,'Bone'),(3,2,'Horn'),(22,3,'Ceramics'),(23,4,'Leather'),(4,5,'Copper'),(5,5,'Gold'),(6,5,'Iron'),(7,5,'Lead'),(24,5,'Metal'),(8,5,'Silver'),(9,5,'White metal'),(25,6,'Plaster'),(10,7,'Amphibolite'),(11,7,'Basalt'),(12,7,'Diabase'),(13,7,'Flint'),(14,7,'Grindstone'),(15,7,'Quartzite'),(16,7,'Rock'),(17,7,'Sandstone'),(18,7,'Slate'),(19,7,'Soapstone'),(26,7,'Stone'),(27,8,'Wood'),(35,9,'not defined');
/*!40000 ALTER TABLE `list_material_specs` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_measure_unit` WRITE;
/*!40000 ALTER TABLE `list_measure_unit` DISABLE KEYS */;
INSERT INTO `list_measure_unit` (`id`, `value`, `acronym`) VALUES (1,'millimeters','mm'),(2,'centimeters','cm'),(3,'meters','mt');
/*!40000 ALTER TABLE `list_measure_unit` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_model_acquisition` WRITE;
/*!40000 ALTER TABLE `list_model_acquisition` DISABLE KEYS */;
INSERT INTO `list_model_acquisition` (`id`, `value`) VALUES (1,'Photogrammetry'),(2,'Scan'),(3,'SfM, MVS');
/*!40000 ALTER TABLE `list_model_acquisition` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_model_grid` WRITE;
/*!40000 ALTER TABLE `list_model_grid` DISABLE KEYS */;
/*!40000 ALTER TABLE `list_model_grid` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_model_view` WRITE;
/*!40000 ALTER TABLE `list_model_view` DISABLE KEYS */;
INSERT INTO `list_model_view` (`id`, `value`) VALUES (6,'back'),(7,'base'),(2,'bottom'),(8,'box'),(9,'fixed'),(5,'front'),(3,'left'),(10,'none'),(4,'right'),(1,'top');
/*!40000 ALTER TABLE `list_model_view` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_object_condition` WRITE;
/*!40000 ALTER TABLE `list_object_condition` DISABLE KEYS */;
INSERT INTO `list_object_condition` (`id`, `value`) VALUES (2,'completed'),(6,'fragmentary'),(3,'incomplete'),(1,'intact'),(9,'not defined'),(5,'partially reassembled'),(8,'partially reinstated'),(4,'reassembled'),(10,'reinstated');
/*!40000 ALTER TABLE `list_object_condition` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_person_position` WRITE;
/*!40000 ALTER TABLE `list_person_position` DISABLE KEYS */;
INSERT INTO `list_person_position` (`id`, `value`) VALUES (5,'Administrative personnel'),(3,'PhD'),(1,'Professor'),(2,'Researcher'),(4,'Student');
/*!40000 ALTER TABLE `list_person_position` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_reference_type` WRITE;
/*!40000 ALTER TABLE `list_reference_type` DISABLE KEYS */;
INSERT INTO `list_reference_type` (`id`, `value`) VALUES (2,'article'),(1,'book'),(3,'chapter'),(7,'other'),(5,'report'),(4,'thesis'),(6,'website');
/*!40000 ALTER TABLE `list_reference_type` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `list_user_role` WRITE;
/*!40000 ALTER TABLE `list_user_role` DISABLE KEYS */;
INSERT INTO `list_user_role` (`id`, `value`) VALUES (1,'Administrator'),(5,'Author'),(2,'Supervisor');
/*!40000 ALTER TABLE `list_user_role` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `license` WRITE;
/*!40000 ALTER TABLE `license` DISABLE KEYS */;
INSERT INTO `license` (`id`, `license`, `acronym`, `link`, `file`, `active`) VALUES (1,'Public Domain','PD','https://creativecommons.org/publicdomain/mark/1.0/','Public_Domain_Mark_PD.txt',0),(2,'No Rights Reserved','CC0','https://creativecommons.org/publicdomain/zero/1.0/','CC0_1.0.txt',1),(3,'Attribution','CC BY','https://creativecommons.org/licenses/by/4.0/','CC_BY_4.0.txt',1);
/*!40000 ALTER TABLE `license` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `mail_template` WRITE;
/*!40000 ALTER TABLE `mail_template` DISABLE KEYS */;
INSERT INTO `mail_template` (`id`, `object`, `body`, `type`, `created_at`, `last_update`, `created_by`) VALUES (9,'new template','<p>new template</p>','private','2025-01-28 17:27:02','2025-01-29 11:27:36',37);
/*!40000 ALTER TABLE `mail_template` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `time_series_macro_definition` WRITE;
/*!40000 ALTER TABLE `time_series_macro_definition` DISABLE KEYS */;
INSERT INTO `time_series_macro_definition` (`id`, `definition`) VALUES (2,'Bronze Age'),(4,'Classical Age'),(3,'Iron Age'),(5,'Middle Age'),(6,'Modern Age'),(1,'Stone Age');
/*!40000 ALTER TABLE `time_series_macro_definition` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

