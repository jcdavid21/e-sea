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
-- Database: `seller_auth_db`
--

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
(17, 'KathrineClosa09517397968', 31, 'SELL-GFGDHQ', 'Your order #31 status has been updated to: Completed', 1, '2025-11-29 07:55:32'),
(18, 'KathrineClosa09517397968', 31, 'SELL-GFGDHQ', 'Your order #31 status has been updated to: Preparing', 1, '2025-11-29 12:03:37'),
(19, 'KianAndreiPortes09090909090', 32, 'SELL-GFGDHQ', 'Your order #32 status has been updated to: Preparing', 0, '2025-12-02 13:12:29'),
(20, 'KianAndreiPortes09090909090', 32, 'SELL-GFGDHQ', 'Your order #32 status has been updated to: Pending', 0, '2025-12-02 13:12:37'),
(21, 'KianAndreiPortes09090909090', 32, 'SELL-GFGDHQ', 'Your order #32 status has been updated to: Preparing', 0, '2025-12-02 15:10:19'),
(22, 'KianAndreiPortes09090909090', 32, 'SELL-GFGDHQ', 'Your order #32 status has been updated to: Completed', 0, '2025-12-02 15:45:33');

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
(14, 'Jc David 1', 'Crustaceans', 'kg', 51.51, 50.01, 6, '1764684984300-Screenshot_2025-12-02_at_9.48.14â¯PM.png', 'SELL-GFGDHQ', '2025-12-02 14:16:24', 'Fresh');

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

--
-- Indexes for dumped tables
--

--
-- Indexes for table `buyer_notifications`
--
ALTER TABLE `buyer_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer` (`customer_id`),
  ADD KEY `idx_order` (`order_id`),
  ADD KEY `idx_read` (`is_read`);

--
-- Indexes for table `fish_categories`
--
ALTER TABLE `fish_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_per_seller` (`category_name`,`seller_id`),
  ADD KEY `fk_category_seller` (`seller_id`);

--
-- Indexes for table `fish_products`
--
ALTER TABLE `fish_products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orders_seller` (`seller_id`),
  ADD KEY `idx_customer_id` (`customer_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `price_history`
--
ALTER TABLE `price_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `seller_id` (`seller_id`);

--
-- Indexes for table `seller_credentials`
--
ALTER TABLE `seller_credentials`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_id` (`unique_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `unique_id_2` (`unique_id`);

--
-- Indexes for table `seller_notifications`
--
ALTER TABLE `seller_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_seller_id` (`seller_id`),
  ADD KEY `idx_is_read` (`is_read`);

--
-- Indexes for table `seller_profiles`
--
ALTER TABLE `seller_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `seller_id` (`seller_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `buyer_notifications`
--
ALTER TABLE `buyer_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `fish_categories`
--
ALTER TABLE `fish_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `fish_products`
--
ALTER TABLE `fish_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `price_history`
--
ALTER TABLE `price_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `seller_credentials`
--
ALTER TABLE `seller_credentials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `seller_notifications`
--
ALTER TABLE `seller_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `seller_profiles`
--
ALTER TABLE `seller_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `fish_categories`
--
ALTER TABLE `fish_categories`
  ADD CONSTRAINT `fk_category_seller` FOREIGN KEY (`seller_id`) REFERENCES `seller_credentials` (`unique_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_seller` FOREIGN KEY (`seller_id`) REFERENCES `seller_credentials` (`unique_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `fish_products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `price_history`
--
ALTER TABLE `price_history`
  ADD CONSTRAINT `price_history_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `fish_products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `price_history_ibfk_2` FOREIGN KEY (`seller_id`) REFERENCES `seller_credentials` (`unique_id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_notifications`
--
ALTER TABLE `seller_notifications`
  ADD CONSTRAINT `seller_notifications_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `seller_credentials` (`unique_id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_profiles`
--
ALTER TABLE `seller_profiles`
  ADD CONSTRAINT `fk_profile_seller` FOREIGN KEY (`seller_id`) REFERENCES `seller_credentials` (`unique_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
