-- MySQL Database Creation Script for Expense Tracker
-- Execute this script in phpMyAdmin or MySQL Command Line in XAMPP

CREATE DATABASE IF NOT EXISTS `expense_tracker_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `expense_tracker_db`;

-- --------------------------------------------------------
-- Table structure for table `categories`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(10) NOT NULL DEFAULT '📦',
  `color` VARCHAR(50) NOT NULL DEFAULT 'Blue',
  `description` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data for `categories`
INSERT INTO `categories` (`id`, `name`, `icon`, `color`, `description`, `status`) VALUES
(1, 'Food', '🍔', 'Green', 'Daily food expenses', 'Active'),
(2, 'Shopping', '🛍', 'Blue', 'Clothes and accessories', 'Active'),
(3, 'Travel', '🚌', 'Orange', 'Travel expenses', 'Active'),
(4, 'Medical', '💊', 'Red', 'Medicine and hospital', 'Active'),
(5, 'Bills', '💡', 'Yellow', 'Electricity, Water, Internet', 'Active'),
(6, 'Entertainment', '🎬', 'Purple', 'Movies and games', 'Active'),
(7, 'Education', '📚', 'Blue', 'Tuition, books, and online courses', 'Active'),
(8, 'Other', '📦', 'Grey', 'Miscellaneous personal expenses', 'Active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- --------------------------------------------------------
-- Table structure for table `expenses`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `amount` DECIMAL(10,2) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `description` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Paid',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data for `expenses`
INSERT INTO `expenses` (`id`, `amount`, `category`, `payment_method`, `date`, `description`, `status`) VALUES
(1, 250.00, 'Food', 'UPI', '2026-07-21', 'Lunch', 'Paid'),
(2, 120.00, 'Travel', 'Cash', '2026-07-22', 'Bus Ticket', 'Paid'),
(3, 950.00, 'Shopping', 'Credit Card', '2026-07-24', 'T-Shirt', 'Paid'),
(4, 450.00, 'Medical', 'UPI', '2026-07-25', 'Medicine', 'Paid')
ON DUPLICATE KEY UPDATE `amount` = VALUES(`amount`);

-- --------------------------------------------------------
-- Table structure for table `income`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `income` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `amount` DECIMAL(10,2) NOT NULL,
  `source` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data for `income`
INSERT INTO `income` (`id`, `amount`, `source`, `date`, `description`) VALUES
(1, 25000.00, 'Salary', '2026-07-20', 'Monthly Salary'),
(2, 5000.00, 'Freelancing', '2026-07-25', 'Website Project'),
(3, 3000.00, 'Bonus', '2026-07-28', 'Performance Bonus')
ON DUPLICATE KEY UPDATE `amount` = VALUES(`amount`);

-- --------------------------------------------------------
-- Table structure for table `settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `date_format` VARCHAR(20) NOT NULL DEFAULT 'DD-MM-YYYY',
  `budget_limit` DECIMAL(10,2) NOT NULL DEFAULT 20000.00,
  `email_notifications` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data for `settings`
INSERT INTO `settings` (`id`, `currency`, `date_format`, `budget_limit`, `email_notifications`) VALUES
(1, 'INR', 'DD-MM-YYYY', 20000.00, 1)
ON DUPLICATE KEY UPDATE `currency` = VALUES(`currency`);
