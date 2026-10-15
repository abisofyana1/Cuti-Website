-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Jan 09, 2026 at 11:21 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ecuti_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` varchar(50) NOT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `service` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `total_days` int(11) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `current_position` varchar(50) DEFAULT NULL,
  `approver_tl` varchar(255) DEFAULT NULL,
  `approver_spv` varchar(255) DEFAULT NULL,
  `approver_mgr` varchar(255) DEFAULT NULL,
  `history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`history`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `user_email`, `user_name`, `service`, `start_date`, `end_date`, `total_days`, `reason`, `status`, `current_position`, `approver_tl`, `approver_spv`, `approver_mgr`, `history`, `created_at`) VALUES
('CT-1765622607448', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-14', '2025-12-18', 5, 'Cuti 5 Hari', 'REJECTED', 'SPV', '', 'Muhammad.Dwiki@bni.co.id', '', '[\"[\",\"{\",\"\\\"\",\"s\",\"t\",\"a\",\"g\",\"e\",\"\\\"\",\":\",\"\\\"\",\"U\",\"s\",\"e\",\"r\",\"\\\"\",\",\",\"\\\"\",\"a\",\"c\",\"t\",\"o\",\"r\",\"\\\"\",\":\",\"\\\"\",\"A\",\"b\",\"i\",\" \",\"S\",\"o\",\"f\",\"y\",\"a\",\"n\",\"a\",\"\\\"\",\",\",\"\\\"\",\"a\",\"c\",\"t\",\"i\",\"o\",\"n\",\"\\\"\",\":\",\"\\\"\",\"S\",\"U\",\"B\",\"M\",\"I\",\"T\",\"\\\"\",\",\",\"\\\"\",\"t\",\"i\",\"m\",\"e\",\"s\",\"t\",\"a\",\"m\",\"p\",\"\\\"\",\":\",\"\\\"\",\"2\",\"0\",\"2\",\"5\",\"-\",\"1\",\"2\",\"-\",\"1\",\"3\",\"T\",\"1\",\"0\",\":\",\"4\",\"3\",\":\",\"2\",\"7\",\".\",\"4\",\"4\",\"8\",\"Z\",\"\\\"\",\"}\",\"]\",{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"REJECT\",\"timestamp\":\"2025-12-13T10:44:30.126Z\"}]', '2025-12-13 10:43:27'),
('CT-1765623914360', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-14', '2025-12-14', 1, 'fsdfsdfdsfdfdsfdfdfdfsdsf\ndsfdsfdsfdfs\nsdfdsfdfds\ndfdsdsdf\ndfdfsdsdf', 'APPROVED', 'Admin', '', 'Muhammad.Dwiki@bni.co.id', '', '[\"[\",\"{\",\"\\\"\",\"s\",\"t\",\"a\",\"g\",\"e\",\"\\\"\",\":\",\"\\\"\",\"U\",\"s\",\"e\",\"r\",\"\\\"\",\",\",\"\\\"\",\"a\",\"c\",\"t\",\"o\",\"r\",\"\\\"\",\":\",\"\\\"\",\"A\",\"b\",\"i\",\" \",\"S\",\"o\",\"f\",\"y\",\"a\",\"n\",\"a\",\"\\\"\",\",\",\"\\\"\",\"a\",\"c\",\"t\",\"i\",\"o\",\"n\",\"\\\"\",\":\",\"\\\"\",\"S\",\"U\",\"B\",\"M\",\"I\",\"T\",\"\\\"\",\",\",\"\\\"\",\"t\",\"i\",\"m\",\"e\",\"s\",\"t\",\"a\",\"m\",\"p\",\"\\\"\",\":\",\"\\\"\",\"2\",\"0\",\"2\",\"5\",\"-\",\"1\",\"2\",\"-\",\"1\",\"3\",\"T\",\"1\",\"1\",\":\",\"0\",\"5\",\":\",\"1\",\"4\",\".\",\"3\",\"6\",\"0\",\"Z\",\"\\\"\",\"}\",\"]\",{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"APPROVE\",\"timestamp\":\"2025-12-13T11:06:40.576Z\"}]', '2025-12-13 11:05:14'),
('CT-1765623957363', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-15', '2025-12-15', 1, 'gfsdgsdgsdggf\nfgfdgfdgf\nfdg\ndfg\ndfgdfgdf\nfgfdgfd', 'REJECTED', 'SPV', '', 'Muhammad.Dwiki@bni.co.id', '', '[\"[\",\"{\",\"\\\"\",\"s\",\"t\",\"a\",\"g\",\"e\",\"\\\"\",\":\",\"\\\"\",\"U\",\"s\",\"e\",\"r\",\"\\\"\",\",\",\"\\\"\",\"a\",\"c\",\"t\",\"o\",\"r\",\"\\\"\",\":\",\"\\\"\",\"A\",\"b\",\"i\",\" \",\"S\",\"o\",\"f\",\"y\",\"a\",\"n\",\"a\",\"\\\"\",\",\",\"\\\"\",\"a\",\"c\",\"t\",\"i\",\"o\",\"n\",\"\\\"\",\":\",\"\\\"\",\"S\",\"U\",\"B\",\"M\",\"I\",\"T\",\"\\\"\",\",\",\"\\\"\",\"t\",\"i\",\"m\",\"e\",\"s\",\"t\",\"a\",\"m\",\"p\",\"\\\"\",\":\",\"\\\"\",\"2\",\"0\",\"2\",\"5\",\"-\",\"1\",\"2\",\"-\",\"1\",\"3\",\"T\",\"1\",\"1\",\":\",\"0\",\"5\",\":\",\"5\",\"7\",\".\",\"3\",\"6\",\"3\",\"Z\",\"\\\"\",\"}\",\"]\",{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"REJECT\",\"timestamp\":\"2025-12-13T11:06:37.106Z\"}]', '2025-12-13 11:05:57'),
('CT-1765624109764', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-15', '2025-12-15', 1, 'ghjhjhgj', 'REJECTED', 'SPV', '', 'Muhammad.Dwiki@bni.co.id', '', '[\"[\",\"{\",\"\\\"\",\"s\",\"t\",\"a\",\"g\",\"e\",\"\\\"\",\":\",\"\\\"\",\"U\",\"s\",\"e\",\"r\",\"\\\"\",\",\",\"\\\"\",\"a\",\"c\",\"t\",\"o\",\"r\",\"\\\"\",\":\",\"\\\"\",\"A\",\"b\",\"i\",\" \",\"S\",\"o\",\"f\",\"y\",\"a\",\"n\",\"a\",\"\\\"\",\",\",\"\\\"\",\"a\",\"c\",\"t\",\"i\",\"o\",\"n\",\"\\\"\",\":\",\"\\\"\",\"S\",\"U\",\"B\",\"M\",\"I\",\"T\",\"\\\"\",\",\",\"\\\"\",\"t\",\"i\",\"m\",\"e\",\"s\",\"t\",\"a\",\"m\",\"p\",\"\\\"\",\":\",\"\\\"\",\"2\",\"0\",\"2\",\"5\",\"-\",\"1\",\"2\",\"-\",\"1\",\"3\",\"T\",\"1\",\"1\",\":\",\"0\",\"8\",\":\",\"2\",\"9\",\".\",\"7\",\"6\",\"4\",\"Z\",\"\\\"\",\"}\",\"]\",{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"REJECT\",\"timestamp\":\"2025-12-13T11:08:46.194Z\"}]', '2025-12-13 11:08:29'),
('CT-1765767733305', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX DIGITAL', '2025-12-16', '2025-12-16', 1, 'dfgdfdfgfdg', 'APPROVED', 'Admin', '', 'Muhammad.Dwiki@bni.co.id', '', '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-15T03:02:13.305Z\"},{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"APPROVE\",\"timestamp\":\"2025-12-15T03:02:25.062Z\"}]', '2025-12-15 03:02:13'),
('CT-1765779718346', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-16', '2025-12-16', 1, 'dfsdfdsfsdf', 'REJECTED', 'SPV', '', 'Muhammad.Dwiki@bni.co.id', '', '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-15T06:21:58.346Z\"},{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"REJECT\",\"timestamp\":\"2025-12-15T06:22:13.196Z\"}]', '2025-12-15 06:21:58'),
('CT-1765781225237', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-16', '2025-12-16', 1, 'Coba', 'APPROVED', 'Admin', NULL, 'Muhammad.Dwiki@bni.co.id', NULL, '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-15T06:47:05.237Z\"},{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"APPROVE\",\"timestamp\":\"2025-12-15T06:47:20.834Z\"}]', '2025-12-15 06:47:05'),
('CT-1765781922320', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-17', '2025-12-17', 1, 'Test', 'APPROVED', 'Admin', NULL, 'Muhammad.Dwiki@bni.co.id', NULL, '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-15T06:58:42.320Z\"},{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"APPROVE\",\"timestamp\":\"2025-12-16T11:43:37.599Z\"}]', '2025-12-15 06:58:42'),
('CT-1765885399867', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-17', '2025-12-18', 2, 'asgdjsgfhLJKGAJHFGDSJBMNCBMXBMZXCXVCCXVVCXVXCVXCVXCV', 'APPROVED', 'Admin', NULL, 'Muhammad.Dwiki@bni.co.id', NULL, '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-16T11:43:19.867Z\"},{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"APPROVE\",\"timestamp\":\"2025-12-16T11:43:39.699Z\"}]', '2025-12-16 11:43:19'),
('CT-1765885653986', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-19', '2025-12-19', 1, 'fdsaff', 'REJECTED', 'SPV', NULL, 'Muhammad.Dwiki@bni.co.id', NULL, '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-16T11:47:33.986Z\"},{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"REJECT\",\"timestamp\":\"2025-12-16T11:47:51.866Z\"}]', '2025-12-16 11:47:33'),
('CT-1765889190285', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-19', '2025-12-20', 2, 'asdsadsadaas', 'APPROVED', 'Admin', NULL, 'Muhammad.Dwiki@bni.co.id', NULL, '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-16T12:46:30.284Z\"},{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"APPROVE\",\"timestamp\":\"2025-12-16T12:47:28.683Z\"}]', '2025-12-16 12:46:30'),
('CT-1765962544355', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-18', '2025-12-18', 1, 'asdsadsadsadsad', 'APPROVED', 'Admin', NULL, 'Muhammad.Dwiki@bni.co.id', NULL, '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-17T09:09:04.355Z\"},{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"APPROVE\",\"timestamp\":\"2025-12-17T09:09:21.278Z\"}]', '2025-12-17 09:09:04'),
('CT-1765962921929', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-20', '2025-12-20', 1, 'asdasdsad', 'REJECTED', 'SPV', NULL, 'Muhammad.Dwiki@bni.co.id', NULL, '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-17T09:15:21.929Z\"},{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"REJECT\",\"timestamp\":\"2025-12-17T09:15:33.780Z\"}]', '2025-12-17 09:15:21'),
('CT-1765963751993', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-22', '2025-12-22', 1, 'Coba Test Aplikasi Cuti', 'REJECTED', 'SPV', 'tlcxe@bni.co.id', 'Muhammad.Dwiki@bni.co.id', NULL, '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-17T09:29:11.993Z\"},{\"stage\":\"TL\",\"actor\":\"TL CXE\",\"action\":\"APPROVE\",\"timestamp\":\"2025-12-17T09:37:33.975Z\"},{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"REJECT\",\"timestamp\":\"2025-12-17T09:37:47.990Z\"}]', '2025-12-17 09:29:11'),
('CT-1765964309249', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-25', '2025-12-25', 1, 'Test Cuti', 'APPROVED', 'Admin', 'tlcxe@bni.co.id', 'Muhammad.Dwiki@bni.co.id', NULL, '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-17T09:38:29.249Z\"},{\"stage\":\"TL\",\"actor\":\"TL CXE\",\"action\":\"APPROVE\",\"timestamp\":\"2025-12-17T09:38:37.925Z\"},{\"stage\":\"SPV\",\"actor\":\"Muhammad Dwiki\",\"action\":\"APPROVE\",\"timestamp\":\"2025-12-17T09:38:47.299Z\"}]', '2025-12-17 09:38:29'),
('CT-1765964408501', 'Abi.Sofyana@bni.co.id', 'Abi Sofyana', 'CX EXCELLENCE', '2025-12-19', '2025-12-19', 1, 'gfdgdfg', 'PENDING', 'TL', 'tlcxe@bni.co.id', 'Muhammad.Dwiki@bni.co.id', NULL, '[{\"stage\":\"User\",\"actor\":\"Abi Sofyana\",\"action\":\"SUBMIT\",\"timestamp\":\"2025-12-17T09:40:08.501Z\"}]', '2025-12-17 09:40:08');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `hq` varchar(100) DEFAULT NULL,
  `role` varchar(50) NOT NULL,
  `balance` int(11) DEFAULT 12,
  `position` varchar(100) DEFAULT NULL,
  `vendor` varchar(100) DEFAULT NULL,
  `service` varchar(100) DEFAULT NULL,
  `tl_email` varchar(255) DEFAULT NULL,
  `spv_email` varchar(255) DEFAULT NULL,
  `mgr_email` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`email`, `password`, `name`, `role`, `balance`, `position`, `vendor`, `service`, `tl_email`, `spv_email`, `mgr_email`) VALUES
('Abi.Sofyana@bni.co.id', '96381', 'Abi Sofyana', 'User', 5, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', 'tlcxe@bni.co.id', 'Muhammad.Dwiki@bni.co.id', NULL),
('admin@bni.co.id', 'admin', 'Administrator', 'Admin', 12, 'Administrator', '', '', NULL, NULL, NULL),
('coba@gmail.com', '1', 'Coba - Coba', 'User', 14, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', NULL, 'Muhammad.Dwiki@bni.co.id', NULL),
('Desi.Anugrahsari@bni.co.id', '95602', 'Desi Anugrah Sari', 'User', 12, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', '-', 'Hary.Wibowo@bni.co.id', '-'),
('Fadli.TriSaputra@bni.co.id', '90874', 'Fadli Tri Saputra Ramli', 'User', 12, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', '-', 'Hary.Wibowo@bni.co.id', '-'),
('Hary.Wibowo@bni.co.id', '35074', 'Muhammad Hary Wibowo', 'SPV', 12, 'Supervisor', '-', 'CX EXCELLENCE', '-', '-', '-'),
('Isma.Reslani@bni.co.id', '100026', 'Isma Reslani', 'User', 12, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', '-', 'Hary.Wibowo@bni.co.id', '-'),
('M.Azhar@bni.co.id', '100026', 'Muhammad Al Azhar', 'User', 12, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', '-', 'Hary.Wibowo@bni.co.id', '-'),
('Marylin.Widya@bni.co.id', '90927', 'Marylin Widya', 'User', 12, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', '-', 'Hary.Wibowo@bni.co.id', '-'),
('Muhammad.Dwiki@bni.co.id', '63862', 'Muhammad Dwiki', 'SPV', 12, 'Supervisor', 'PT. VALDO', 'CX EXCELLENCE', NULL, NULL, NULL),
('tlcxe@bni.co.id', 'tl', 'TL CXE', 'TL', 12, 'TL (TAD)', 'PT. SGRS', 'CX EXCELLENCE', NULL, 'Muhammad.Dwiki@bni.co.id', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`email`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
