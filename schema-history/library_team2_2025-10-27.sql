-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: library-db.mysql.database.azure.com    Database: library_team2
-- ------------------------------------------------------
-- Server version	8.0.42-azure

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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES (1,1,NULL,'admin@library.test','$2a$10$abLb3jf6zhsPn4JHI8SgQ.s28E9TigRwAqK6hwcoGzgjbx89iPefm','admin',1,'2025-10-24 04:41:03','2025-10-24 04:41:03'),(2,2,NULL,'truclt.nikane@gmail.com','$2a$10$Wd5ieJVe5acbkwaeYg4Mp.Qu.dvepHMn4kZn0NfqthWK4VJq54qhi','student',1,'2025-10-24 04:44:42','2025-10-24 04:44:42'),(3,3,NULL,'staff@library.test','$2a$10$4/bgDnWsqhm1mpFeBBYSO.vZ5QmxgVbzGUJyN5Dm6cfKeAoXrTy/O','staff',1,'2025-10-24 05:02:24','2025-10-24 05:02:24'),(4,4,NULL,'test+5433+@demo.com','$2a$10$F604qXeYcY01lAvQPL.5O.kt/s8RI42tYue1tERAdek5MF8i.3e5m','student',1,'2025-10-25 02:56:21','2025-10-25 02:56:21'),(5,5,NULL,'ada@example.com','$2a$10$gR0URMBuwL4T8nKHXt9zmeB1VtJdGn79e91f3URqIvtwcLiZyPf7a','student',1,'2025-10-25 03:41:42','2025-10-25 03:41:42'),(6,7,NULL,'william.a.herrmann@gmail.com','$2a$10$h0xqCx2iGgD7umlz24OTD.3j5Yir6L4eogY.VewFu19Pok/k/oaZq','student',1,'2025-10-25 19:20:28','2025-10-25 19:20:28'),(7,9,NULL,'will@gmail.com','$2a$10$omuReeBxkwOVhlVLxiLgT.922wdgoplRm4.HPKYhhtBAy81WeSy7y','student',1,'2025-10-25 19:36:49','2025-10-25 19:36:49'),(8,10,NULL,'test4@test.com','$2a$10$KtOFjMOmJL4J7/V8cMl/Lu2p6vHfnhuY1Lpq9QB7PJy77nm0Uk0Be','student',1,'2025-10-25 19:38:41','2025-10-25 19:38:41'),(9,11,NULL,'test5@test.com','$2a$10$CXi69khbY3h5ujwVOdzSXOqRtNBg1E3FDcYR11cH1GQY5BLAUY8s6','student',1,'2025-10-25 19:44:52','2025-10-25 19:44:52'),(10,12,NULL,'test6@gmail.com','$2a$10$6Dk8Bio/Cp2XvQaB8k9ZbOqRndMUE/LruJaFfKXMY14Ydk25m1LCy','student',1,'2025-10-25 19:49:43','2025-10-25 19:49:43'),(11,13,NULL,'test7@test.com','$2a$10$wcrGo8ivgIMimRweANgNYeClP3VtMnBKWlwYTLaiaFjzFsKMylvL.','student',1,'2025-10-25 20:03:13','2025-10-25 20:03:13'),(12,14,NULL,'test8@test.com','$2a$10$6mqz2LDeg9W2cgW29x8wH.K2CH/EgSIGuu7n9Z5laQePQmpacbjmK','student',1,'2025-10-25 20:30:27','2025-10-25 20:30:27'),(13,15,NULL,'mhboodram05@gmail.com','$2a$10$Vd3G5N7C401/qQpyvUuy0.DC2CdFMPqp65HxP5DYP41U61RT0BcJm','student',1,'2025-10-27 01:08:35','2025-10-27 01:08:35'),(14,16,NULL,'em@il','$2a$10$Xh0h0WTkLRNsnDDPBpYi2e04in8JOjO0v1n5ZXEKTmjydPw3nLOQC','student',1,'2025-10-27 01:55:30','2025-10-27 01:55:30'),(15,17,NULL,'test@test','$2a$10$t/lIohWw4Qhbjlb9aHiRI.jsSYqpNyFA7BbtnlVpYw3b2Lr.ZNZVG','student',1,'2025-10-27 02:21:17','2025-10-27 02:21:17'),(16,20,NULL,'an_@dmin','$2a$10$RmDeLW40fvdmgDL6Xt5.dOpaTEEiab7e/C/5HfNXf/L0pWOIKeVam','student',1,'2025-10-27 03:26:47','2025-10-27 03:26:47');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `copy`
--

