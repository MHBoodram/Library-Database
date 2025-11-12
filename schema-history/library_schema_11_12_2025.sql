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
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES (1,1,NULL,'admin@library.test','$2a$10$abLb3jf6zhsPn4JHI8SgQ.s28E9TigRwAqK6hwcoGzgjbx89iPefm','student',1,'2025-10-24 04:41:03','2025-11-12 00:28:43',0,NULL,NULL),(2,2,NULL,'truclt.nikane@gmail.com','$2a$10$3dqB6HVF481fc/iJQ9ri5.3ZoiYX14SYbf3DVyUczdYMO2ws9tYTC','student',1,'2025-10-24 04:44:42','2025-11-11 05:22:52',0,NULL,NULL),(3,3,NULL,'staff@library.test','$2a$10$4/bgDnWsqhm1mpFeBBYSO.vZ5QmxgVbzGUJyN5Dm6cfKeAoXrTy/O','student',1,'2025-10-24 05:02:24','2025-11-12 00:29:05',0,NULL,NULL),(4,4,NULL,'test+5433+@demo.com','$2a$10$F604qXeYcY01lAvQPL.5O.kt/s8RI42tYue1tERAdek5MF8i.3e5m','student',1,'2025-10-25 02:56:21','2025-10-25 02:56:21',0,NULL,NULL),(5,5,NULL,'ada@example.com','$2a$10$gR0URMBuwL4T8nKHXt9zmeB1VtJdGn79e91f3URqIvtwcLiZyPf7a','student',1,'2025-10-25 03:41:42','2025-10-25 03:41:42',0,NULL,NULL),(6,7,NULL,'william.a.herrmann@gmail.com','$2a$10$h0xqCx2iGgD7umlz24OTD.3j5Yir6L4eogY.VewFu19Pok/k/oaZq','student',0,'2025-10-25 19:20:28','2025-11-12 01:51:52',1,'2025-11-08 04:53:34',30),(7,9,NULL,'will@gmail.com','$2a$10$omuReeBxkwOVhlVLxiLgT.922wdgoplRm4.HPKYhhtBAy81WeSy7y','student',1,'2025-10-25 19:36:49','2025-10-25 19:36:49',0,NULL,NULL),(8,10,NULL,'test4@test.com','$2a$10$KtOFjMOmJL4J7/V8cMl/Lu2p6vHfnhuY1Lpq9QB7PJy77nm0Uk0Be','student',1,'2025-10-25 19:38:41','2025-10-25 19:38:41',0,NULL,NULL),(9,11,NULL,'test5@test.com','$2a$10$CXi69khbY3h5ujwVOdzSXOqRtNBg1E3FDcYR11cH1GQY5BLAUY8s6','student',1,'2025-10-25 19:44:52','2025-10-25 19:44:52',0,NULL,NULL),(10,12,NULL,'test6@gmail.com','$2a$10$6Dk8Bio/Cp2XvQaB8k9ZbOqRndMUE/LruJaFfKXMY14Ydk25m1LCy','student',1,'2025-10-25 19:49:43','2025-10-25 19:49:43',0,NULL,NULL),(11,13,NULL,'test7@test.com','$2a$10$wcrGo8ivgIMimRweANgNYeClP3VtMnBKWlwYTLaiaFjzFsKMylvL.','student',1,'2025-10-25 20:03:13','2025-10-25 20:03:13',0,NULL,NULL),(12,14,NULL,'test8@test.com','$2a$10$6mqz2LDeg9W2cgW29x8wH.K2CH/EgSIGuu7n9Z5laQePQmpacbjmK','student',1,'2025-10-25 20:30:27','2025-10-25 20:30:27',0,NULL,NULL),(13,15,NULL,'mhboodram05@gmail.com','$2a$10$Vd3G5N7C401/qQpyvUuy0.DC2CdFMPqp65HxP5DYP41U61RT0BcJm','student',1,'2025-10-27 01:08:35','2025-10-27 01:08:35',0,NULL,NULL),(14,16,NULL,'em@il','$2a$10$Xh0h0WTkLRNsnDDPBpYi2e04in8JOjO0v1n5ZXEKTmjydPw3nLOQC','student',1,'2025-10-27 01:55:30','2025-10-27 01:55:30',0,NULL,NULL),(15,17,NULL,'test@test','$2a$10$t/lIohWw4Qhbjlb9aHiRI.jsSYqpNyFA7BbtnlVpYw3b2Lr.ZNZVG','student',1,'2025-10-27 02:21:17','2025-10-27 02:21:17',0,NULL,NULL),(16,20,NULL,'an_@dmin','$2a$10$RmDeLW40fvdmgDL6Xt5.dOpaTEEiab7e/C/5HfNXf/L0pWOIKeVam','student',1,'2025-10-27 03:26:47','2025-10-27 03:26:47',0,NULL,NULL),(17,21,NULL,'amberkaul5@gmail.com','$2a$10$Y/Z2E05j.rlmMwhO/4RkSu.u/dwhcnU6hreSnyKrgLVszMUa9DLfi','student',1,'2025-10-27 21:11:18','2025-10-27 21:11:18',0,NULL,NULL),(18,22,NULL,'a@test','$2a$10$FqJmW2EeGa5Nkuz1vKP1Aem1daP36tVPZdXiMQCL2PMlY/tNwvbFW','student',1,'2025-10-27 21:22:02','2025-10-27 21:22:02',0,NULL,NULL),(19,23,NULL,'test@test1','$2a$10$MBSbwWYROUEGep5.nlin4eIKJ7jtBHR00Q4zZe05.OO4eylOmxhpq','student',1,'2025-10-27 21:36:25','2025-10-27 21:36:25',0,NULL,NULL),(20,24,NULL,'test@3','$2a$10$q72wK9bAE9TCML1oG5qA/OGiBh.OiRkcZyoYJfxI.XLFy.Qv9a4xa','student',1,'2025-10-27 21:47:37','2025-10-27 21:47:37',0,NULL,NULL),(21,25,NULL,'hello@123.com','$2a$10$JCuC6E8L0mHMcRUMH9N8jOHJZ44sFXUQlAvB8tZf.mJCErF6QArUe','student',1,'2025-10-27 22:08:47','2025-10-27 22:08:47',0,NULL,NULL),(22,26,1,'mr@dmin','$2a$10$2T5fvX8dUF5et1HkfBF/jeXj96d.RAXqWZiu6dex3x/OV4FGt37bi','staff',1,'2025-10-27 22:09:16','2025-10-27 22:09:16',0,NULL,NULL),(23,27,2,'staff@amber.com','$2a$10$0Pa.LUPsAH3qOdwBVPH3g.ZohLSyMx40P/b2sFsDQdr6clE9prKEa','staff',1,'2025-10-27 22:26:55','2025-10-27 22:26:55',0,NULL,NULL),(24,28,3,'will@will','$2a$10$txNzTNNgBek0MpaT6Bqv8uV1nkWes/rom2eeptH6emjBvtaGQHoWK','staff',1,'2025-10-27 23:56:00','2025-10-27 23:56:00',0,NULL,NULL),(25,29,NULL,'e@e','$2a$10$qW7gkjaHLxFESwx9Kxz/5O4BFbAZgO1ckY6d1kz2USUH0DKoRTkVG','student',1,'2025-10-28 00:08:44','2025-10-28 00:08:44',0,NULL,NULL),(26,30,4,'employee@employee','$2a$10$2d2sXwI5m9.KHDmGzAgdA.S4kr2fU/UwO5qNZimbkjTU4ahuXMbha','staff',1,'2025-10-28 00:09:50','2025-10-28 00:09:50',0,NULL,NULL),(27,31,NULL,'finalnot@test','$2a$10$0sgBanJdT9b1RLgEiUoJee.tnYCSEccGFeHMLExAz0P.JmVNV0mSe','student',1,'2025-10-28 00:39:36','2025-10-28 00:39:36',0,NULL,NULL),(28,32,NULL,'jsmith@example.com','$2a$10$zejSYbzAlnPOAbI.v1ZzE.sBJF772ueq7GHczga1HiRckrVrV3Hx.','student',1,'2025-10-28 00:43:49','2025-10-28 00:43:49',0,NULL,NULL),(29,33,5,'jwilliams@example.com','$2a$10$LyZlvFC.qpRvWtaacUAueO3/DpR0Qmhe/Epc8kEVtyBhyXGsweGCa','staff',1,'2025-10-28 00:47:55','2025-10-28 00:47:55',0,NULL,NULL),(30,34,6,'w@w','$2a$10$StFrQhPuOqqAxqFjfbFK4Oo/fsZwhgFLFWyMqGqTujCpxQBIv.xBS','staff',1,'2025-10-28 00:53:24','2025-10-28 00:53:24',0,NULL,NULL),(31,35,7,'libarry@example.com','$2a$10$E0wM6TYi/.0Po7yeQMQW5ehE8hQcoRj21ebX1aaeExRsIW7GbpNBW','staff',1,'2025-10-28 01:17:22','2025-10-28 01:17:22',0,NULL,NULL),(32,36,8,'adminmatt@admin.net','$2a$10$HpH5KwAjD7h7t5Mkxbn3WeUVmjD9dAp0L3DZdIx8RiMVhkvJRTKxG','staff',1,'2025-10-28 02:47:10','2025-10-28 02:47:10',0,NULL,NULL),(33,37,NULL,'ngota0330@yahoo.com','$2a$10$ZaUUSEPjGOkAl9tM.IG1K.aQn6RY2L5GX/4aS/smHacRu29dw7B7C','student',1,'2025-10-28 04:21:15','2025-10-28 04:21:15',0,NULL,NULL),(34,38,9,'anoriginalusername42@gmail.com','$2a$10$coGAGn1005A8cfO0RySY4uUnFVoZnuTM21e9SUvPUhMvaB9Mow7We','staff',1,'2025-10-28 16:39:41','2025-10-28 16:39:41',0,NULL,NULL),(35,39,NULL,'josh.3589.me@gmail.com','$2a$10$J5il0TCu5DhRTtlgASete.OiTNn6LupngHX0RQ48/9zyaO9EcpHg6','student',1,'2025-10-28 20:10:58','2025-10-28 20:10:58',0,NULL,NULL),(36,40,NULL,'nikkinguyen730@gmail.com','$2a$10$cssyRVpUsVTHAuKJdSLd7e5JbXZKiAQpapvQB/rp/QHrbW6WHVADu','student',1,'2025-10-28 22:38:44','2025-10-28 22:38:44',0,NULL,NULL),(37,41,10,'staff.cli+20251029132032@example.com','$2a$10$4/hQYNFaPtfwHbcw3vNa6Odad.I77ESirPL4iJTDnChrhUb1SQVFa','staff',1,'2025-10-29 18:20:35','2025-10-29 18:20:35',0,NULL,NULL),(38,42,11,'staff.cli+20251029132048@example.com','$2a$10$YuF7xWaisKJ7p5flgSr6I.EQjehohw9p6eeir9MEJky/lKF.u7/K.','staff',1,'2025-10-29 18:20:49','2025-10-29 18:20:49',0,NULL,NULL),(39,43,NULL,'filzaroche@gmail.com','$2a$10$pll7AYG6QphKv5P34IxTNOVyftB4KdtFL82St2JuE6qaIA3SucVYS','student',1,'2025-10-29 22:12:54','2025-10-29 22:12:54',0,NULL,NULL),(40,44,NULL,'kathiana119@gmail.com','$2a$10$98Gxr5eacsCp1SCnXFd6Iuq5nBWOttx7mC/Fe8eI9r16NpUrkBzy.','student',1,'2025-10-29 22:37:55','2025-10-29 22:37:55',0,NULL,NULL),(41,45,NULL,'kshamama12@gmail.com','$2a$10$uRSPyNVCLc2SZmr7AZ6RROprC4WVgaJFDwcWKyt77ELfUbSLIHTfW','student',1,'2025-11-03 19:39:38','2025-11-03 19:39:38',0,NULL,NULL),(42,46,NULL,'test10@test','$2a$10$3xcXe83GaCvg2RtY3n4HAuJWLJ6GcizNqUb0pF7jnKFBdeNqeoY2W','student',1,'2025-11-05 22:51:45','2025-11-05 22:51:45',0,NULL,NULL),(43,49,NULL,'joshua.m897193@gmail.com','$2a$10$WPC8c1Eud9ooFUaulT7eJ.cFTggnoF9fTukmsAqwS1lO0O9w6z/16','student',1,'2025-11-07 12:45:03','2025-11-07 12:45:03',0,NULL,NULL),(44,50,NULL,'wtest@test','$2a$10$60UbTuvE4iCcdpSd7NHPd.J4TgfJDMwYXhzZFl/ZitqGZw5HnYHJm','student',1,'2025-11-08 06:29:05','2025-11-08 06:29:05',0,NULL,NULL),(45,51,NULL,'testreg@test','$2a$10$KMtLt6BySUDHGM66oIBnH.dA7OmbNynBuFECpbLDtBpLSkZhmYxkm','faculty',1,'2025-11-11 04:46:31','2025-11-11 04:46:31',0,NULL,NULL),(46,52,NULL,'franky@teachuh.edu','$2a$10$zcu61nHM8iJX8CnLNScFJOp5gBErIyDMG47PMGxNz8OU/3wOhTM2S','faculty',1,'2025-11-11 05:09:52','2025-11-11 05:09:52',0,NULL,NULL),(47,53,NULL,'holds@test','$2a$10$pdFaYpYBq6CXsFxRT3MRDe2Zr3l9sZAODeyjr0BIjV1oaAjD7o.aK','student',1,'2025-11-11 06:30:36','2025-11-11 06:30:36',0,NULL,NULL),(48,54,NULL,'brads@gmail.com','$2a$10$WOZgEIa5T3e4oCQ/paixdumXQ55aqW9KS5wyeFnYpzETRKVtcDpdO','student',0,'2025-11-11 18:01:53','2025-11-12 01:51:35',1,'2025-11-11 18:02:15',30),(49,55,NULL,'philteaches@college.edu','$2a$10$31s.uClITcz/aHPtVJk8/eDzlKrNodyUjC8Q/ZLqfXRfF0m/TBb7y','faculty',1,'2025-11-11 22:58:49','2025-11-11 22:58:49',0,NULL,NULL),(50,56,NULL,'pvelasquez@student','$2a$10$d0PrXvdMuhQyW53OfHAtv.yDHuFu52w.Xf4ZTrOt.LSZhEFij9FFW','student',1,'2025-11-12 00:25:06','2025-11-12 00:25:06',0,NULL,NULL),(51,57,NULL,'jsloan@student','$2a$10$ekDsaeAWiNADS8PJNIlF9ut3Ipwo9GO44C29/llQGEOynbEzIW4hW','student',1,'2025-11-12 00:25:40','2025-11-12 00:25:40',0,NULL,NULL),(52,58,NULL,'bglover@student','$2a$10$hui812ksbOUalVPGXTDFbeffQezIoOOAneyg2Z7glpl4g9pyEGVJW','student',1,'2025-11-12 00:26:06','2025-11-12 00:26:06',0,NULL,NULL),(53,59,12,'nbryan@studen','$2a$10$I.fRar7uEeAhcKBuKyCqMeePPnOPEzFL9Sau9YBhpgFHG9nRZf2uS','staff',1,'2025-11-12 00:26:32','2025-11-12 00:26:32',0,NULL,NULL),(54,60,NULL,'rburns@student','$2a$10$2dE5EIrECgxa6J/dg19Ve.iwXADUHCQp/2.XASyj5XXV3g7b4gX9W','student',1,'2025-11-12 00:27:09','2025-11-12 00:27:09',0,NULL,NULL),(55,61,13,'amwa@gmail.com','$2a$10$Q.KUrCs0Z32UctJ40I9BKez0xA9O4S/Bg0HM/D6g7lsp6T85J6zUK','staff',1,'2025-11-12 01:49:10','2025-11-12 01:49:10',0,NULL,NULL);
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `author`
--

