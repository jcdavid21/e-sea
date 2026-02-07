-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Feb 07, 2026 at 10:27 AM
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
-- Database: `e_sea_db`
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
  `secret_question` varchar(100) DEFAULT NULL,
  `secret_ans` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `buyer_authentication`
--

INSERT INTO `buyer_authentication` (`id`, `email`, `contact`, `last_name`, `first_name`, `middle_name`, `username`, `password_hash`, `secret_question`, `secret_ans`, `created_at`) VALUES
(1, 'catherinegraceclosa@gmail.com', '09517397968', 'Closa', 'Kathrine', 'Belarmino', 'kathrine', '$2b$10$5bQ9uzzQi1MB9L.1gmEBxebSi9T9tNsjo0M5sWQ330wA46ER7HMUO', NULL, NULL, '2025-11-12 04:58:33'),
(2, 'kian@gmail.com', '09090909090', 'Portes', 'Kian Andrei', 'P.', 'kian', '$2b$10$NtIRFQ24DzD73uzV6CiIhebPim/nLCL1ooE3BkcISdp3S/h6.1nGm', 'What is your favorite team?', '$2b$10$OzCcu2wmG31ONG.iqz1Quen3fpb74.JxhgKs9MyLc3uLpu6yahD7.', '2025-11-15 15:57:15'),
(3, 'cath@gmail.com', '09517397968', 'Closa', 'Kath', 'Belarmino', 'kath', '$2b$10$AvhHgAeLVLBMKYCDxvya..eDRrp/GXVYroyr7PrnfteQ1jMIvjb82', NULL, NULL, '2025-11-26 07:58:33'),
(4, 'kian123@gmail.com', '09090909090', 'Portes', 'Kian Andrei', 'P.', 'kians', '$2b$10$R0EWusYrt7hJb3Owm98m0uP.E7FR.3Z3itONvUXrpeEwa6mVsFAQi', NULL, NULL, '2025-11-27 12:58:45'),
(5, 'kian12345@gmail.com', '09876543212', 'Portes', 'Kian', 'Andrei', 'Kianp', '$2b$10$BdwId/3SCI2Deg6GwFusFuaoMNy7pXE8w6jcMXS7fM0fSAj.MYEW.', NULL, NULL, '2025-11-28 08:39:22'),
(8, 'kyle@gmail.com', '09512847442', 'Ampil', 'Kyle', 'A.', 'kyleampil', '$2b$10$w/zOBNwhxhsj26hCh86tVu0Qs3Q9pMl2psSZLMxBxTakVw59UnYUq', 'What is your favorite team?', 'goldenstate', '2026-01-18 06:12:10');

-- --------------------------------------------------------

--
-- Table structure for table `buyer_notifications`
--

CREATE TABLE `buyer_notifications` (
  `id` int(11) NOT NULL,
  `customer_id` varchar(255) NOT NULL,
  `order_id` int(11) NOT NULL,
  `seller_id` varchar(100) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `buyer_notifications`
--

INSERT INTO `buyer_notifications` (`id`, `customer_id`, `order_id`, `seller_id`, `message`, `is_read`, `created_at`) VALUES
(6, 'KianAndreiPortes09090909090', 7, 'SELLER-QS2594', 'Your order #7 status has been updated to: Preparing', 1, '2026-02-02 09:00:21'),
(7, 'KianAndreiPortes09090909090', 7, 'SELLER-QS2594', 'Your order #7 status has been updated to: Completed', 1, '2026-02-02 09:00:29');

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

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `buyer_id`, `product_id`, `quantity`, `created_at`, `updated_at`) VALUES
(1, 2, 7, 1, '2026-02-07 09:11:14', '2026-02-07 09:11:14');

-- --------------------------------------------------------

--
-- Table structure for table `fish_categories`
--

