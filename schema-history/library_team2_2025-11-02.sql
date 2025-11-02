-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: library-db.mysql.database.azure.com    Database: library_team2
-- ------------------------------------------------------
-- Server version	8.0.42-azure

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account` (
  `account_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `employee_id` int DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','faculty','staff','admin') NOT NULL DEFAULT 'student',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`),
  UNIQUE KEY `email` (`email`),
  KEY `user_id` (`user_id`),
  KEY `fk_account_employee` (`employee_id`),
  CONSTRAINT `account_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_account_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES (1,1,NULL,'admin@library.test','$2a$10$abLb3jf6zhsPn4JHI8SgQ.s28E9TigRwAqK6hwcoGzgjbx89iPefm','admin',1,'2025-10-24 04:41:03','2025-10-24 04:41:03'),(2,2,NULL,'truclt.nikane@gmail.com','$2a$10$Wd5ieJVe5acbkwaeYg4Mp.Qu.dvepHMn4kZn0NfqthWK4VJq54qhi','student',1,'2025-10-24 04:44:42','2025-10-24 04:44:42'),(3,3,NULL,'staff@library.test','$2a$10$4/bgDnWsqhm1mpFeBBYSO.vZ5QmxgVbzGUJyN5Dm6cfKeAoXrTy/O','staff',1,'2025-10-24 05:02:24','2025-10-24 05:02:24'),(4,4,NULL,'test+5433+@demo.com','$2a$10$F604qXeYcY01lAvQPL.5O.kt/s8RI42tYue1tERAdek5MF8i.3e5m','student',1,'2025-10-25 02:56:21','2025-10-25 02:56:21'),(5,5,NULL,'ada@example.com','$2a$10$gR0URMBuwL4T8nKHXt9zmeB1VtJdGn79e91f3URqIvtwcLiZyPf7a','student',1,'2025-10-25 03:41:42','2025-10-25 03:41:42'),(6,7,NULL,'william.a.herrmann@gmail.com','$2a$10$h0xqCx2iGgD7umlz24OTD.3j5Yir6L4eogY.VewFu19Pok/k/oaZq','student',1,'2025-10-25 19:20:28','2025-10-25 19:20:28'),(7,9,NULL,'will@gmail.com','$2a$10$omuReeBxkwOVhlVLxiLgT.922wdgoplRm4.HPKYhhtBAy81WeSy7y','student',1,'2025-10-25 19:36:49','2025-10-25 19:36:49'),(8,10,NULL,'test4@test.com','$2a$10$KtOFjMOmJL4J7/V8cMl/Lu2p6vHfnhuY1Lpq9QB7PJy77nm0Uk0Be','student',1,'2025-10-25 19:38:41','2025-10-25 19:38:41'),(9,11,NULL,'test5@test.com','$2a$10$CXi69khbY3h5ujwVOdzSXOqRtNBg1E3FDcYR11cH1GQY5BLAUY8s6','student',1,'2025-10-25 19:44:52','2025-10-25 19:44:52'),(10,12,NULL,'test6@gmail.com','$2a$10$6Dk8Bio/Cp2XvQaB8k9ZbOqRndMUE/LruJaFfKXMY14Ydk25m1LCy','student',1,'2025-10-25 19:49:43','2025-10-25 19:49:43'),(11,13,NULL,'test7@test.com','$2a$10$wcrGo8ivgIMimRweANgNYeClP3VtMnBKWlwYTLaiaFjzFsKMylvL.','student',1,'2025-10-25 20:03:13','2025-10-25 20:03:13'),(12,14,NULL,'test8@test.com','$2a$10$6mqz2LDeg9W2cgW29x8wH.K2CH/EgSIGuu7n9Z5laQePQmpacbjmK','student',1,'2025-10-25 20:30:27','2025-10-25 20:30:27'),(13,15,NULL,'mhboodram05@gmail.com','$2a$10$Vd3G5N7C401/qQpyvUuy0.DC2CdFMPqp65HxP5DYP41U61RT0BcJm','student',1,'2025-10-27 01:08:35','2025-10-27 01:08:35'),(14,16,NULL,'em@il','$2a$10$Xh0h0WTkLRNsnDDPBpYi2e04in8JOjO0v1n5ZXEKTmjydPw3nLOQC','student',1,'2025-10-27 01:55:30','2025-10-27 01:55:30'),(15,17,NULL,'test@test','$2a$10$t/lIohWw4Qhbjlb9aHiRI.jsSYqpNyFA7BbtnlVpYw3b2Lr.ZNZVG','student',1,'2025-10-27 02:21:17','2025-10-27 02:21:17'),(16,20,NULL,'an_@dmin','$2a$10$RmDeLW40fvdmgDL6Xt5.dOpaTEEiab7e/C/5HfNXf/L0pWOIKeVam','student',1,'2025-10-27 03:26:47','2025-10-27 03:26:47'),(17,21,NULL,'amberkaul5@gmail.com','$2a$10$Y/Z2E05j.rlmMwhO/4RkSu.u/dwhcnU6hreSnyKrgLVszMUa9DLfi','student',1,'2025-10-27 21:11:18','2025-10-27 21:11:18'),(18,22,NULL,'a@test','$2a$10$FqJmW2EeGa5Nkuz1vKP1Aem1daP36tVPZdXiMQCL2PMlY/tNwvbFW','student',1,'2025-10-27 21:22:02','2025-10-27 21:22:02'),(19,23,NULL,'test@test1','$2a$10$MBSbwWYROUEGep5.nlin4eIKJ7jtBHR00Q4zZe05.OO4eylOmxhpq','student',1,'2025-10-27 21:36:25','2025-10-27 21:36:25'),(20,24,NULL,'test@3','$2a$10$q72wK9bAE9TCML1oG5qA/OGiBh.OiRkcZyoYJfxI.XLFy.Qv9a4xa','student',1,'2025-10-27 21:47:37','2025-10-27 21:47:37'),(21,25,NULL,'hello@123.com','$2a$10$JCuC6E8L0mHMcRUMH9N8jOHJZ44sFXUQlAvB8tZf.mJCErF6QArUe','student',1,'2025-10-27 22:08:47','2025-10-27 22:08:47'),(22,26,1,'mr@dmin','$2a$10$2T5fvX8dUF5et1HkfBF/jeXj96d.RAXqWZiu6dex3x/OV4FGt37bi','staff',1,'2025-10-27 22:09:16','2025-10-27 22:09:16'),(23,27,2,'staff@amber.com','$2a$10$0Pa.LUPsAH3qOdwBVPH3g.ZohLSyMx40P/b2sFsDQdr6clE9prKEa','staff',1,'2025-10-27 22:26:55','2025-10-27 22:26:55'),(24,28,3,'will@will','$2a$10$txNzTNNgBek0MpaT6Bqv8uV1nkWes/rom2eeptH6emjBvtaGQHoWK','staff',1,'2025-10-27 23:56:00','2025-10-27 23:56:00'),(25,29,NULL,'e@e','$2a$10$qW7gkjaHLxFESwx9Kxz/5O4BFbAZgO1ckY6d1kz2USUH0DKoRTkVG','student',1,'2025-10-28 00:08:44','2025-10-28 00:08:44'),(26,30,4,'employee@employee','$2a$10$2d2sXwI5m9.KHDmGzAgdA.S4kr2fU/UwO5qNZimbkjTU4ahuXMbha','staff',1,'2025-10-28 00:09:50','2025-10-28 00:09:50'),(27,31,NULL,'finalnot@test','$2a$10$0sgBanJdT9b1RLgEiUoJee.tnYCSEccGFeHMLExAz0P.JmVNV0mSe','student',1,'2025-10-28 00:39:36','2025-10-28 00:39:36'),(28,32,NULL,'jsmith@example.com','$2a$10$zejSYbzAlnPOAbI.v1ZzE.sBJF772ueq7GHczga1HiRckrVrV3Hx.','student',1,'2025-10-28 00:43:49','2025-10-28 00:43:49'),(29,33,5,'jwilliams@example.com','$2a$10$LyZlvFC.qpRvWtaacUAueO3/DpR0Qmhe/Epc8kEVtyBhyXGsweGCa','staff',1,'2025-10-28 00:47:55','2025-10-28 00:47:55'),(30,34,6,'w@w','$2a$10$StFrQhPuOqqAxqFjfbFK4Oo/fsZwhgFLFWyMqGqTujCpxQBIv.xBS','staff',1,'2025-10-28 00:53:24','2025-10-28 00:53:24'),(31,35,7,'libarry@example.com','$2a$10$E0wM6TYi/.0Po7yeQMQW5ehE8hQcoRj21ebX1aaeExRsIW7GbpNBW','staff',1,'2025-10-28 01:17:22','2025-10-28 01:17:22'),(32,36,8,'adminmatt@admin.net','$2a$10$HpH5KwAjD7h7t5Mkxbn3WeUVmjD9dAp0L3DZdIx8RiMVhkvJRTKxG','staff',1,'2025-10-28 02:47:10','2025-10-28 02:47:10'),(33,37,NULL,'ngota0330@yahoo.com','$2a$10$ZaUUSEPjGOkAl9tM.IG1K.aQn6RY2L5GX/4aS/smHacRu29dw7B7C','student',1,'2025-10-28 04:21:15','2025-10-28 04:21:15'),(34,38,9,'anoriginalusername42@gmail.com','$2a$10$coGAGn1005A8cfO0RySY4uUnFVoZnuTM21e9SUvPUhMvaB9Mow7We','staff',1,'2025-10-28 16:39:41','2025-10-28 16:39:41'),(35,39,NULL,'josh.3589.me@gmail.com','$2a$10$J5il0TCu5DhRTtlgASete.OiTNn6LupngHX0RQ48/9zyaO9EcpHg6','student',1,'2025-10-28 20:10:58','2025-10-28 20:10:58'),(36,40,NULL,'nikkinguyen730@gmail.com','$2a$10$cssyRVpUsVTHAuKJdSLd7e5JbXZKiAQpapvQB/rp/QHrbW6WHVADu','student',1,'2025-10-28 22:38:44','2025-10-28 22:38:44'),(37,41,10,'staff.cli+20251029132032@example.com','$2a$10$4/hQYNFaPtfwHbcw3vNa6Odad.I77ESirPL4iJTDnChrhUb1SQVFa','staff',1,'2025-10-29 18:20:35','2025-10-29 18:20:35'),(38,42,11,'staff.cli+20251029132048@example.com','$2a$10$YuF7xWaisKJ7p5flgSr6I.EQjehohw9p6eeir9MEJky/lKF.u7/K.','staff',1,'2025-10-29 18:20:49','2025-10-29 18:20:49'),(39,43,NULL,'filzaroche@gmail.com','$2a$10$pll7AYG6QphKv5P34IxTNOVyftB4KdtFL82St2JuE6qaIA3SucVYS','student',1,'2025-10-29 22:12:54','2025-10-29 22:12:54'),(40,44,NULL,'kathiana119@gmail.com','$2a$10$98Gxr5eacsCp1SCnXFd6Iuq5nBWOttx7mC/Fe8eI9r16NpUrkBzy.','student',1,'2025-10-29 22:37:55','2025-10-29 22:37:55');
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `author`
--

DROP TABLE IF EXISTS `author`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `author` (
  `author_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  PRIMARY KEY (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `author`
--

LOCK TABLES `author` WRITE;
/*!40000 ALTER TABLE `author` DISABLE KEYS */;
/*!40000 ALTER TABLE `author` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book`
--

DROP TABLE IF EXISTS `book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book` (
  `item_id` int NOT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `publisher` varchar(100) DEFAULT NULL,
  `publication_year` int DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `isbn` (`isbn`),
  CONSTRAINT `book_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` VALUES (9,'15791678076','JP Pub',2009),(10,'19298384773','Spam Futures',2001),(11,'123','Shonen Jump',1993),(16,'9712345678943','Jump',1993),(17,'9780000000000','CLI Press',2024),(18,'1111111111','Penguin',2006);
/*!40000 ALTER TABLE `book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `copy`
--

DROP TABLE IF EXISTS `copy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `copy` (
  `copy_id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `barcode` varchar(50) NOT NULL,
  `status` enum('available','on_loan','repair','lost') DEFAULT 'available',
  `shelf_location` varchar(100) DEFAULT NULL,
  `acquired_at` date DEFAULT NULL,
  PRIMARY KEY (`copy_id`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `copy_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `copy`
--

LOCK TABLES `copy` WRITE;
/*!40000 ALTER TABLE `copy` DISABLE KEYS */;
INSERT INTO `copy` VALUES (1,1,'N/A','on_loan','N/A','2025-10-28'),(3,2,'1','on_loan','B2','2025-10-28'),(5,4,'2','on_loan','B1','2025-10-28'),(6,4,'3','on_loan','B1','2025-10-28'),(7,4,'4','on_loan','B1','2025-10-28'),(10,7,'8','on_loan','C2','2025-10-28'),(11,8,'5','available','D4','2025-10-28'),(12,8,'6','available','D4','2025-10-28'),(13,8,'7','available','D4','2025-10-28'),(14,9,'JP-17868390','available','Manga F4','2025-10-28'),(15,9,'JP-17868391','available','Manga F4','2025-10-28'),(16,9,'JP-17868392','available','Manga F4','2025-10-28'),(17,10,'111','on_loan','Clones A','2025-10-28'),(18,10,'222','available','Clones A','2025-10-28'),(19,10,'333','available','Clones A','2025-10-28'),(20,10,'444','available','Clones A','2025-10-28'),(21,10,'555','available','Clones A','2025-10-28'),(22,10,'666','available','Clones A','2025-10-28'),(23,10,'777','available','Clones A','2025-10-28'),(24,10,'888','available','Clones A','2025-10-28'),(25,10,'999','available','Clones A','2025-10-28'),(26,10,'101010','on_loan','Clones A','2025-10-28'),(27,10,'111111','available','Clones A','2025-10-28'),(28,10,'121212','available','Clones A','2025-10-28'),(29,10,'131313','available','Clones A','2025-10-28'),(30,10,'141414','available','Clones A','2025-10-28'),(31,10,'151515','available','Clones A','2025-10-28'),(33,13,'669','available','B5','2025-10-28'),(34,13,'667','available','B5','2025-10-28'),(36,15,'1000','available','A3','2025-10-28'),(37,15,'1001','available','A3','2025-10-28'),(38,16,'1002','available',NULL,'2025-10-28'),(39,16,'1003','available',NULL,'2025-10-28'),(40,16,'1004','available',NULL,'2025-10-28'),(41,17,'BC-837694','available','A101','2025-10-29'),(42,18,'BC-000123','available','Stacks A3','2025-10-29');
/*!40000 ALTER TABLE `copy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device`
--

DROP TABLE IF EXISTS `device`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `device` (
  `item_id` int NOT NULL,
  `model` varchar(100) DEFAULT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `device_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device`
--

LOCK TABLES `device` WRITE;
/*!40000 ALTER TABLE `device` DISABLE KEYS */;
/*!40000 ALTER TABLE `device` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `role` enum('librarian','clerk','assistant','admin') NOT NULL,
  `hire_date` date NOT NULL,
  PRIMARY KEY (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
INSERT INTO `employee` VALUES (1,'admin','superuser','assistant','2025-10-27'),(2,'Staff','Amber','assistant','2025-10-27'),(3,'will','will','assistant','2025-10-27'),(4,'employee','1','assistant','2025-10-28'),(5,'Jesse','Williams','assistant','2025-10-28'),(6,'W','W','assistant','2025-10-28'),(7,'Barry','Li','assistant','2025-10-28'),(8,'admin','Matt','assistant','2025-10-28'),(9,'John','Smith','assistant','2025-10-28'),(10,'CLI','Staff','assistant','2025-10-29'),(11,'CLI','Staff','assistant','2025-10-29');
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fine`
--

DROP TABLE IF EXISTS `fine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fine` (
  `fine_id` int NOT NULL AUTO_INCREMENT,
  `loan_id` int NOT NULL,
  `user_id` int NOT NULL,
  `assessed_by_employee_id` int DEFAULT NULL,
  `assessed_at` datetime NOT NULL,
  `reason` enum('overdue','lost','damage','manual') DEFAULT 'overdue',
  `amount_assessed` decimal(8,2) NOT NULL,
  `status` enum('open','partially_paid','paid','waived','written_off') DEFAULT 'open',
  `notes` text,
  PRIMARY KEY (`fine_id`),
  KEY `loan_id` (`loan_id`),
  KEY `user_id` (`user_id`),
  KEY `assessed_by_employee_id` (`assessed_by_employee_id`),
  CONSTRAINT `fine_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loan` (`loan_id`),
  CONSTRAINT `fine_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fine_ibfk_3` FOREIGN KEY (`assessed_by_employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fine`
--

LOCK TABLES `fine` WRITE;
/*!40000 ALTER TABLE `fine` DISABLE KEYS */;
/*!40000 ALTER TABLE `fine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fine_payment`
--

DROP TABLE IF EXISTS `fine_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fine_payment` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `fine_id` int NOT NULL,
  `employee_id` int DEFAULT NULL,
  `payment_at` datetime NOT NULL,
  `amount` decimal(8,2) DEFAULT NULL,
  `type` enum('payment','waiver','writeoff','refund') DEFAULT 'payment',
  `method` enum('cash','card','online') DEFAULT 'cash',
  `reference` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `fine_id` (`fine_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `fine_payment_ibfk_1` FOREIGN KEY (`fine_id`) REFERENCES `fine` (`fine_id`),
  CONSTRAINT `fine_payment_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fine_payment`
--

LOCK TABLES `fine_payment` WRITE;
/*!40000 ALTER TABLE `fine_payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `fine_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `classification` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item`
--

LOCK TABLES `item` WRITE;
/*!40000 ALTER TABLE `item` DISABLE KEYS */;
INSERT INTO `item` VALUES (1,'Red','N/A','N/A'),(2,'Blue','Color','123'),(3,'Green','Color','123'),(4,'Green','Color','123'),(5,'Purple','Color','456'),(6,'Purple','Color','456'),(7,'Purple','Color','456'),(8,'Orange','color',NULL),(9,'Filler Manga Volume 1','Manga',NULL),(10,'Cloning Books The Easy Way','Informational','193746839'),(11,'Filler Manga V2','Manga',NULL),(13,'Filler Manga V2','Manga',NULL),(14,'Filler Manga 3','Manga',NULL),(15,'Filler Manga V4','Manga',NULL),(16,'Filler Manga V6','Manga',NULL),(17,'Test Book via CLI',NULL,NULL),(18,'Book2','Fantasy','813.52FIT');
/*!40000 ALTER TABLE `item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_author`
--

DROP TABLE IF EXISTS `item_author`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_author` (
  `item_id` int NOT NULL,
  `author_id` int NOT NULL,
  PRIMARY KEY (`item_id`,`author_id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `item_author_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`),
  CONSTRAINT `item_author_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `author` (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_author`
--

LOCK TABLES `item_author` WRITE;
/*!40000 ALTER TABLE `item_author` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_author` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_tag_link`
--

DROP TABLE IF EXISTS `item_tag_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_tag_link` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_itlink_item_id` (`item_id`),
  KEY `fk_itlink_tag_id` (`tag_id`),
  CONSTRAINT `fk_itlink_item_id` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`),
  CONSTRAINT `fk_itlink_tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_tag_link`
--

LOCK TABLES `item_tag_link` WRITE;
/*!40000 ALTER TABLE `item_tag_link` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_tag_link` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `library_card`
--

DROP TABLE IF EXISTS `library_card`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `library_card` (
  `card_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `card_number` varchar(30) NOT NULL,
  `barcode` varchar(50) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `issued_at` date NOT NULL,
  `expires_at` date DEFAULT NULL,
  `deactivated_at` date DEFAULT NULL,
  PRIMARY KEY (`card_id`),
  UNIQUE KEY `card_number` (`card_number`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `library_card_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `library_card`
--

LOCK TABLES `library_card` WRITE;
/*!40000 ALTER TABLE `library_card` DISABLE KEYS */;
/*!40000 ALTER TABLE `library_card` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan`
--

DROP TABLE IF EXISTS `loan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan` (
  `loan_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `copy_id` int NOT NULL,
  `employee_id` int DEFAULT NULL,
  `checkout_date` datetime NOT NULL,
  `due_date` date NOT NULL,
  `return_date` datetime DEFAULT NULL,
  `status` enum('active','returned','lost') DEFAULT 'active',
  `renewal_count` int DEFAULT '0',
  `daily_fine_rate_snapshot` decimal(6,2) DEFAULT NULL,
  `grace_days_snapshot` int DEFAULT NULL,
  `max_fine_snapshot` decimal(8,2) DEFAULT NULL,
  `replacement_fee_snapshot` decimal(8,2) DEFAULT NULL,
  PRIMARY KEY (`loan_id`),
  KEY `user_id` (`user_id`),
  KEY `copy_id` (`copy_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `loan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `loan_ibfk_2` FOREIGN KEY (`copy_id`) REFERENCES `copy` (`copy_id`),
  CONSTRAINT `loan_ibfk_3` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan`
--

LOCK TABLES `loan` WRITE;
/*!40000 ALTER TABLE `loan` DISABLE KEYS */;
INSERT INTO `loan` VALUES (1,1,1,6,'2025-10-28 01:07:43','2025-11-10',NULL,'active',0,NULL,NULL,NULL,NULL),(2,1,3,6,'2025-10-28 01:07:53','2025-11-10',NULL,'active',0,NULL,NULL,NULL,NULL),(3,1,5,6,'2025-10-28 01:10:11','2025-11-10',NULL,'active',0,NULL,NULL,NULL,NULL),(4,1,6,6,'2025-10-28 01:10:31','2025-11-10',NULL,'active',0,NULL,NULL,NULL,NULL),(5,1,7,6,'2025-10-28 01:10:38','2025-11-10',NULL,'active',0,NULL,NULL,NULL,NULL),(6,33,17,6,'2025-10-28 01:38:22','2025-11-10',NULL,'active',0,NULL,NULL,NULL,NULL),(7,10,10,6,'2025-10-28 01:53:35','2025-11-10',NULL,'active',0,NULL,NULL,NULL,NULL),(8,7,26,6,'2025-10-28 01:57:53','2025-11-10',NULL,'active',0,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `loan` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`db2root`@`%`*/ /*!50003 TRIGGER `loan_limit` BEFORE INSERT ON `loan` FOR EACH ROW begin
    declare loan_lim int;
    declare loan_count INT;
    declare faculty bool;
    select count(*) into loan_count from loan where user_id = new.user_id;
    select is_faculty into faculty from user where user_id = new.user_id;
    if faculty then 
        set loan_lim = 7;
    else set loan_lim = 5;
    end if;

    if loan_count > loan_lim THEN
        signal SQLSTATE '45000'
        set MESSAGE_TEXT = 'Failed to add new loan: User loan limit exceeded';
    end if;
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `media`
--

DROP TABLE IF EXISTS `media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media` (
  `item_id` int NOT NULL,
  `media_type` enum('DVD','Blu-ray','CD','Other') DEFAULT 'DVD',
  `length_minutes` int DEFAULT NULL,
  `publisher` varchar(100) DEFAULT NULL,
  `publication_year` int DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `media_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media`
--

LOCK TABLES `media` WRITE;
/*!40000 ALTER TABLE `media` DISABLE KEYS */;
/*!40000 ALTER TABLE `media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation`
--

DROP TABLE IF EXISTS `reservation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation` (
  `reservation_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `room_id` int NOT NULL,
  `employee_id` int DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `status` enum('active','cancelled','completed') DEFAULT 'active',
  PRIMARY KEY (`reservation_id`),
  KEY `user_id` (`user_id`),
  KEY `room_id` (`room_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `reservation_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `reservation_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`),
  CONSTRAINT `reservation_ibfk_3` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation`
--

LOCK TABLES `reservation` WRITE;
/*!40000 ALTER TABLE `reservation` DISABLE KEYS */;
INSERT INTO `reservation` VALUES (2,1,1,2,'2025-10-27 18:00:00','2025-10-27 20:00:00','active'),(3,32,2,7,'2025-10-29 17:47:00','2025-10-30 17:47:00','active'),(4,32,2,7,'2025-10-31 08:11:00','2025-10-31 08:15:00','active'),(6,2,1,NULL,'2025-11-02 21:05:00','2025-11-02 23:05:00','active');
/*!40000 ALTER TABLE `reservation` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`db2root`@`%`*/ /*!50003 TRIGGER `prevent_overlap` BEFORE INSERT ON `reservation` FOR EACH ROW begin
    declare conflicts INT;
    select count(*) into conflicts from reservation
    where room_id = new.room_id
        and new.start_time <= end_time
        and new.end_time >= start_time;
    
    if conflicts > 0 THEN
        signal SQLSTATE '45000'
        set MESSAGE_TEXT = 'Failed to add reservation: Scheduling conflict';
    end if;
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room` (
  `room_id` int NOT NULL AUTO_INCREMENT,
  `room_number` varchar(10) NOT NULL,
  `capacity` int DEFAULT NULL,
  `features` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`room_id`),
  UNIQUE KEY `room_number` (`room_number`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room`
--

LOCK TABLES `room` WRITE;
/*!40000 ALTER TABLE `room` DISABLE KEYS */;
INSERT INTO `room` VALUES (1,'1',NULL,NULL),(2,'A201',100,NULL);
/*!40000 ALTER TABLE `room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tag`
--

DROP TABLE IF EXISTS `tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tag` (
  `tag_id` int NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `visible_to_user` tinyint(1) NOT NULL,
  `visible_to_admin` tinyint(1) NOT NULL,
  PRIMARY KEY (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tag`
--

LOCK TABLES `tag` WRITE;
/*!40000 ALTER TABLE `tag` DISABLE KEYS */;
/*!40000 ALTER TABLE `tag` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_faculty` tinyint(1) DEFAULT NULL,
  `joined_at` date DEFAULT NULL,
  `expires_at` date DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'Admin','User','admin@library.test',NULL,NULL,'2025-10-24',NULL),(2,'Truc','Le','truclt.nikane@gmail.com',NULL,NULL,'2025-10-24',NULL),(3,'Staff','User','staff@library.test',NULL,NULL,'2025-10-24',NULL),(4,'Test','User','test+5433+@demo.com',NULL,NULL,'2025-10-25',NULL),(5,'Ada','Lovelace','ada@example.com',NULL,NULL,'2025-10-25',NULL),(7,'William','Herrmann','william.a.herrmann@gmail.com',NULL,NULL,'2025-10-25',NULL),(9,'William','Herrmann','will@gmail.com',NULL,NULL,'2025-10-25',NULL),(10,'Test4','Test4','test4@test.com',NULL,NULL,'2025-10-25',NULL),(11,'Test5','Test5','test5@test.com',NULL,NULL,'2025-10-25',NULL),(12,'test6','test6','test6@gmail.com',NULL,NULL,'2025-10-25',NULL),(13,'Test7','Test7','test7@test.com',NULL,NULL,'2025-10-25',NULL),(14,'test8','test8','test8@test.com',NULL,NULL,'2025-10-25',NULL),(15,'Matthew','Boodram','mhboodram05@gmail.com',NULL,NULL,'2025-10-27',NULL),(16,'John','Doe','em@il',NULL,NULL,'2025-10-27',NULL),(17,'test','test','test@test',NULL,NULL,'2025-10-27',NULL),(20,'Admin','Testguy','an_@dmin',NULL,NULL,'2025-10-27',NULL),(21,'Amber','Kaul','amberkaul5@gmail.com',NULL,NULL,'2025-10-27',NULL),(22,'test','test2','a@test',NULL,NULL,'2025-10-27',NULL),(23,'test','test1','test@test1',NULL,NULL,'2025-10-27',NULL),(24,'test3','test','test@3',NULL,NULL,'2025-10-27',NULL),(25,'A','K','hello@123.com',NULL,NULL,'2025-10-27',NULL),(26,'admin','superuser','mr@dmin',NULL,NULL,'2025-10-27',NULL),(27,'Staff','Amber','staff@amber.com',NULL,NULL,'2025-10-27',NULL),(28,'will','will','will@will',NULL,NULL,'2025-10-27',NULL),(29,'e','e','e@e',NULL,NULL,'2025-10-28',NULL),(30,'employee','1','employee@employee',NULL,NULL,'2025-10-28',NULL),(31,'test','test34','finalnot@test',NULL,NULL,'2025-10-28',NULL),(32,'Jordan','Smith','jsmith@example.com',NULL,NULL,'2025-10-28',NULL),(33,'Jesse','Williams','jwilliams@example.com',NULL,NULL,'2025-10-28',NULL),(34,'W','W','w@w',NULL,NULL,'2025-10-28',NULL),(35,'Barry','Li','libarry@example.com',NULL,NULL,'2025-10-28',NULL),(36,'admin','Matt','adminmatt@admin.net',NULL,NULL,'2025-10-28',NULL),(37,'Merlin','Ambrose','ngota0330@yahoo.com',NULL,NULL,'2025-10-28',NULL),(38,'John','Smith','anoriginalusername42@gmail.com',NULL,NULL,'2025-10-28',NULL),(39,'John','Smithian','josh.3589.me@gmail.com',NULL,NULL,'2025-10-28',NULL),(40,'kiwi','kiki','nikkinguyen730@gmail.com',NULL,NULL,'2025-10-28',NULL),(41,'CLI','Staff','staff.cli+20251029132032@example.com',NULL,NULL,'2025-10-29',NULL),(42,'CLI','Staff','staff.cli+20251029132048@example.com',NULL,NULL,'2025-10-29',NULL),(43,'Filza','Roche','filzaroche@gmail.com',NULL,NULL,'2025-10-29',NULL),(44,'Kathiana','Rodriguez','kathiana119@gmail.com',NULL,NULL,'2025-10-29',NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'library_team2'
--

--
-- Dumping routines for database 'library_team2'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-02 13:19:24