LOCK TABLES `author` WRITE;
/*!40000 ALTER TABLE `author` DISABLE KEYS */;
INSERT INTO `author` VALUES (1,'Harper Lee'),(2,'George Orwell'),(3,'F. Scott Fitzgerald'),(4,'Jane Austen'),(5,'J.D. Salinger'),(6,'J.R.R. Tolkien'),(7,'J.K. Rowling'),(8,'Aldous Huxley'),(9,'Ramez Elmasr'),(10,'Shamkant B. Navathe'),(11,'ME'),(12,'James Joyce'),(13,'Mark Twain');
/*!40000 ALTER TABLE `author` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` VALUES (9,'15791678076','JP Pub',2009),(10,'19298384773','Spam Futures',2001),(16,'9712345678943','Jump',1993),(17,'9780000000000','CLI Press',2024),(19,'9780061120084','J. B. Lippincott & Co',1960),(21,'9780743273565','Charles Scribner\'s Sons',1925),(22,'9780141439518','T. Egerton, Whitehall',1813),(23,'9780316769174','Little, Brown and Company',1951),(25,NULL,'Secker & Warburg',1949),(26,'9780452284241','Secker and Warburg',1945),(27,'9780547928227','George Allen & Unwin',1937),(28,'9780590353427','Bloomsbury (UK), Scholastic (US)',1997),(29,'9780544003415','Allen & Unwin',1968),(30,'9780060850524','Chatto & Windus',1932),(31,'9780133970777','Pearson',2015),(32,'123456788','ME',10),(33,'9780679722762','Random House',1933),(36,'9780582035850','Charles L. Webster and Company',1885);
/*!40000 ALTER TABLE `book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `copy`
--

LOCK TABLES `copy` WRITE;
/*!40000 ALTER TABLE `copy` DISABLE KEYS */;
INSERT INTO `copy` VALUES (14,9,'JP-17868390','available','Manga F4','2025-10-28'),(15,9,'JP-17868391','on_loan','Manga F4','2025-10-28'),(16,9,'JP-17868392','on_loan','Manga F4','2025-10-28'),(17,10,'111','available','Clones A','2025-10-28'),(18,10,'222','on_loan','Clones A','2025-10-28'),(19,10,'333','available','Clones A','2025-10-28'),(20,10,'444','available','Clones A','2025-10-28'),(21,10,'555','available','Clones A','2025-10-28'),(22,10,'666','available','Clones A','2025-10-28'),(23,10,'777','available','Clones A','2025-10-28'),(24,10,'888','available','Clones A','2025-10-28'),(25,10,'999','available','Clones A','2025-10-28'),(26,10,'101010','on_loan','Clones A','2025-10-28'),(27,10,'111111','available','Clones A','2025-10-28'),(28,10,'121212','available','Clones A','2025-10-28'),(29,10,'131313','available','Clones A','2025-10-28'),(30,10,'141414','available','Clones A','2025-10-28'),(31,10,'151515','available','Clones A','2025-10-28'),(38,16,'1002','on_loan',NULL,'2025-10-28'),(39,16,'1003','on_loan',NULL,'2025-10-28'),(40,16,'1004','on_loan',NULL,'2025-10-28'),(41,17,'BC-837694','on_loan','A101','2025-10-29'),(43,19,'ABC-001','available','A3','2025-11-05'),(54,19,'BC-MHPW728O-302','available','A3','2025-11-08'),(61,21,'ACC-02365','on_loan','C14','2025-11-08'),(62,21,'BC-MHPXFHDB-533','on_loan','C14','2025-11-08'),(63,21,'BC-MHPXFHFS-606','available','C14','2025-11-08'),(64,21,'BC-MHPXFHIB-710','available','C14','2025-11-08'),(65,21,'BC-MHPXFHKV-183','available','C14','2025-11-08'),(66,21,'BC-MHPXFHND-942','available','C14','2025-11-08'),(67,21,'BC-MHPXFHPW-750','available','C14','2025-11-08'),(68,22,'JAS-96587','on_loan','D12','2025-11-08'),(69,22,'BC-MHPYEIRO-580','available','D12','2025-11-08'),(70,22,'BC-MHPYEJ5G-194','on_loan','D12','2025-11-08'),(71,22,'BC-MHPYEJ81-918','available','D12','2025-11-08'),(72,22,'BC-MHPYEJAJ-104','available','D12','2025-11-08'),(73,22,'BC-MHPYEJD0-479','available','D12','2025-11-08'),(74,22,'BC-MHPYEJFK-993','available','D12','2025-11-08'),(75,22,'BC-MHPYEJI3-324','available','D12','2025-11-08'),(76,22,'BC-MHPYEJKM-543','available','D12','2025-11-08'),(77,22,'BC-MHPYEJN5-314','available','D12','2025-11-08'),(78,23,'SEC-104','on_loan','E22','2025-11-08'),(79,23,'BC-MHPYX7WZ-435','available','E22','2025-11-08'),(80,23,'BC-MHPYX7ZC-325','available','E22','2025-11-08'),(81,23,'BC-MHPYX81N-208','available','E22','2025-11-08'),(82,23,'BC-MHPYX841-929','available','E22','2025-11-08'),(83,24,'11111100','on_loan','DVD Shelf','2025-11-08'),(84,24,'111111110','on_loan','DVD Shelf','2025-11-08'),(85,25,'ZDP-22365','on_loan','A1','2025-11-08'),(86,25,'BC-MHPZZR3Q-771','available','A1','2025-11-08'),(87,25,'BC-MHPZZR61-168','on_loan','A1','2025-11-08'),(88,25,'BC-MHPZZR8H-109','available','A1','2025-11-08'),(89,25,'BC-MHPZZRAT-192','available','A1','2025-11-08'),(90,25,'BC-MHPZZRD4-903','available','A1','2025-11-08'),(91,26,'AF-15987','available','K9','2025-11-09'),(92,26,'BC-MHR52BUZ-417','on_loan','K9','2025-11-09'),(93,26,'BC-MHR52BY9-250','available','K9','2025-11-09'),(94,26,'BC-MHR52C0T-806','available','K9','2025-11-09'),(95,26,'BC-MHR52C3D-591','available','K9','2025-11-09'),(96,27,'HB-7319','on_loan','HB32','2025-11-09'),(97,27,'BC-MHR6OQDY-250','on_loan','HB32','2025-11-09'),(98,27,'BC-MHR6OQGU-665','available','HB32','2025-11-09'),(99,27,'BC-MHR6OQJC-229','available','HB32','2025-11-09'),(100,27,'BC-MHR6OQLU-456','available','HB32','2025-11-09'),(101,27,'BC-MHR6OQOE-471','available','HB32','2025-11-09'),(102,28,'HR-11225','on_loan','B5','2025-11-09'),(103,28,'BC-MHR6SWSM-637','on_loan','B5','2025-11-09'),(104,28,'BC-MHR6SWV6-901','available','B5','2025-11-09'),(105,28,'BC-MHR6SWY0-415','on_loan','B5','2025-11-09'),(106,28,'BC-MHR6SX0M-101','on_loan','B5','2025-11-09'),(107,28,'BC-MHR6SX38-238','available','B5','2025-11-09'),(108,28,'BC-MHR6SX5Q-715','available','B5','2025-11-09'),(109,28,'BC-MHR6SX8D-596','available','B5','2025-11-09'),(110,28,'BC-MHR6SXAT-743','available','B5','2025-11-09'),(111,28,'BC-MHR6SXDE-973','available','B5','2025-11-09'),(112,28,'BC-MHR6SXFZ-542','available','B5','2025-11-09'),(113,28,'BC-MHR6SXIJ-687','available','B5','2025-11-09'),(114,29,'LOTR-2025','on_loan','A20','2025-11-09'),(115,29,'BC-MHR6Y7UJ-598','on_loan','A20','2025-11-09'),(116,29,'BC-MHR6Y7X5-341','available','A20','2025-11-09'),(117,29,'BC-MHR6Y7ZO-294','available','A20','2025-11-09'),(118,29,'BC-MHR6Y82B-938','available','A20','2025-11-09'),(119,30,'BNW-5102','on_loan','C6','2025-11-09'),(120,30,'BC-MHR72YAK-860','on_loan','C6','2025-11-09'),(121,30,'BC-MHR72YD4-825','on_loan','C6','2025-11-09'),(122,31,'DBS-2025','on_loan','P23','2025-11-09'),(123,31,'BC-MHR7AZJR-544','on_loan','P23','2025-11-09'),(124,32,'BC-MHVCJRQI-424','available','G4','2025-11-11'),(125,33,'BC-MHVKGL0W-523','available','Shelf G8','2025-11-11'),(126,33,'BC-MHVKGL3R-399','available','Shelf G8','2025-11-11'),(127,33,'BC-MHVKGL5G-803','available','Shelf G8','2025-11-11'),(128,34,'BC-MHVKH42R-287','available','DVD Shelf','2025-11-11'),(129,34,'BC-MHVKH47O-554','available','DVD Shelf','2025-11-11'),(130,34,'BC-MHVKH4AC-591','available','DVD Shelf','2025-11-11'),(131,34,'BC-MHVKH4D2-373','available','DVD Shelf','2025-11-11'),(132,34,'BC-MHVKH4FP-730','available','DVD Shelf','2025-11-11'),(133,35,'BC-MHVKX9G4-641','available','DVD Shelf','2025-11-11'),(134,35,'BC-MHVKX9KV-892','available','DVD Shelf','2025-11-11'),(135,35,'BC-MHVKX9NI-532','available','DVD Shelf','2025-11-11'),(136,35,'BC-MHVKX9Q5-755','available','DVD Shelf','2025-11-11'),(137,36,'BC-MHVKZRXA-547','available','Shelf C7','2025-11-11'),(138,36,'BC-MHVKZS18-817','available','Shelf C7','2025-11-11'),(139,36,'BC-MHVKZS3F-994','available','Shelf C7','2025-11-11'),(140,37,'BC-MHVL6TD6-341','available','DVD Shelf','2025-11-11'),(141,37,'BC-MHVL6THT-950','available','DVD Shelf','2025-11-11'),(142,37,'BC-MHVL6TKA-768','available','DVD Shelf','2025-11-11'),(143,38,'BC-MHVLB2CV-535','available','DVD Shelf','2025-11-11'),(144,38,'BC-MHVLB2EU-878','available','DVD Shelf','2025-11-11'),(145,39,'BC-MHVLD5UD-405','available','DVD Shelf','2025-11-12'),(146,39,'BC-MHVLD5WS-536','available','DVD Shelf','2025-11-12'),(147,39,'BC-MHVLD5Z6-839','available','DVD Shelf','2025-11-12');
/*!40000 ALTER TABLE `copy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `device`
--

LOCK TABLES `device` WRITE;
/*!40000 ALTER TABLE `device` DISABLE KEYS */;
/*!40000 ALTER TABLE `device` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
INSERT INTO `employee` VALUES (1,'Jalenn','Brunsonn','assistant','2025-10-27'),(2,'Staff','Amber','assistant','2025-10-27'),(3,'Koa','Peat','assistant','2025-10-27'),(4,'Kevin','Garnett','assistant','2025-10-28'),(5,'Jesse','Williams','assistant','2025-10-28'),(6,'Michael','Jordan','admin','2025-10-28'),(7,'Barry','Li','assistant','2025-10-28'),(8,'Aaron','Holiday','assistant','2025-10-28'),(9,'Lu','Dort','assistant','2025-10-28'),(10,'Dylan','Harper','assistant','2025-10-29'),(11,'Domantis','Sabonis','assistant','2025-10-29'),(12,'Noah','Bryan','assistant','2025-11-12'),(13,'Amanda','Waller','librarian','2025-11-12');
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `fine`
--

LOCK TABLES `fine` WRITE;
/*!40000 ALTER TABLE `fine` DISABLE KEYS */;
INSERT INTO `fine` VALUES (4,12,2,NULL,'2025-11-08 06:19:13','overdue',5.00,'open','Test overdue fine'),(5,10,15,NULL,'2025-11-09 08:02:36','overdue',5.00,'open',NULL),(6,8,7,NULL,'2025-11-11 01:56:01','overdue',1.25,'open',NULL),(7,70,57,NULL,'2025-11-12 01:24:21','overdue',10.00,'open',NULL),(8,71,58,NULL,'2025-11-12 01:24:21','overdue',6.25,'open',NULL),(9,72,60,NULL,'2025-11-12 01:24:21','overdue',5.00,'open',NULL),(10,73,56,NULL,'2025-11-12 01:24:21','overdue',1.25,'open',NULL),(11,74,50,NULL,'2025-11-12 01:24:21','overdue',20.00,'open',NULL);
/*!40000 ALTER TABLE `fine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `fine_payment`
--

LOCK TABLES `fine_payment` WRITE;
/*!40000 ALTER TABLE `fine_payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `fine_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `hold`
--

LOCK TABLES `hold` WRITE;
/*!40000 ALTER TABLE `hold` DISABLE KEYS */;
INSERT INTO `hold` VALUES (1,51,17,NULL,'queued',1,NULL,NULL,'2025-11-11 09:02:44','2025-11-11 09:02:44'),(2,51,24,NULL,'queued',1,NULL,NULL,'2025-11-11 09:04:44','2025-11-11 09:04:44'),(3,53,16,NULL,'queued',1,NULL,NULL,'2025-11-11 09:29:55','2025-11-11 09:29:55'),(4,51,16,NULL,'cancelled',2,NULL,NULL,'2025-11-11 09:32:57','2025-11-11 09:33:16'),(5,15,16,NULL,'queued',3,NULL,NULL,'2025-11-11 17:00:08','2025-11-11 17:00:08'),(6,15,19,NULL,'queued',1,NULL,NULL,'2025-11-11 21:28:24','2025-11-11 21:28:24');
/*!40000 ALTER TABLE `hold` ENABLE KEYS */;
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
/*!50003 CREATE*/ /*!50017 DEFINER=`db2root`@`%`*/ /*!50003 TRIGGER `trg_hold_state_bi` BEFORE INSERT ON `hold` FOR EACH ROW BEGIN
  IF NEW.status IN ('ready', 'fulfilled') AND NEW.copy_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Ready/fulfilled holds must reference a copy.';
  END IF;

  IF NEW.status = 'queued' AND NEW.copy_id IS NOT NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Queued holds cannot pre-assign a copy.';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`db2root`@`%`*/ /*!50003 TRIGGER `trg_hold_state_bu` BEFORE UPDATE ON `hold` FOR EACH ROW BEGIN
  IF NEW.status IN ('ready', 'fulfilled') AND NEW.copy_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Ready/fulfilled holds must reference a copy.';
  END IF;

  IF NEW.status = 'queued' AND NEW.copy_id IS NOT NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Queued holds cannot pre-assign a copy.';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Dumping data for table `item`
--

LOCK TABLES `item` WRITE;
/*!40000 ALTER TABLE `item` DISABLE KEYS */;
INSERT INTO `item` VALUES (9,'Filler Manga Volume 1','Manga',NULL,NULL,NULL),(10,'Cloning Books The Easy Way','Informational','193746839',NULL,NULL),(16,'Filler Manga V6','Manga',NULL,NULL,NULL),(17,'Test Book via CLI',NULL,NULL,NULL,NULL),(19,'To Kill a MockingBird','Classic Literature',NULL,'A gripping tale of racial injustice and childhood innocence in the American South. Scout Finch narrates her father\'s courageous defense of a Black man falsely accused of assault.','https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.thoughtco.com%2Fthmb%2FFSv1bHGN-k3uDFYQBROfobilKWM%3D%2F768x0%2Ffilters%3Ano_upscale()%3Amax_bytes(150000)%3Astrip_icc()%2F9780061120084_tokill-56a15c433df78cf7726a0f32.jpg&f=1&nofb=1&ipt=a2c4da0d6a014b918dd3c8786c2257d9fc9ecafac5abc3be8b74e4c8fdeb644a'),(21,'The Great Gatsby','Classic Literature',NULL,'A portrait of the Jazz Age in all its decadence and excess. Jay Gatsby\'s obsessive quest for his lost love Daisy Buchanan reveals the corruption beneath the American Dream.','https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.pinimg.com%2Foriginals%2F9d%2F96%2F51%2F9d96519c8703e96a89127ae0e59a1087.jpg&f=1&nofb=1&ipt=f2db984432bd047188cda6de8b33ff38fe3e8b982bb9901dac6d66dfacc00ea3'),(22,'Pride and Prejudice','Romance',NULL,'The classic romance that explores love, class, and personal growth in Regency England. Elizabeth Bennet must overcome her pride while Mr. Darcy confronts his prejudice.','https://images.penguinrandomhouse.com/cover/9780141439518'),(23,'The Catcher in the Rye','Coming of Age',NULL,'Holden Caulfield\'s odyssey through New York City after being expelled from prep school. A raw and honest portrayal of teenage angst, alienation, and the search for authenticity.',NULL),(24,'Planet Earth','Nature, Documentary',NULL,'A documentary series on the wildlife found on Earth. Each episode covers a different habitat: deserts, mountains, deep oceans, shallow seas, forests, caves, polar regions, fresh water, plains and jungles. Narrated by David Attenborough.','https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ffontmeme.com%2Fimages%2FPlanet-Earth-TV-Series.jpg&f=1&nofb=1&ipt=321aefbae7f5bb3db7370943760bf335013a38f819872d2b7b31d2693f2ad831'),(25,'1984','Dystopian Fiction',NULL,'George Orwell\'s chilling prophecy about the future. In a totalitarian regime where Big Brother watches everything, Winston Smith struggles to maintain his humanity and independent thought.','https://images.penguinrandomhouse.com/cover/9780452284234'),(26,'Animal Farm','Political Satire',NULL,'A brilliant satire of totalitarianism where farm animals rebel against their human farmer. This allegorical novella reveals how power corrupts and revolutionaries become oppressors.',NULL),(27,'The Hobbit','Fantasy',NULL,'Bilbo Baggins\' unexpected journey from his comfortable hobbit-hole to the Lonely Mountain. A classic adventure tale filled with dragons, dwarves, and the discovery of courage.','https://images.penguinrandomhouse.com/cover/9780547928227'),(28,'Harry Potter and the Sorcerer\'s Stone','Fantasy',NULL,'The Boy Who Lived begins his magical education at Hogwarts. Harry Potter discovers his true heritage and faces the dark wizard who killed his parents in this beloved fantasy adventure.','https://images.penguinrandomhouse.com/cover/9780590353427'),(29,'The Lord of the Rings','Fantasy',NULL,'The epic quest to destroy the One Ring and defeat the Dark Lord Sauron. Frodo and the Fellowship journey through Middle-earth in this masterwork of fantasy literature.','https://images.penguinrandomhouse.com/cover/9780544003415'),(30,'Brave New World','Dystopian Fiction',NULL,'A disturbing vision of a future where humans are genetically engineered and conditioned for a rigid caste system. Huxley explores the cost of stability and the loss of individuality.','https://images.penguinrandomhouse.com/cover/9780060850524'),(31,'Fundamentals of Database Systems 7th Edition','Computer Science',NULL,'This book introduces the fundamental concepts necessary for designing, using, and implementing database systems and database applications. Our presentation stresses the fundamentals of database modeling and design, the languages and models provided by the database management systems, and database system implementation techniques.\n\n\nThe book is meant to be used as a textbook for a one- or two-semester course in database systems at the junior, senior, or graduate level, and as a reference book. The goal is to provide an in-depth and up-to-date presentation of the most important aspects of database systems and applications, and related technologies. It is assumed that readers are familiar with elementary programming and data-structuring concepts and that they have had some exposure to the basics of computer organization.','https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcampustextbooks.org%2Fwp-content%2Fuploads%2F2023%2F02%2FDownload-eBook-PDF-Fundamentals-of-Database-Systems-7th-edition-By-Ramez-Elmasri-Shamkant-B.jpeg&f=1&nofb=1&ipt=8dca3f885bc4e18ef53bc767d76021adc359089c0fca1f0bda1de437007e0c09'),(32,'Rockets','Romance',NULL,'A cool romance novel','https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F7%2F79%2FSemyorka_Rocket_R7_by_Sergei_Korolyov_in_VDNH_Ostankino_RAF0540.jpg%2F517px-Semyorka_Rocket_R7_by_Sergei_Korolyov_in_VDNH_Ostankino_RAF0540.jpg&f=1&nofb=1&ipt=d6ef58b24e64f4d9bc366f8ce60c838fa1f3cb94c9ebc756e44e199db6ff5e83'),(33,'Ulysses','Modernist',NULL,NULL,NULL),(34,'Interstellar','Sci-Fi',NULL,'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.','https://www.originalfilmart.com/cdn/shop/products/interstellar_2014_advance_original_film_art_682852f2-23f6-46de-a1db-4029d5b6f0b4_5000x.jpg?v=1574284010'),(35,'Breaking Bad','Crime, Drama, Thriller',NULL,'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student to secure his family\'s future.','https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Frotativo.com.mx%2Fuploads%2Fs1%2F41%2F31%2F18%2F4%2Fa-e-keyart-breakingbadspecial.jpeg&f=1&nofb=1&ipt=144906101695e434df85f601426bbbff019ecf7b5620368b8b5dad39ad52abd8'),(36,'Adventures of Huckleberry Finn','Adventure',NULL,'The Adventures of Huckleberry Finn is a classic novel by Mark Twain that follows a boy\'s journey down the Mississippi River with an escaped slave named Jim. The story explores themes of freedom, friendship, and morality through humorous and satirical episodes that also expose the cruelty and injustice of pre-Civil War society',NULL),(37,'Zack Snyder\'s Justice League','Action, Sci-Fi, DC',NULL,'Determined to ensure that Superman\'s ultimate sacrifice wasn\'t in vain, Bruce Wayne recruits a team of metahumans to protect the world from an approaching threat of catastrophic proportions.','https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwallpapercave.com%2Fwp%2Fwp8735396.jpg&f=1&nofb=1&ipt=e12a80b2e1ec54a852cd0a08a287dd0871bffbdc63853211a43d8c3df1c3464f'),(38,'Scary Movie','Comedy',NULL,'A year after disposing of the body of a man they accidentally killed, a group of dumb teenagers are stalked by a bumbling serial killer.','https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fassets-prd.ignimgs.com%2F2024%2F04%2F12%2Fscary-movie-button-1712945602661.jpg&f=1&nofb=1&ipt=74af2a89d46edbe13f27dfe1c9334a8705c77d44cccdc11c4f157bda6e7c8d49'),(39,'Wicked','Fantasy, Musical',NULL,'Elphaba, a young woman ridiculed for her green skin, and Galinda, a popular girl, become friends at Shiz University in the Land of Oz. After an encounter with the Wonderful Wizard of Oz, their friendship reaches a crossroads.','https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fm.media-amazon.com%2Fimages%2FM%2FMV5BN2Q4Yjk0YTQtZjYyMC00YTczLWFhZDktOWQyYzRlYzgwMWM1XkEyXkFqcGc%40._V1_.jpg&f=1&nofb=1&ipt=56c149b2cc78c65ff0739aa3a564a3af794587a9dbda70ca9453a4caccd602c0');
/*!40000 ALTER TABLE `item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `item_author`
--

LOCK TABLES `item_author` WRITE;
/*!40000 ALTER TABLE `item_author` DISABLE KEYS */;
INSERT INTO `item_author` VALUES (19,1),(25,2),(26,2),(21,3),(22,4),(23,5),(27,6),(29,6),(28,7),(30,8),(31,9),(31,10),(32,11),(33,12),(36,13);
/*!40000 ALTER TABLE `item_author` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `item_tag_link`
--

LOCK TABLES `item_tag_link` WRITE;
/*!40000 ALTER TABLE `item_tag_link` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_tag_link` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `library_card`
--

LOCK TABLES `library_card` WRITE;
/*!40000 ALTER TABLE `library_card` DISABLE KEYS */;
/*!40000 ALTER TABLE `library_card` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `loan`
--

LOCK TABLES `loan` WRITE;
/*!40000 ALTER TABLE `loan` DISABLE KEYS */;
INSERT INTO `loan` VALUES (6,33,17,6,'2025-10-28 01:38:22','2025-11-10','2025-11-06 23:36:31','returned',0,NULL,NULL,NULL,NULL),(8,7,26,6,'2025-10-28 01:57:53','2025-11-10',NULL,'active',0,NULL,NULL,NULL,NULL),(9,15,18,NULL,'2025-11-06 18:52:16','2025-11-20',NULL,'active',0,NULL,NULL,NULL,NULL),(10,15,14,NULL,'2025-11-06 19:35:05','2025-11-05','2025-11-10 23:09:13','returned',0,NULL,NULL,NULL,NULL),(11,2,15,NULL,'2025-11-06 20:16:49','2025-11-20','2025-11-06 21:06:01','returned',0,NULL,NULL,NULL,NULL),(12,15,15,NULL,'2025-11-06 22:35:59','2025-11-20',NULL,'active',0,NULL,NULL,NULL,NULL),(13,32,43,NULL,'2025-11-06 22:36:46','2025-11-20','2025-11-11 05:51:49','returned',0,NULL,NULL,NULL,NULL),(14,2,17,NULL,'2025-11-07 17:37:45','2025-11-21','2025-11-12 01:43:21','returned',0,NULL,NULL,NULL,NULL),(15,40,83,6,'2025-11-08 07:52:57','2025-11-22','2025-11-08 07:54:22','returned',0,NULL,NULL,NULL,NULL),(16,40,84,6,'2025-11-08 07:53:05','2025-11-22',NULL,'active',0,NULL,NULL,NULL,NULL),(17,2,85,NULL,'2025-11-08 08:12:50','2025-11-22','2025-11-11 17:01:02','returned',0,NULL,NULL,NULL,NULL),(18,37,68,NULL,'2025-11-08 13:41:14','2025-11-22',NULL,'active',0,NULL,NULL,NULL,NULL),(19,15,16,NULL,'2025-11-08 17:49:35','2025-11-22',NULL,'active',0,NULL,NULL,NULL,NULL),(20,37,61,NULL,'2025-11-08 22:01:38','2025-11-22',NULL,'active',0,NULL,NULL,NULL,NULL),(21,15,62,NULL,'2025-11-10 20:51:18','2025-11-24','2025-11-11 22:44:59','returned',0,NULL,NULL,NULL,NULL),(22,2,122,NULL,'2025-11-11 03:59:23','2025-11-24','2025-11-11 21:58:20','returned',0,NULL,NULL,NULL,NULL),(23,2,119,NULL,'2025-11-11 03:59:32','2025-11-24','2025-11-11 16:58:29','returned',0,NULL,NULL,NULL,NULL),(24,2,114,NULL,'2025-11-11 03:59:38','2025-11-24','2025-11-11 17:19:41','returned',0,NULL,NULL,NULL,NULL),(25,52,102,NULL,'2025-11-11 05:10:42','2025-12-01','2025-11-11 05:14:36','returned',0,NULL,NULL,NULL,NULL),(26,52,96,NULL,'2025-11-11 05:10:50','2025-12-01','2025-11-11 05:14:55','returned',0,NULL,NULL,NULL,NULL),(27,52,78,NULL,'2025-11-11 05:10:55','2025-12-01','2025-11-11 18:25:01','returned',0,NULL,NULL,NULL,NULL),(28,52,69,NULL,'2025-11-11 05:11:02','2025-12-01','2025-11-11 22:46:49','returned',0,NULL,NULL,NULL,NULL),(29,52,70,NULL,'2025-11-11 05:11:12','2025-12-01',NULL,'active',0,NULL,NULL,NULL,NULL),(30,52,86,NULL,'2025-11-11 05:11:18','2025-12-01','2025-11-11 22:49:40','returned',0,NULL,NULL,NULL,NULL),(31,52,63,NULL,'2025-11-11 05:11:23','2025-12-01','2025-11-11 17:19:00','returned',0,NULL,NULL,NULL,NULL),(32,32,43,6,'2025-11-11 05:53:03','2025-11-24','2025-11-11 16:49:52','returned',0,NULL,NULL,NULL,NULL),(33,51,83,NULL,'2025-11-11 06:28:03','2025-12-02',NULL,'active',0,NULL,NULL,NULL,NULL),(34,53,41,NULL,'2025-11-11 06:42:33','2025-11-25',NULL,'active',0,NULL,NULL,NULL,NULL),(35,53,38,NULL,'2025-11-11 06:42:45','2025-11-25',NULL,'active',0,NULL,NULL,NULL,NULL),(36,53,39,NULL,'2025-11-11 09:29:34','2025-11-25',NULL,'active',0,NULL,NULL,NULL,NULL),(37,53,40,NULL,'2025-11-11 09:29:46','2025-11-25',NULL,'active',0,NULL,NULL,NULL,NULL),(38,37,120,NULL,'2025-11-11 17:52:28','2025-11-25',NULL,'active',0,NULL,NULL,NULL,NULL),(39,37,115,NULL,'2025-11-11 20:01:00','2025-11-25','2025-11-11 20:08:19','returned',0,NULL,NULL,NULL,NULL),(40,37,54,NULL,'2025-11-11 21:28:18','2025-11-25','2025-11-11 22:07:46','returned',0,NULL,NULL,NULL,NULL),(41,15,14,2,'2025-11-11 21:41:08','2025-11-25','2025-11-11 21:47:20','returned',0,NULL,NULL,NULL,NULL),(42,21,123,2,'2025-11-11 21:43:20','2025-11-25','2025-11-11 21:48:52','returned',0,NULL,NULL,NULL,NULL),(43,21,78,2,'2025-11-11 21:45:37','2025-11-25','2025-11-11 21:48:56','returned',0,NULL,NULL,NULL,NULL),(44,39,87,6,'2025-11-11 22:02:26','2025-11-25',NULL,'active',0,NULL,NULL,NULL,NULL),(45,32,122,NULL,'2025-11-11 22:25:45','2025-11-25','2025-11-11 23:19:24','returned',0,NULL,NULL,NULL,NULL),(46,32,43,NULL,'2025-11-11 23:10:20','2025-11-25','2025-11-11 23:30:40','returned',0,NULL,NULL,NULL,NULL),(47,32,123,NULL,'2025-11-11 23:17:24','2025-11-25','2025-11-11 23:30:36','returned',0,NULL,NULL,NULL,NULL),(48,32,85,NULL,'2025-11-11 23:18:42','2025-11-25','2025-11-11 23:30:31','returned',0,NULL,NULL,NULL,NULL),(49,2,102,NULL,'2025-11-11 23:42:59','2025-11-25','2025-11-11 22:51:12','returned',0,NULL,NULL,NULL,NULL),(50,32,43,NULL,'2025-11-11 17:44:30','2025-11-25','2025-11-11 17:56:35','returned',0,NULL,NULL,NULL,NULL),(51,32,122,NULL,'2025-11-11 17:54:33','2025-11-25',NULL,'active',0,NULL,NULL,NULL,NULL),(52,32,119,NULL,'2025-11-11 17:54:38','2025-11-25',NULL,'active',0,NULL,NULL,NULL,NULL),(53,32,114,NULL,'2025-11-11 17:54:42','2025-11-25',NULL,'active',0,NULL,NULL,NULL,NULL),(54,32,103,NULL,'2025-11-11 17:54:45','2025-11-25',NULL,'active',0,NULL,NULL,NULL,NULL),(55,32,97,7,'2025-11-11 17:56:50','2025-11-25',NULL,'active',0,NULL,NULL,NULL,NULL),(56,52,121,NULL,'2025-11-11 22:31:54','2025-12-02',NULL,'pending',0,NULL,NULL,NULL,NULL),(57,2,104,NULL,'2025-11-11 22:36:54','2025-11-25','2025-11-12 01:43:27','returned',0,NULL,NULL,NULL,NULL),(58,2,105,NULL,'2025-11-11 22:43:23','2025-11-25',NULL,'pending',0,NULL,NULL,NULL,NULL),(59,52,85,NULL,'2025-11-11 22:46:23','2025-12-02',NULL,'active',0,NULL,NULL,NULL,NULL),(60,2,91,NULL,'2025-11-11 22:48:31','2025-11-25','2025-11-12 01:43:32','returned',0,NULL,NULL,NULL,NULL),(61,52,123,NULL,'2025-11-11 22:48:41','2025-12-02',NULL,'pending',0,NULL,NULL,NULL,NULL),(62,52,115,NULL,'2025-11-11 22:49:01','2025-12-02',NULL,'active',0,NULL,NULL,NULL,NULL),(63,52,62,NULL,'2025-11-11 22:49:13','2025-12-02',NULL,'pending',0,NULL,NULL,NULL,NULL),(64,52,92,NULL,'2025-11-11 22:53:09','2025-12-02',NULL,'active',0,NULL,NULL,NULL,NULL),(65,55,102,NULL,'2025-11-11 22:59:38','2025-12-02',NULL,'pending',0,NULL,NULL,NULL,NULL),(66,55,106,NULL,'2025-11-11 22:59:55','2025-12-02',NULL,'pending',0,NULL,NULL,NULL,NULL),(67,55,96,NULL,'2025-11-11 23:00:15','2025-12-02',NULL,'pending',0,NULL,NULL,NULL,NULL),(68,55,78,NULL,'2025-11-11 23:00:50','2025-12-02',NULL,'pending',0,NULL,NULL,NULL,NULL),(69,55,98,NULL,'2025-11-11 23:01:00','2025-12-02','2025-11-12 02:04:34','returned',0,NULL,NULL,NULL,NULL),(70,57,137,7,'2025-10-20 14:30:00','2025-11-01',NULL,'active',0,NULL,NULL,NULL,NULL),(71,58,138,8,'2025-10-25 10:15:00','2025-11-04',NULL,'active',1,NULL,NULL,NULL,NULL),(72,60,140,9,'2025-10-27 09:00:00','2025-11-05',NULL,'active',2,NULL,NULL,NULL,NULL),(73,56,144,10,'2025-10-30 16:45:00','2025-11-08',NULL,'active',0,NULL,NULL,NULL,NULL),(74,50,147,7,'2025-10-10 11:20:00','2025-10-24',NULL,'active',1,NULL,NULL,NULL,NULL),(75,2,133,NULL,'2025-11-12 01:36:11','2025-11-26',NULL,'pending',0,NULL,NULL,NULL,NULL),(76,2,145,NULL,'2025-11-12 01:44:15','2025-11-26',NULL,'pending',0,NULL,NULL,NULL,NULL),(77,2,143,NULL,'2025-11-12 01:44:18','2025-11-26',NULL,'pending',0,NULL,NULL,NULL,NULL),(78,2,140,NULL,'2025-11-12 01:44:22','2025-11-26',NULL,'pending',0,NULL,NULL,NULL,NULL),(79,55,99,NULL,'2025-11-12 02:03:24','2025-12-03',NULL,'pending',0,NULL,NULL,NULL,NULL),(80,55,125,NULL,'2025-11-12 02:05:40','2025-12-03',NULL,'pending',0,NULL,NULL,NULL,NULL),(81,55,125,NULL,'2025-11-12 02:06:01','2025-12-03',NULL,'pending',0,NULL,NULL,NULL,NULL),(82,46,125,NULL,'2025-11-12 02:16:30','2025-11-26',NULL,'pending',0,NULL,NULL,NULL,NULL),(83,46,128,NULL,'2025-11-12 02:16:38','2025-11-26',NULL,'pending',0,NULL,NULL,NULL,NULL),(84,46,133,NULL,'2025-11-12 02:16:44','2025-11-26',NULL,'pending',0,NULL,NULL,NULL,NULL),(85,46,137,NULL,'2025-11-12 02:16:47','2025-11-26',NULL,'pending',0,NULL,NULL,NULL,NULL),(86,46,140,NULL,'2025-11-12 02:16:51','2025-11-26',NULL,'pending',0,NULL,NULL,NULL,NULL);
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
/*!50003 CREATE*/ /*!50017 DEFINER=`db2root`@`%`*/ /*!50003 TRIGGER `loan_limit` BEFORE INSERT ON `loan` FOR EACH ROW BEGIN
    DECLARE loan_lim INT;
    DECLARE loan_count INT;
    DECLARE user_role ENUM('student','faculty','staff','admin');
    SELECT COUNT(*) INTO loan_count FROM loan WHERE user_id = NEW.user_id and (status = 'active' or status = 'pending');
    SELECT role INTO user_role FROM account WHERE user_id = NEW.user_id;
    SET loan_lim = CASE user_role
        WHEN 'student' THEN 5
        WHEN 'faculty' THEN 7
        ELSE 0
    END;
    IF loan_lim = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Failed to add new loan: Only students and faculty can be assigned as borrowers';
    ELSEIF loan_count > loan_lim THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Failed to add new loan: User loan limit exceeded';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`db2root`@`%`*/ /*!50003 TRIGGER `loan_insert_log` AFTER INSERT ON `loan` FOR EACH ROW BEGIN
   INSERT INTO loan_events (loan_id, user_id, copy_id, employee_id, type, event_date)
   VALUES (NEW.loan_id, NEW.user_id, NEW.copy_id, NEW.employee_id, NEW.status, NOW());
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`db2root`@`%`*/ /*!50003 TRIGGER `loan_status_change` AFTER UPDATE ON `loan` FOR EACH ROW BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO loan_events (loan_id, user_id, copy_id, employee_id, type, event_date)
    VALUES (NEW.loan_id, NEW.user_id, NEW.copy_id, NEW.employee_id, NEW.status, NOW());
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Dumping data for table `loan_events`
--

LOCK TABLES `loan_events` WRITE;
/*!40000 ALTER TABLE `loan_events` DISABLE KEYS */;
INSERT INTO `loan_events` VALUES (1,78,2,140,NULL,'checkout','2025-11-12 01:44:22'),(2,77,2,143,NULL,'checkout','2025-11-12 01:44:18'),(3,76,2,145,NULL,'checkout','2025-11-12 01:44:15'),(4,60,2,91,NULL,'return','2025-11-12 01:43:32'),(5,57,2,104,NULL,'return','2025-11-12 01:43:27'),(6,14,2,17,NULL,'return','2025-11-12 01:43:21'),(7,75,2,133,NULL,'checkout','2025-11-12 01:36:11'),(8,49,2,102,NULL,'checkout','2025-11-11 23:42:59'),(9,46,32,43,NULL,'return','2025-11-11 23:30:40'),(10,47,32,123,NULL,'return','2025-11-11 23:30:36'),(11,48,32,85,NULL,'return','2025-11-11 23:30:31'),(12,45,32,122,NULL,'return','2025-11-11 23:19:24'),(13,48,32,85,NULL,'checkout','2025-11-11 23:18:42'),(14,47,32,123,NULL,'checkout','2025-11-11 23:17:24'),(15,46,32,43,NULL,'checkout','2025-11-11 23:10:20'),(16,69,55,98,NULL,'checkout','2025-11-11 23:01:00'),(17,68,55,78,NULL,'checkout','2025-11-11 23:00:50'),(18,67,55,96,NULL,'checkout','2025-11-11 23:00:15'),(19,66,55,106,NULL,'checkout','2025-11-11 22:59:55'),(20,65,55,102,NULL,'checkout','2025-11-11 22:59:38'),(21,64,52,92,NULL,'checkout','2025-11-11 22:53:09'),(22,49,2,102,NULL,'return','2025-11-11 22:51:12'),(23,30,52,86,NULL,'return','2025-11-11 22:49:40'),(24,63,52,62,NULL,'checkout','2025-11-11 22:49:13'),(25,62,52,115,NULL,'checkout','2025-11-11 22:49:01'),(26,61,52,123,NULL,'checkout','2025-11-11 22:48:41'),(27,60,2,91,NULL,'checkout','2025-11-11 22:48:31'),(28,28,52,69,NULL,'return','2025-11-11 22:46:49'),(29,59,52,85,NULL,'checkout','2025-11-11 22:46:23'),(30,21,15,62,NULL,'return','2025-11-11 22:44:59'),(31,58,2,105,NULL,'checkout','2025-11-11 22:43:23'),(32,57,2,104,NULL,'checkout','2025-11-11 22:36:54'),(33,56,52,121,NULL,'checkout','2025-11-11 22:31:54'),(34,45,32,122,NULL,'checkout','2025-11-11 22:25:45'),(35,40,37,54,NULL,'return','2025-11-11 22:07:46'),(36,44,39,87,6,'checkout','2025-11-11 22:02:26'),(37,22,2,122,NULL,'return','2025-11-11 21:58:20'),(38,43,21,78,2,'return','2025-11-11 21:48:56'),(39,42,21,123,2,'return','2025-11-11 21:48:52'),(40,41,15,14,2,'return','2025-11-11 21:47:20'),(41,43,21,78,2,'checkout','2025-11-11 21:45:37'),(42,42,21,123,2,'checkout','2025-11-11 21:43:20'),(43,41,15,14,2,'checkout','2025-11-11 21:41:08'),(44,40,37,54,NULL,'checkout','2025-11-11 21:28:18'),(45,39,37,115,NULL,'return','2025-11-11 20:08:19'),(46,39,37,115,NULL,'checkout','2025-11-11 20:01:00'),(47,27,52,78,NULL,'return','2025-11-11 18:25:01'),(48,55,32,97,7,'checkout','2025-11-11 17:56:50'),(49,50,32,43,NULL,'return','2025-11-11 17:56:35'),(50,54,32,103,NULL,'checkout','2025-11-11 17:54:45'),(51,53,32,114,NULL,'checkout','2025-11-11 17:54:42'),(52,52,32,119,NULL,'checkout','2025-11-11 17:54:38'),(53,51,32,122,NULL,'checkout','2025-11-11 17:54:33'),(54,38,37,120,NULL,'checkout','2025-11-11 17:52:28'),(55,50,32,43,NULL,'checkout','2025-11-11 17:44:30'),(56,24,2,114,NULL,'return','2025-11-11 17:19:41'),(57,31,52,63,NULL,'return','2025-11-11 17:19:00'),(58,17,2,85,NULL,'return','2025-11-11 17:01:02'),(59,23,2,119,NULL,'return','2025-11-11 16:58:29'),(60,32,32,43,6,'return','2025-11-11 16:49:52'),(61,37,53,40,NULL,'checkout','2025-11-11 09:29:46'),(62,36,53,39,NULL,'checkout','2025-11-11 09:29:34'),(63,35,53,38,NULL,'checkout','2025-11-11 06:42:45'),(64,34,53,41,NULL,'checkout','2025-11-11 06:42:33'),(65,33,51,83,NULL,'checkout','2025-11-11 06:28:03'),(66,32,32,43,6,'checkout','2025-11-11 05:53:03'),(67,13,32,43,NULL,'return','2025-11-11 05:51:49'),(68,26,52,96,NULL,'return','2025-11-11 05:14:55'),(69,25,52,102,NULL,'return','2025-11-11 05:14:36'),(70,31,52,63,NULL,'checkout','2025-11-11 05:11:23'),(71,30,52,86,NULL,'checkout','2025-11-11 05:11:18'),(72,29,52,70,NULL,'checkout','2025-11-11 05:11:12'),(73,28,52,69,NULL,'checkout','2025-11-11 05:11:02'),(74,27,52,78,NULL,'checkout','2025-11-11 05:10:55'),(75,26,52,96,NULL,'checkout','2025-11-11 05:10:50'),(76,25,52,102,NULL,'checkout','2025-11-11 05:10:42'),(77,24,2,114,NULL,'checkout','2025-11-11 03:59:38'),(78,23,2,119,NULL,'checkout','2025-11-11 03:59:32'),(79,22,2,122,NULL,'checkout','2025-11-11 03:59:23'),(80,10,15,14,NULL,'return','2025-11-10 23:09:13'),(81,21,15,62,NULL,'checkout','2025-11-10 20:51:18'),(82,20,37,61,NULL,'checkout','2025-11-08 22:01:38'),(83,19,15,16,NULL,'checkout','2025-11-08 17:49:35'),(84,18,37,68,NULL,'checkout','2025-11-08 13:41:14'),(85,17,2,85,NULL,'checkout','2025-11-08 08:12:50'),(86,15,40,83,6,'return','2025-11-08 07:54:22'),(87,16,40,84,6,'checkout','2025-11-08 07:53:05'),(88,15,40,83,6,'checkout','2025-11-08 07:52:57'),(89,14,2,17,NULL,'checkout','2025-11-07 17:37:45'),(90,6,33,17,6,'return','2025-11-06 23:36:31'),(91,13,32,43,NULL,'checkout','2025-11-06 22:36:46'),(92,12,15,15,NULL,'checkout','2025-11-06 22:35:59'),(93,11,2,15,NULL,'return','2025-11-06 21:06:01'),(94,11,2,15,NULL,'checkout','2025-11-06 20:16:49'),(95,10,15,14,NULL,'checkout','2025-11-06 19:35:05'),(96,9,15,18,NULL,'checkout','2025-11-06 18:52:16'),(97,73,56,144,10,'checkout','2025-10-30 16:45:00'),(98,8,7,26,6,'checkout','2025-10-28 01:57:53'),(99,6,33,17,6,'checkout','2025-10-28 01:38:22'),(100,72,60,140,9,'checkout','2025-10-27 09:00:00'),(101,71,58,138,8,'checkout','2025-10-25 10:15:00'),(102,70,57,137,7,'checkout','2025-10-20 14:30:00'),(103,74,50,147,7,'checkout','2025-10-10 11:20:00'),(128,69,55,98,NULL,'returned','2025-11-12 02:04:34');
/*!40000 ALTER TABLE `loan_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `media`
--

LOCK TABLES `media` WRITE;
/*!40000 ALTER TABLE `media` DISABLE KEYS */;
INSERT INTO `media` VALUES (24,'DVD',120,NULL,NULL),(34,'DVD',169,'Paramount Pictures and Warner Bros. Pictures',2014),(35,'DVD',45,NULL,2008),(37,'Blu-ray',242,'Warner Bros Picture',2021),(38,'DVD',124,'Wayans Bros. Entertainment',2000),(39,'Blu-ray',160,'Universal Pictures',2024);
/*!40000 ALTER TABLE `media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `reservation`
--

LOCK TABLES `reservation` WRITE;
/*!40000 ALTER TABLE `reservation` DISABLE KEYS */;
INSERT INTO `reservation` VALUES (51,5,2,6,'2025-11-18 13:00:00','2025-11-18 14:00:00','active'),(63,34,3,NULL,'2025-11-12 20:00:00','2025-11-12 21:00:00','cancelled'),(64,15,2,NULL,'2025-11-12 14:00:00','2025-11-12 15:00:00','active'),(65,15,4,NULL,'2025-11-12 14:00:00','2025-11-12 15:00:00','active'),(67,34,3,NULL,'2025-11-12 16:00:00','2025-11-12 17:00:00','cancelled'),(74,2,2,NULL,'2025-11-12 16:00:00','2025-11-12 17:00:00','cancelled'),(75,34,3,NULL,'2025-11-12 17:00:00','2025-11-12 18:00:00','cancelled'),(76,34,3,NULL,'2025-11-12 20:00:00','2025-11-12 21:00:00','cancelled');
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
/*!50003 CREATE*/ /*!50017 DEFINER=`db2root`@`%`*/ /*!50003 TRIGGER `prevent_overlap` BEFORE INSERT ON `reservation` FOR EACH ROW BEGIN
    DECLARE conflicts INT;
    DECLARE user_total_hours DECIMAL(10,2);
    DECLARE new_duration_hours DECIMAL(10,2);
    
    -- Check for overlapping active reservations in the same room
    -- Two time ranges overlap if: start1 < end2 AND start2 < end1
    SELECT COUNT(*) INTO conflicts 
    FROM reservation
    WHERE room_id = NEW.room_id
      AND status = 'active'
      AND NEW.start_time < end_time
      AND NEW.end_time > start_time;
    
    IF conflicts > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Failed to add reservation: Scheduling conflict';
    END IF;
    
    -- Calculate duration of new reservation in hours
    SET new_duration_hours = TIMESTAMPDIFF(MINUTE, NEW.start_time, NEW.end_time) / 60.0;
    
    -- Check total hours booked by this user on the same day (across all rooms)
    SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time) / 60.0), 0)
    INTO user_total_hours
    FROM reservation
    WHERE user_id = NEW.user_id
      AND status = 'active'
      AND DATE(start_time) = DATE(NEW.start_time);
    
    -- Check if adding this reservation would exceed 2 hours for the day
    IF (user_total_hours + new_duration_hours) > 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Failed to add reservation: Maximum 2 hours per day limit exceeded';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Dumping data for table `room`
--

LOCK TABLES `room` WRITE;
/*!40000 ALTER TABLE `room` DISABLE KEYS */;
INSERT INTO `room` VALUES (2,'A1',10,'TV, HDMI, White board and markers'),(3,'B2',8,'TV, HDMI, White board and markers'),(4,'C3',2,NULL);
/*!40000 ALTER TABLE `room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `tag`
--

LOCK TABLES `tag` WRITE;
/*!40000 ALTER TABLE `tag` DISABLE KEYS */;
/*!40000 ALTER TABLE `tag` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'Noe','Callahan','admin@library.test',NULL,NULL,'2025-10-24',NULL),(2,'Truc','Le','truclt.nikane@gmail.com',NULL,NULL,'2025-10-24',NULL),(3,'Brendan','Luna','staff@library.test',NULL,NULL,'2025-10-24',NULL),(4,'Jade','Nolan','test+5433+@demo.com',NULL,NULL,'2025-10-25',NULL),(5,'Ada','Lovelace','ada@example.com',NULL,NULL,'2025-10-25',NULL),(7,'William','Herrmann','william.a.herrmann@gmail.com',NULL,NULL,'2025-10-25',NULL),(9,'William','Herrmann','will@gmail.com',NULL,NULL,'2025-10-25',NULL),(10,'Emely','Travis','test4@test.com',NULL,NULL,'2025-10-25',NULL),(11,'Griffin','Arnold','test5@test.com',NULL,NULL,'2025-10-25',NULL),(12,'Fideon','Thomas','test6@gmail.com',NULL,NULL,'2025-10-25',NULL),(13,'Prin','Basser','test7@test.com',NULL,NULL,'2025-10-25',NULL),(14,'Jeremy','Castro','test8@test.com',NULL,NULL,'2025-10-25',NULL),(15,'Matthew','Boodram','mhboodram05@gmail.com',NULL,NULL,'2025-10-27',NULL),(16,'John','Doe','em@il',NULL,NULL,'2025-10-27',NULL),(17,'Jake','Morgan','test@test',NULL,NULL,'2025-10-27',NULL),(20,'Brendan','Hoover','an_@dmin',NULL,NULL,'2025-10-27',NULL),(21,'Amber','Kaul','amberkaul5@gmail.com',NULL,NULL,'2025-10-27',NULL),(22,'Isaiah','Williams','a@test',NULL,NULL,'2025-10-27',NULL),(23,'Lucas','Romero','test@test1',NULL,NULL,'2025-10-27',NULL),(24,'Chris','Pine','test@3',NULL,NULL,'2025-10-27',NULL),(25,'Cooper','Flagg','hello@123.com',NULL,NULL,'2025-10-27',NULL),(26,'Jalenn','Brunsonn','mr@dmin',NULL,NULL,'2025-10-27',NULL),(27,'Staff','Amber','staff@amber.com',NULL,NULL,'2025-10-27',NULL),(28,'Koa','Peat','will@will',NULL,NULL,'2025-10-27',NULL),(29,'Lebron','James','e@e',NULL,NULL,'2025-10-28',NULL),(30,'Kevin','Garnett','employee@employee',NULL,NULL,'2025-10-28',NULL),(31,'Chris','Cennac','finalnot@test',NULL,NULL,'2025-10-28',NULL),(32,'Jordan','Smith','jsmith@example.com',NULL,NULL,'2025-10-28',NULL),(33,'Jesse','Williams','jwilliams@example.com',NULL,NULL,'2025-10-28',NULL),(34,'Michael','Jordan','w@w',NULL,NULL,'2025-10-28',NULL),(35,'Barry','Li','libarry@example.com',NULL,NULL,'2025-10-28',NULL),(36,'Aaron','Holiday','adminmatt@admin.net',NULL,NULL,'2025-10-28',NULL),(37,'Merlin','Ambrose','ngota0330@yahoo.com',NULL,NULL,'2025-10-28',NULL),(38,'Lu','Dort','anoriginalusername42@gmail.com',NULL,NULL,'2025-10-28',NULL),(39,'John','Smithian','josh.3589.me@gmail.com',NULL,NULL,'2025-10-28',NULL),(40,'Nikki','Ki','nikkinguyen730@gmail.com',NULL,NULL,'2025-10-28',NULL),(41,'Dylan','Harper','staff.cli+20251029132032@example.com',NULL,NULL,'2025-10-29',NULL),(42,'Domantis','Sabonis','staff.cli+20251029132048@example.com',NULL,NULL,'2025-10-29',NULL),(43,'Filza','Roche','filzaroche@gmail.com',NULL,NULL,'2025-10-29',NULL),(44,'Kathiana','Rodriguez','kathiana119@gmail.com',NULL,NULL,'2025-10-29',NULL),(45,'Shamama','Khan','kshamama12@gmail.com',NULL,NULL,'2025-11-03',NULL),(46,'Amen','Thompson','test10@test',NULL,NULL,'2025-11-05',NULL),(49,'Josh','Montario','joshua.m897193@gmail.com',NULL,NULL,'2025-11-07',NULL),(50,'William','Herrmann','wtest@test',NULL,NULL,'2025-11-08',NULL),(51,'Alperen','Sengun','testreg@test',NULL,NULL,'2025-11-11',NULL),(52,'Frank','Castle','franky@teachuh.edu',NULL,NULL,'2025-11-11',NULL),(53,'Jabari','Smith','holds@test',NULL,NULL,'2025-11-11',NULL),(54,'Brad','Curcio','brads@gmail.com',NULL,NULL,'2025-11-11',NULL),(55,'Phil','Ocifah','philteaches@college.edu',NULL,NULL,'2025-11-11',NULL),(56,'Phoenix','Velasquez','pvelasquez@student',NULL,NULL,'2025-11-12',NULL),(57,'Jace','Sloan','jsloan@student',NULL,NULL,'2025-11-12',NULL),(58,'Blair','Glover','bglover@student',NULL,NULL,'2025-11-12',NULL),(59,'Noah','Bryan','nbryan@studen',NULL,NULL,'2025-11-12',NULL),(60,'Rylee','Burns','rburns@student',NULL,NULL,'2025-11-12',NULL),(61,'Amanda','Waller','amwa@gmail.com',NULL,NULL,'2025-11-12',NULL);
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

-- Dump completed on 2025-11-12  2:48:21
