-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 05, 2025 at 01:33 PM
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
(1, 'Freshwater', 'SELL-GFGDHQ', '2025-11-22 09:31:30'),
(2, 'Saltwater', 'SELL-GFGDHQ', '2025-11-22 09:31:30'),
(3, 'Shellfish', 'SELL-GFGDHQ', '2025-11-22 09:31:30'),
(4, 'Crustaceans', 'SELL-GFGDHQ', '2025-11-22 09:31:30'),
(5, 'Premium Fish', 'SELL-GFGDHQ', '2025-11-22 09:31:30'),
(6, 'Freshwater', 'SELL-7LED1Z', '2025-11-23 07:39:17'),
(7, 'Saltwater', 'SELL-7LED1Z', '2025-11-23 07:39:17'),
(8, 'Shellfish', 'SELL-7LED1Z', '2025-11-23 07:39:17'),
(9, 'Crustaceans', 'SELL-7LED1Z', '2025-11-23 07:39:17'),
(10, 'Premium Fish', 'SELL-7LED1Z', '2025-11-23 07:39:17'),
(51, 'Freshwater', 'SELL-7H8FD1', '2025-11-28 03:26:08'),
(52, 'Saltwater', 'SELL-7H8FD1', '2025-11-28 03:26:08'),
(53, 'Shellfish', 'SELL-7H8FD1', '2025-11-28 03:26:08'),
(54, 'Crustaceans', 'SELL-7H8FD1', '2025-11-28 03:26:08'),
(55, 'Premium Fish', 'SELL-7H8FD1', '2025-11-28 03:26:08'),
(56, 'ASD', 'SELL-GFGDHQ', '2025-12-02 14:06:53');

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
  `freshness` enum('Fresh','Chilled','Frozen') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fish_products`
--

INSERT INTO `fish_products` (`id`, `name`, `category`, `unit`, `price`, `previous_price`, `stock`, `image_url`, `seller_id`, `created_at`, `freshness`) VALUES
(6, 'lapu-lapu', 'Saltwater', 'kg', 400.00, 400.00, 2, '1763831019396-tilapia.jpg', 'SELL-GFGDHQ', '2025-11-16 15:23:06', 'Fresh'),
(7, 'salmon', 'Saltwater', 'kg', 160.00, NULL, 6, '1763525116684-sea-merkado-logo.png', 'SELL-7LED1Z', '2025-11-19 04:04:21', 'Fresh'),
(8, 'fish', 'Saltwater', 'kg', 100.00, 100.00, 49, '1763830997168-tilapia.jpg', 'SELL-GFGDHQ', '2025-11-19 07:12:38', 'Fresh'),
(9, 'hhh', 'Shellfish', 'kg', 130.00, 120.00, 6, '1763830974903-tilapia.jpg', 'SELL-GFGDHQ', '2025-11-19 10:26:46', 'Fresh'),
(10, 'aaaaaa', 'Freshwater', 'kg', 200.00, 210.00, 18, '1763830947773-tilapia.jpg', 'SELL-GFGDHQ', '2025-11-20 07:06:00', 'Fresh'),
(11, 'ccccc', 'Freshwater', 'kg', 160.00, 155.00, 0, '1763830920234-tilapia.jpg', 'SELL-GFGDHQ', '2025-11-22 09:37:59', 'Fresh'),
(12, 'Tilapia', 'Freshwater', 'kg', 140.00, 130.00, 6, '1763830898903-tilapia.jpg', 'SELL-GFGDHQ', '2025-11-22 16:27:34', 'Fresh'),
(13, 'Tilapia', 'Freshwater', 'kg', 153.33, 160.00, 16, '1763830577822-tilapia.jpg', 'SELL-GFGDHQ', '2025-11-22 16:45:14', 'Fresh'),
(14, 'Jc David 1', 'Crustaceans', 'kg', 51.51, 50.01, 6, '1764684984300-Screenshot_2025-12-02_at_9.48.14Ã¢Â€Â¯PM.png', 'SELL-GFGDHQ', '2025-12-02 14:16:24', 'Fresh');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `seller_id` varchar(50) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
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

INSERT INTO `orders` (`id`, `seller_id`, `customer_name`, `address`, `contact`, `customer_id`, `notes`, `total`, `payment_mode`, `paid`, `proof_of_payment`, `order_date`, `status`) VALUES
(31, 'SELL-GFGDHQ', 'Juancarlo David', 'Loraine Street\nParkway', '09565535410', 'KathrineClosa09517397968', '', 400.00, 'Gcash QR', 1, '/uploads/1764402037143-dora.jpg', '2025-11-29 07:40:37', 'Preparing'),
(32, 'SELL-GFGDHQ', 'Juancarlo David', 'Loraine Street\nParkway', '09565535401', 'KianAndreiPortes09090909090', '', 400.00, 'Gcash QR', 1, '/uploads/1764423720651-eef3949c-5ce1-4c0d-ae91-db71d20b3e61.jpeg', '2025-11-29 13:42:00', 'Completed'),
(34, 'SELL-GFGDHQ', 'Juancarlo David', 'Loraine Street\nParkway', '09565535401', 'KianAndreiPortes09090909090', '', 400.00, 'Gcash QR', 1, '/uploads/1764638837627-dora.jpg', '2025-12-02 01:27:17', 'Pending'),
(35, 'SELL-GFGDHQ', 'Juancarlo David', 'Loraine Street\nParkway', '09565535401', 'KianAndreiPortes09090909090', '', 100.00, 'Gcash QR', 1, '/uploads/1764638911586-eef3949c-5ce1-4c0d-ae91-db71d20b3e61.jpeg', '2025-12-02 01:28:31', 'Pending'),
(36, 'SELL-GFGDHQ', 'Juancarlo David', 'Loraine Street\nParkway', '09565535401', 'KianAndreiPortes09090909090', '', 122.00, 'Gcash QR', 1, '/uploads/1764638962425-dora.jpg', '2025-12-02 01:29:22', 'Pending'),
(37, 'SELL-7LED1Z', 'Juancarlo David', 'Loraine Street\nParkway', '09565535401', 'KianAndreiPortes09090909090', '', 160.00, 'Gcash QR', 1, '/uploads/1764639010758-dora.jpg', '2025-12-02 01:30:10', 'Pending'),
(38, 'SELL-GFGDHQ', 'Juancarlo David', 'Loraine Street\nParkway', '09565535401', 'KianAndreiPortes09090909090', '', 153.33, 'Gcash QR', 1, '/uploads/1764639097957-dora.jpg', '2025-12-02 01:31:37', 'Pending');

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
(31, 31, 6, 1, 400.00),
(32, 32, 6, 1, 400.00),
(36, 34, 6, 1, 400.00),
(37, 35, 8, 1, 100.00),
(38, 36, 9, 1, 122.00),
(39, 37, 7, 1, 160.00),
(40, 38, 13, 1, 153.33);

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
(1, 13, 'SELL-GFGDHQ', 120.00, 140.00, '2025-11-24 06:40:11'),
(2, 13, 'SELL-GFGDHQ', 140.00, 160.00, '2025-11-24 06:40:29'),
(3, 13, 'SELL-GFGDHQ', 160.00, 153.33, '2025-11-24 06:42:07'),
(4, 11, 'SELL-GFGDHQ', 150.00, 155.00, '2025-11-24 07:47:10'),
(5, 11, 'SELL-GFGDHQ', 155.00, 160.00, '2025-11-24 07:47:26'),
(6, 12, 'SELL-GFGDHQ', 120.00, 130.00, '2025-11-26 01:51:15'),
(7, 12, 'SELL-GFGDHQ', 130.00, 140.00, '2025-11-26 01:51:37'),
(8, 14, 'SELL-GFGDHQ', 99.97, 50.00, '2025-12-02 14:55:48'),
(9, 14, 'SELL-GFGDHQ', 50.00, 50.01, '2025-12-03 04:47:52'),
(10, 14, 'SELL-GFGDHQ', 50.01, 51.51, '2025-12-03 05:31:12'),
(11, 10, 'SELL-GFGDHQ', 222.00, 210.00, '2025-12-03 05:32:49'),
(12, 10, 'SELL-GFGDHQ', 210.00, 200.00, '2025-12-03 05:32:58'),
(13, 9, 'SELL-GFGDHQ', 122.00, 120.00, '2025-12-04 07:38:48'),
(14, 9, 'SELL-GFGDHQ', 120.00, 130.00, '2025-12-04 07:40:47');

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

-- --------------------------------------------------------

--
-- Table structure for table `seller_credentials`
--

CREATE TABLE `seller_credentials` (
  `id` int(11) NOT NULL,
  `unique_id` varchar(15) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `date_registered` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `seller_credentials`
--

INSERT INTO `seller_credentials` (`id`, `unique_id`, `email`, `password_hash`, `date_registered`) VALUES
(1, 'SELL-ZQ0Z5K', 'catherinegraceclosa@gmail.com', '$2b$10$gXZiWpUua7Gce39iTDpxdeoIw1yMwkzbtqOaVZkdaKUmG1nIOJ6/.', '2025-11-11 07:51:19'),
(2, 'SELL-GFGDHQ', 'kian@gmail.com', '$2b$10$GC69jjr2p8Ty6LRtYmoGsexVtin8xPthi/s5KlTlTpy2MnYwBIhAy', '2025-11-15 15:37:05'),
(3, 'SELL-7LED1Z', 'kian123@gmail.com', '$2b$10$gXglwI4dKMRDl2tZrW68muNxqFX1Pz4z2l3q0mP8/3y4bKuXid2g.', '2025-11-19 04:00:03'),
(4, 'SELL-7H8FD1', 'jean@gmail.com', '$2b$10$hCT8NoekvrJ6kLGCm5p/8Oy1IJQJtq2LCS6W2RaMDJKA09HVLaSDy', '2025-11-28 03:26:08');

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
(18, 'SELL-GFGDHQ', 'You have a new order (#31) from Juancarlo David.', 'order', 0, '2025-11-29 07:40:37'),
(19, 'SELL-GFGDHQ', 'You have a new order (#32) from Juancarlo David.', 'order', 0, '2025-11-29 13:42:00'),
(20, 'SELL-GFGDHQ', 'You have a new order (#33) from Juancarlo David.', 'order', 0, '2025-12-02 01:21:30'),
(21, 'SELL-GFGDHQ', 'You have a new order (#34) from Juancarlo David.', 'order', 0, '2025-12-02 01:27:17'),
(22, 'SELL-GFGDHQ', 'You have a new order (#35) from Juancarlo David.', 'order', 0, '2025-12-02 01:28:31'),
(23, 'SELL-GFGDHQ', 'You have a new order (#36) from Juancarlo David.', 'order', 0, '2025-12-02 01:29:22'),
(24, 'SELL-7LED1Z', 'You have a new order (#37) from Juancarlo David.', 'order', 0, '2025-12-02 01:30:10'),
(25, 'SELL-GFGDHQ', 'You have a new order (#38) from Juancarlo David.', 'order', 0, '2025-12-02 01:31:37');

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
(1, 'SELL-GFGDHQ', '/uploads/1764741573081-1763954589043-shop_logo.jpg', '/uploads/1764742012626-front_landscape.jpg', '2025-11-22 11:29:06', '2025-12-03 06:06:52'),
(3, 'SELL-7LED1Z', '/uploads/1763954589043-shop_logo.jpg', NULL, '2025-11-24 03:23:09', '2025-11-24 03:23:09');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
