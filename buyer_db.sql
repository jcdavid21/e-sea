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
-- Database: `buyer_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `buyer_authentication`
--

CREATE TABLE `buyer_authentication` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `buyer_authentication`
--

INSERT INTO `buyer_authentication` (`id`, `email`, `contact`, `last_name`, `first_name`, `middle_name`, `username`, `password_hash`, `created_at`) VALUES
(1, 'catherinegraceclosa@gmail.com', '09517397968', 'Closa', 'Kathrine', 'Belarmino', 'kathrine', '$2b$10$5bQ9uzzQi1MB9L.1gmEBxebSi9T9tNsjo0M5sWQ330wA46ER7HMUO', '2025-11-12 04:58:33'),
(2, 'kian@gmail.com', '09090909090', 'Portes', 'Kian Andrei', 'P.', 'kian', '$2b$10$NtIRFQ24DzD73uzV6CiIhebPim/nLCL1ooE3BkcISdp3S/h6.1nGm', '2025-11-15 15:57:15'),
(3, 'cath@gmail.com', '09517397968', 'Closa', 'Kath', 'Belarmino', 'kath', '$2b$10$AvhHgAeLVLBMKYCDxvya..eDRrp/GXVYroyr7PrnfteQ1jMIvjb82', '2025-11-26 07:58:33'),
(4, 'kian123@gmail.com', '09090909090', 'Portes', 'Kian Andrei', 'P.', 'kians', '$2b$10$R0EWusYrt7hJb3Owm98m0uP.E7FR.3Z3itONvUXrpeEwa6mVsFAQi', '2025-11-27 12:58:45'),
(5, 'kian12345@gmail.com', '09876543212', 'Portes', 'Kian', 'Andrei', 'Kianp', '$2b$10$BdwId/3SCI2Deg6GwFusFuaoMNy7pXE8w6jcMXS7fM0fSAj.MYEW.', '2025-11-28 08:39:22');

-- --------------------------------------------------------

--
-- Table structure for table `buyer_purchases`
--

CREATE TABLE `buyer_purchases` (
  `id` int(11) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `buyer_authentication`
--
ALTER TABLE `buyer_authentication`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `buyer_purchases`
--
ALTER TABLE `buyer_purchases`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `buyer_authentication`
--
ALTER TABLE `buyer_authentication`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `buyer_purchases`
--
ALTER TABLE `buyer_purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