LOCK TABLES `copy` WRITE;
/*!40000 ALTER TABLE `copy` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
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
-- Table structure for table `fine_policy`
--

DROP TABLE IF EXISTS `fine_policy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fine_policy` (
  `policy_id` int NOT NULL AUTO_INCREMENT,
  `media_type` enum('book','dvd','device','room','other') DEFAULT 'book',
  `user_category` enum('student','faculty','staff') DEFAULT 'student',
  `daily_rate` decimal(6,2) DEFAULT NULL,
  `grace_days` int DEFAULT '0',
  `max_fine` decimal(8,2) DEFAULT NULL,
  `replacement_fee` decimal(8,2) DEFAULT NULL,
  `processing_fee` decimal(8,2) DEFAULT NULL,
  `loan_days` int DEFAULT '14',
  `max_active_loans` int DEFAULT '5',
  PRIMARY KEY (`policy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fine_policy`
--

LOCK TABLES `fine_policy` WRITE;
/*!40000 ALTER TABLE `fine_policy` DISABLE KEYS */;
/*!40000 ALTER TABLE `fine_policy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hold`
--

DROP TABLE IF EXISTS `hold`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hold` (
  `hold_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `item_id` int DEFAULT NULL,
  `copy_id` int DEFAULT NULL,
  `fulfilled_loan_id` int DEFAULT NULL,
  `hold_date` datetime NOT NULL,
  `expiration_date` datetime DEFAULT NULL,
  `queue_position` int DEFAULT NULL,
  `status` enum('active','fulfilled','expired','cancelled') DEFAULT 'active',
  `pickup_by` datetime DEFAULT NULL,
  `notified_at` datetime DEFAULT NULL,
  PRIMARY KEY (`hold_id`),
  KEY `user_id` (`user_id`),
  KEY `item_id` (`item_id`),
  KEY `copy_id` (`copy_id`),
  KEY `fulfilled_loan_id` (`fulfilled_loan_id`),
  CONSTRAINT `hold_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `hold_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`),
  CONSTRAINT `hold_ibfk_3` FOREIGN KEY (`copy_id`) REFERENCES `copy` (`copy_id`),
  CONSTRAINT `hold_ibfk_4` FOREIGN KEY (`fulfilled_loan_id`) REFERENCES `loan` (`loan_id`),
  CONSTRAINT `chk_hold_ref` CHECK ((((`item_id` is not null) and (`copy_id` is null)) or ((`item_id` is null) and (`copy_id` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hold`
--

LOCK TABLES `hold` WRITE;
/*!40000 ALTER TABLE `hold` DISABLE KEYS */;
/*!40000 ALTER TABLE `hold` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item`
--

LOCK TABLES `item` WRITE;
/*!40000 ALTER TABLE `item` DISABLE KEYS */;
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
  `policy_id` int DEFAULT NULL,
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
  KEY `policy_id` (`policy_id`),
  CONSTRAINT `loan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `loan_ibfk_2` FOREIGN KEY (`copy_id`) REFERENCES `copy` (`copy_id`),
  CONSTRAINT `loan_ibfk_3` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `loan_ibfk_4` FOREIGN KEY (`policy_id`) REFERENCES `fine_policy` (`policy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan`
--

LOCK TABLES `loan` WRITE;
/*!40000 ALTER TABLE `loan` DISABLE KEYS */;
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
    declare loan_lim int default 5;
    declare loan_count INT default 0;
    declare faculty tinyint(1) default 0;

    select coalesce(is_faculty,0) into faculty
      from user
     where user_id = new.user_id
     limit 1;

    if faculty = 1 then 
        set loan_lim = 7;
    end if;

    select count(*) into loan_count
      from loan
     where user_id = new.user_id
       and status = 'active';

    if loan_count >= loan_lim THEN
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation`
--

LOCK TABLES `reservation` WRITE;
/*!40000 ALTER TABLE `reservation` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room`
--

LOCK TABLES `room` WRITE;
/*!40000 ALTER TABLE `room` DISABLE KEYS */;
/*!40000 ALTER TABLE `room` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'Admin','User','admin@library.test',NULL,NULL,'2025-10-24',NULL),(2,'Truc','Le','truclt.nikane@gmail.com',NULL,NULL,'2025-10-24',NULL),(3,'Staff','User','staff@library.test',NULL,NULL,'2025-10-24',NULL),(4,'Test','User','test+5433+@demo.com',NULL,NULL,'2025-10-25',NULL),(5,'Ada','Lovelace','ada@example.com',NULL,NULL,'2025-10-25',NULL),(7,'William','Herrmann','william.a.herrmann@gmail.com',NULL,NULL,'2025-10-25',NULL),(9,'William','Herrmann','will@gmail.com',NULL,NULL,'2025-10-25',NULL),(10,'Test4','Test4','test4@test.com',NULL,NULL,'2025-10-25',NULL),(11,'Test5','Test5','test5@test.com',NULL,NULL,'2025-10-25',NULL),(12,'test6','test6','test6@gmail.com',NULL,NULL,'2025-10-25',NULL),(13,'Test7','Test7','test7@test.com',NULL,NULL,'2025-10-25',NULL),(14,'test8','test8','test8@test.com',NULL,NULL,'2025-10-25',NULL),(15,'Matthew','Boodram','mhboodram05@gmail.com',NULL,NULL,'2025-10-27',NULL),(16,'John','Doe','em@il',NULL,NULL,'2025-10-27',NULL),(17,'test','test','test@test',NULL,NULL,'2025-10-27',NULL),(20,'Admin','Testguy','an_@dmin',NULL,NULL,'2025-10-27',NULL);
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

-- Dump completed on 2025-10-27  0:26:44
