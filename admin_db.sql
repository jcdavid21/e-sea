-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 04, 2025 at 08:47 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `admin_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `admin_id` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `admin_id`, `password_hash`, `created_at`) VALUES
(2, '001-Admin', 'A123456', '$2b$10$joXmfCRYtICMZPbvjW03SuVnz5J7K0qAaoFNoyN5JqL56kcOMusma', '2025-11-28 14:21:54');

-- --------------------------------------------------------

--
-- Table structure for table `sellers`
--

CREATE TABLE `sellers` (
  `id` int(11) NOT NULL,
  `unique_id` varchar(20) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `shop_name` varchar(100) DEFAULT NULL,
  `street` varchar(100) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `municipality` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `requirements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`requirements`)),
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `date_added` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sellers`
--

INSERT INTO `sellers` (`id`, `unique_id`, `last_name`, `first_name`, `middle_name`, `shop_name`, `street`, `barangay`, `municipality`, `province`, `requirements`, `status`, `date_added`) VALUES
(1, 'SELL-ZQ0Z5K', 'Closa', 'Catherine Grace', 'Belarmino', 'Cath Shop', 'Sitio Looban', 'Teresita', 'Mansalay', 'Oriental Mindoro', '{\"idProof\": true, \"businessPermit\": true, \"barangayClearance\": true}', 'accepted', '2025-11-05 04:33:56'),
(2, 'SELL-THMDAW', 'Closa', 'Mabel', 'Belarmino', 'Mabel Shop', 'Teresita, Mansalay, Oriental Mindoro', 'Teresita', 'Mansalay', 'oriental Mindoro', '\"{\\\"businessPermit\\\":true,\\\"barangayClearance\\\":true,\\\"idProof\\\":true}\"', 'accepted', '2025-11-11 02:18:33'),
(3, 'SELL-GVPSB6', 'Closa', 'Junior', 'Belarmino', 'Junior Shop', 'Sitio Labasan', 'Teresita', 'Mansalay', 'Oriental Mindoro', '{\"idProof\": true, \"businessPermit\": false, \"barangayClearance\": true}', 'accepted', '2025-11-11 02:26:10'),
(4, 'SELL-GFGDHQ', 'Portes', 'Kian', 'P.', 'Fishfish', 'dto', 'saan', 'sila', 'kanila', '{\"idProof\": false, \"businessPermit\": true, \"barangayClearance\": false}', 'accepted', '2025-11-15 15:36:44'),
(5, 'SELL-7LED1Z', 'Portes', 'Andrei', 'Pascual', 'keyshop', 'San Nicolas', 'Libtong', 'Roxas', 'Oriental Mindoro', '{\"idProof\": true, \"businessPermit\": true, \"barangayClearance\": true}', 'accepted', '2025-11-19 03:58:19'),
(6, 'SELL-7H8FD1', 'Baluntong', 'Jean', 'Tijulan', 'Jean Shop', 'Sitio Labasan', 'Teresita', 'Mansalay', 'Oriental Mindoro', '{\"idProof\": true, \"businessPermit\": true, \"barangayClearance\": true}', 'accepted', '2025-11-28 03:22:59'),
(7, 'SELLER-1764751915379', 'David', 'Juancarlo', '', 'doys', 'Loraine Street', 'doys', 'doys', 'Bulacan', '{\"barangayClearance\":true,\"businessPermit\":true,\"idProof\":false}', 'pending', '2025-11-29 08:51:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `admin_id` (`admin_id`);

--
-- Indexes for table `sellers`
--
ALTER TABLE `sellers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_id` (`unique_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `sellers`
--
ALTER TABLE `sellers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