CREATE TABLE `fish_categories` (
  `id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `seller_id` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fish_categories`
--

INSERT INTO `fish_categories` (`id`, `category_name`, `seller_id`, `created_at`) VALUES
(1, 'Freshwater', 'SELLER-QS2594', '2025-12-20 03:20:02'),
(2, 'Saltwater', 'SELLER-QS2594', '2025-12-20 03:20:02'),
(3, 'Shellfish', 'SELLER-QS2594', '2025-12-20 03:20:02'),
(4, 'Crustaceans', 'SELLER-QS2594', '2025-12-20 03:20:02'),
(5, 'Premium Fish', 'SELLER-QS2594', '2025-12-20 03:20:02'),
(6, 'Freshwater', 'SELLER-SG6500', '2026-01-02 15:22:40'),
(7, 'Saltwater', 'SELLER-SG6500', '2026-01-02 15:22:40'),
(8, 'Shellfish', 'SELLER-SG6500', '2026-01-02 15:22:40'),
(9, 'Crustaceans', 'SELLER-SG6500', '2026-01-02 15:22:40'),
(10, 'Premium Fish', 'SELLER-SG6500', '2026-01-02 15:22:40');

-- --------------------------------------------------------

--
-- Table structure for table `fish_products`
--

CREATE TABLE `fish_products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `previous_price` decimal(10,2) DEFAULT NULL,
  `stock` int(11) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `seller_id` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `freshness` enum('Fresh','Chilled','Frozen') DEFAULT 'Fresh'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fish_products`
--

INSERT INTO `fish_products` (`id`, `name`, `category`, `unit`, `price`, `previous_price`, `stock`, `image_url`, `seller_id`, `created_at`, `freshness`) VALUES
(7, 'Fishda', 'Crustaceans', 'kg', 100.00, NULL, 47, 'https://res.cloudinary.com/dyqlhrzjn/image/upload/v1769158317/e-sea/products/qlolkzas6x0pzs0zeita.jpg', 'SELLER-QS2594', '2026-01-23 08:51:57', 'Fresh'),
(8, 'Fish2', 'Crustaceans', 'kg', 120.00, NULL, 49, 'https://res.cloudinary.com/dyqlhrzjn/image/upload/v1770038407/e-sea/products/bdxnabrkg37til3cgcl4.jpg', 'SELLER-QS2594', '2026-02-02 13:20:08', 'Fresh'),
(9, 'Fish3', 'Crustaceans', 'kg', 90.00, 95.00, 46, 'https://res.cloudinary.com/dyqlhrzjn/image/upload/v1770046058/e-sea/products/t6za1qk0wimdxdqphttz.png', 'SELLER-QS2594', '2026-02-02 15:27:39', 'Chilled'),
(10, 'Fish3', 'Crustaceans', 'kg', 90.00, 95.00, 120, 'https://res.cloudinary.com/dyqlhrzjn/image/upload/v1770046090/e-sea/products/jyqoyeiztvwgftt9ai7d.png', 'SELLER-QS2594', '2026-02-02 15:28:11', 'Fresh');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `seller_id` varchar(50) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `delivery_latitude` decimal(10,8) DEFAULT NULL,
  `delivery_longitude` decimal(11,8) DEFAULT NULL,
  `distance_km` decimal(6,2) DEFAULT NULL,
  `contact` varchar(100) DEFAULT NULL,
  `customer_id` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `payment_mode` varchar(50) DEFAULT NULL,
  `paid` tinyint(1) DEFAULT 0,
  `proof_of_payment` varchar(500) DEFAULT NULL,
  `order_date` timestamp NULL DEFAULT current_timestamp(),
  `status` varchar(50) NOT NULL DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `seller_id`, `customer_name`, `address`, `delivery_latitude`, `delivery_longitude`, `distance_km`, `contact`, `customer_id`, `notes`, `total`, `payment_mode`, `paid`, `proof_of_payment`, `order_date`, `status`) VALUES
(7, 'SELLER-QS2594', 'Juan Carlo David', 'Mahogany Street, Barangay 177, Zone 15, Camarin, District 1, Caloocan, Northern Manila District, Metro Manila, 1423, Philippines', 14.74562150, 121.05225910, 0.10, '09565535401', 'KianAndreiPortes09090909090', '', 100.00, 'Gcash QR', 1, 'https://res.cloudinary.com/dyqlhrzjn/image/upload/v1769161940/e-sea/payment-proofs/voufb0mpisuyjmavglmd.png', '2026-01-23 09:52:19', 'Completed'),
(8, 'SELLER-QS2594', 'Jc', 'Barangay 177, Zone 15, Camarin, District 1, Caloocan, Northern Manila District, Metro Manila, 1423, Philippines', 14.74737025, 121.04686736, 1.08, '09565535401', 'KianAndreiPortes09090909090', '', 100.00, 'Gcash QR', 1, 'https://res.cloudinary.com/dyqlhrzjn/image/upload/v1770036018/e-sea/payment-proofs/kkjp031wxwhozth6ej2s.jpg', '2026-02-02 12:40:19', 'Pending'),
(9, 'SELLER-QS2594', 'Juan carlo David', 'Barangay 177, Zone 15, Camarin, District 1, Caloocan, Northern Manila District, Metro Manila, 1423, Philippines', 14.74736904, 121.04687185, 1.08, '09565535401', 'KianAndreiPortes09090909090', 'Pabili', 220.00, 'Gcash QR', 1, 'https://res.cloudinary.com/dyqlhrzjn/image/upload/v1770038500/e-sea/payment-proofs/iaystru8oapfcbxaaacz.jpg', '2026-02-02 13:21:40', 'Pending'),
(10, 'SELLER-QS2594', 'Jc David', 'Barangay 177, Zone 15, Camarin, District 1, Caloocan, Northern Manila District, Metro Manila, 1423, Philippines', 14.74737682, 121.04686432, 1.08, '09565535401', 'KianAndreiPortes09090909090', '', 360.00, 'Gcash QR', 1, 'https://res.cloudinary.com/dyqlhrzjn/image/upload/v1770455567/e-sea/payment-proofs/fo7gvf61koo84ppp7sjp.jpg', '2026-02-07 09:12:48', 'Pending');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`) VALUES
(5, 5, 1, 1, 120.00),
(6, 6, 1, 1, 120.00),
(7, 6, 3, 1, 110.00),
(8, 7, 7, 1, 100.00),
(9, 8, 7, 1, 100.00),
(10, 9, 8, 1, 120.00),
(11, 9, 7, 1, 100.00),
(12, 10, 9, 4, 90.00);

-- --------------------------------------------------------

--
-- Table structure for table `price_history`
--

CREATE TABLE `price_history` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `seller_id` varchar(255) NOT NULL,
  `old_price` decimal(10,2) NOT NULL,
  `new_price` decimal(10,2) NOT NULL,
  `change_date` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `price_history`
--

INSERT INTO `price_history` (`id`, `product_id`, `seller_id`, `old_price`, `new_price`, `change_date`) VALUES
(18, 3, 'SELLER-QS2594', 120.00, 129.95, '2026-01-04 09:01:02'),
(19, 3, 'SELLER-QS2594', 129.95, 110.00, '2026-01-04 09:01:20'),
(23, 5, 'SELLER-QS2594', 135.00, 120.00, '2026-01-21 12:25:37'),
(29, 9, 'SELLER-QS2594', 100.00, 95.00, '2026-02-02 16:17:58'),
(30, 9, 'SELLER-QS2594', 95.00, 90.00, '2026-02-02 16:18:06'),
(32, 10, 'SELLER-QS2594', 100.00, 95.00, '2026-02-02 16:25:13'),
(33, 10, 'SELLER-QS2594', 95.00, 90.00, '2026-02-02 16:25:19');

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
(1, 'SELLER-QS2594', 'David', 'Juancarlo', '', 'doys', 'Loraine Street', 'doys', 'doys', 'Bulacan', '\"{\\\"barangayClearance\\\":true,\\\"businessPermit\\\":true,\\\"idProof\\\":true}\"', 'accepted', '2025-12-20 03:19:43'),
(2, 'SELLER-SG6500', 'Ivan', 'Josh', '', 'JoshShop', 'Bayan', 'Kaligayahan', 'Quezon City', '', '{\"barangayClearance\":false,\"businessPermit\":true,\"idProof\":true}', 'accepted', '2026-01-02 15:22:16');

-- --------------------------------------------------------

--
-- Table structure for table `seller_credentials`
--

CREATE TABLE `seller_credentials` (
  `id` int(11) NOT NULL,
  `unique_id` varchar(15) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `secret_question` varchar(100) DEFAULT NULL,
  `secret_ans` varchar(100) DEFAULT NULL,
  `date_registered` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `seller_credentials`
--

INSERT INTO `seller_credentials` (`id`, `unique_id`, `email`, `password_hash`, `secret_question`, `secret_ans`, `date_registered`) VALUES
(1, 'SELLER-QS2594', 'jcdavid@gmail.com', '$2b$10$/gLew3NLpSLZPLfwS7TR2eGbdK6S/AjFIYLwUC/BGaMjw.kK1cq7u', 'What is your favorite team?', '$2b$10$0r4LpM./KQd6dMp3zAPnX.0TCiLosrSgoAOz0PoKgkt3QXHCHg0ZK', '2025-12-20 03:20:02'),
(2, 'SELLER-SG6500', 'josh@gmail.com', '$2b$10$A6SoH/jFH2Lq2iVwxQ/ezeruC8jGe/r/Lzs1qrHZzxduDgvMxhZFa', NULL, NULL, '2026-01-02 15:22:40');

-- --------------------------------------------------------

--
-- Table structure for table `seller_feedback`
--

CREATE TABLE `seller_feedback` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `seller_id` varchar(50) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `seller_feedback`
--

INSERT INTO `seller_feedback` (`id`, `order_id`, `buyer_id`, `seller_id`, `rating`, `comment`, `created_at`) VALUES
(1, 5, 2, 'SELLER-QS2594', 5, 'Malinis', '2026-01-05 13:39:39');

-- --------------------------------------------------------

--
-- Table structure for table `seller_locations`
--

CREATE TABLE `seller_locations` (
  `id` int(11) NOT NULL,
  `seller_id` varchar(20) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `seller_locations`
--

INSERT INTO `seller_locations` (`id`, `seller_id`, `latitude`, `longitude`, `created_at`, `updated_at`) VALUES
(8, 'SELLER-QS2594', 14.74625227, 121.05286717, '2026-01-04 12:21:18', '2026-01-04 12:21:18');

-- --------------------------------------------------------

--
-- Table structure for table `seller_notifications`
--

CREATE TABLE `seller_notifications` (
  `id` int(11) NOT NULL,
  `seller_id` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','order','warning','success') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `seller_notifications`
--

INSERT INTO `seller_notifications` (`id`, `seller_id`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 'SELLER-QS2594', 'You have a new order (#5) from Juancarlo David.', 'order', 0, '2026-01-01 11:42:43'),
(2, 'SELLER-QS2594', 'Kian Andrei Portes gave you 5★ for order #5: \"Malinis\"', 'info', 0, '2026-01-05 13:39:39'),
(3, 'SELLER-QS2594', 'You have a new order (#6) from Juan Carlo David.', 'order', 0, '2026-01-21 13:05:34'),
(4, 'SELLER-QS2594', 'You have a new order (#7) from Juan Carlo David.', 'order', 0, '2026-01-23 09:52:19'),
(5, 'SELLER-QS2594', 'You have a new order (#8) from Jc.', 'order', 0, '2026-02-02 12:40:19'),
(6, 'SELLER-QS2594', 'You have a new order (#9) from Juan carlo David.', 'order', 0, '2026-02-02 13:21:40'),
(7, 'SELLER-QS2594', 'You have a new order (#10) from Jc David.', 'order', 0, '2026-02-07 09:12:48');

-- --------------------------------------------------------

--
-- Table structure for table `seller_profiles`
--

CREATE TABLE `seller_profiles` (
  `id` int(11) NOT NULL,
  `seller_id` varchar(50) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `qr` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `seller_profiles`
--

INSERT INTO `seller_profiles` (`id`, `seller_id`, `logo`, `qr`, `created_at`, `updated_at`) VALUES
(1, 'SELLER-QS2594', 'https://res.cloudinary.com/dyqlhrzjn/image/upload/v1769156920/e-sea/logos/onza2u75q0lh5pcb4qpp.jpg', 'https://res.cloudinary.com/dyqlhrzjn/image/upload/v1769157020/e-sea/qr-codes/fpnm5xhias9gjpkncb5h.png', '2026-01-01 11:41:59', '2026-01-23 08:30:22');

-- --------------------------------------------------------

--
-- Table structure for table `seller_requirement_files`
--

CREATE TABLE `seller_requirement_files` (
  `id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `requirement_type` enum('barangayClearance','businessPermit','idProof') NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `uploaded_by` varchar(50) NOT NULL COMMENT 'admin_id or seller_id',
  `uploaded_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `store_hours`
--

CREATE TABLE `store_hours` (
  `id` int(11) NOT NULL,
  `seller_id` varchar(50) NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `is_open` tinyint(1) DEFAULT 1,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `store_hours`
--

INSERT INTO `store_hours` (`id`, `seller_id`, `day_of_week`, `is_open`, `open_time`, `close_time`, `created_at`, `updated_at`) VALUES
(43, 'SELLER-SG6500', 'Monday', 1, '09:00:00', '17:00:00', '2026-01-02 15:23:42', '2026-01-02 15:23:42'),
(44, 'SELLER-SG6500', 'Tuesday', 1, '09:00:00', '17:00:00', '2026-01-02 15:23:42', '2026-01-02 15:23:42'),
(45, 'SELLER-SG6500', 'Wednesday', 1, '09:00:00', '17:00:00', '2026-01-02 15:23:42', '2026-01-02 15:23:42'),
(46, 'SELLER-SG6500', 'Thursday', 1, '09:00:00', '17:00:00', '2026-01-02 15:23:42', '2026-01-02 15:23:42'),
(47, 'SELLER-SG6500', 'Friday', 1, '09:00:00', '00:00:00', '2026-01-02 15:23:42', '2026-01-02 15:23:42'),
(48, 'SELLER-SG6500', 'Saturday', 1, '00:00:00', '17:00:00', '2026-01-02 15:23:42', '2026-01-02 15:23:42'),
(49, 'SELLER-SG6500', 'Sunday', 1, '09:00:00', '17:00:00', '2026-01-02 15:23:42', '2026-01-02 15:23:42'),
(71, 'SELLER-QS2594', 'Monday', 1, '09:00:00', '22:00:00', '2026-02-07 09:10:46', '2026-02-07 09:10:46'),
(72, 'SELLER-QS2594', 'Tuesday', 1, '09:00:00', '17:00:00', '2026-02-07 09:10:46', '2026-02-07 09:10:46'),
(73, 'SELLER-QS2594', 'Wednesday', 1, '09:00:00', '00:00:00', '2026-02-07 09:10:46', '2026-02-07 09:10:46'),
(74, 'SELLER-QS2594', 'Thursday', 1, '09:00:00', '22:00:00', '2026-02-07 09:10:46', '2026-02-07 09:10:46'),
(75, 'SELLER-QS2594', 'Friday', 1, '09:00:00', '00:00:00', '2026-02-07 09:10:46', '2026-02-07 09:10:46'),
(76, 'SELLER-QS2594', 'Saturday', 1, '09:00:00', '00:00:00', '2026-02-07 09:10:46', '2026-02-07 09:10:46'),
(77, 'SELLER-QS2594', 'Sunday', 1, '09:00:00', '22:00:00', '2026-02-07 09:10:46', '2026-02-07 09:10:46');

-- --------------------------------------------------------

--
-- Table structure for table `system_feedback`
--

CREATE TABLE `system_feedback` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `user_type` enum('buyer','seller') NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_feedback`
--

INSERT INTO `system_feedback` (`id`, `user_id`, `user_type`, `rating`, `comment`, `created_at`) VALUES
(1, '2', 'buyer', 5, 'User friendly', '2025-12-27 07:22:45');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `buyer_authentication`
--
ALTER TABLE `buyer_authentication`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `buyer_notifications`
--
ALTER TABLE `buyer_notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cart_item` (`buyer_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `fish_categories`
--
ALTER TABLE `fish_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `fish_products`
--
ALTER TABLE `fish_products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `price_history`
--
ALTER TABLE `price_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sellers`
--
ALTER TABLE `sellers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_unique_id` (`unique_id`);

--
-- Indexes for table `seller_credentials`
--
ALTER TABLE `seller_credentials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `seller_feedback`
--
ALTER TABLE `seller_feedback`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_order_feedback` (`order_id`,`buyer_id`),
  ADD KEY `idx_seller_id` (`seller_id`),
  ADD KEY `idx_buyer_id` (`buyer_id`);

--
-- Indexes for table `seller_locations`
--
ALTER TABLE `seller_locations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_seller` (`seller_id`);

--
-- Indexes for table `seller_notifications`
--
ALTER TABLE `seller_notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `seller_profiles`
--
ALTER TABLE `seller_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_seller_id` (`seller_id`);

--
-- Indexes for table `seller_requirement_files`
--
ALTER TABLE `seller_requirement_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_seller_id` (`seller_id`);

--
-- Indexes for table `store_hours`
--
ALTER TABLE `store_hours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_seller_day` (`seller_id`,`day_of_week`);

--
-- Indexes for table `system_feedback`
--
ALTER TABLE `system_feedback`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `buyer_authentication`
--
ALTER TABLE `buyer_authentication`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `buyer_notifications`
--
ALTER TABLE `buyer_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `fish_categories`
--
ALTER TABLE `fish_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `fish_products`
--
ALTER TABLE `fish_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `price_history`
--
ALTER TABLE `price_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `sellers`
--
ALTER TABLE `sellers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `seller_credentials`
--
ALTER TABLE `seller_credentials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `seller_feedback`
--
ALTER TABLE `seller_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `seller_locations`
--
ALTER TABLE `seller_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `seller_notifications`
--
ALTER TABLE `seller_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `seller_profiles`
--
ALTER TABLE `seller_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `seller_requirement_files`
--
ALTER TABLE `seller_requirement_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `store_hours`
--
ALTER TABLE `store_hours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT for table `system_feedback`
--
ALTER TABLE `system_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `buyer_authentication` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `fish_products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_locations`
--
ALTER TABLE `seller_locations`
  ADD CONSTRAINT `fk_seller_location` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`unique_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `seller_requirement_files`
--
ALTER TABLE `seller_requirement_files`
  ADD CONSTRAINT `seller_requirement_files_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
