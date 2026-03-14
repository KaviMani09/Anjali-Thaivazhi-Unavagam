-- Anjali Thaivazhi Unavagam - MySQL Schema + Seed
-- Create DB
CREATE DATABASE IF NOT EXISTS anjali_restaurant
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE anjali_restaurant;

-- 1) menu_items
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category ENUM('morning','afternoon','night','snacks','juices') NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500) NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2) orders
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(20) NULL,
  items JSON NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(40) NOT NULL,
  order_type ENUM('dine-in','delivery') NOT NULL DEFAULT 'dine-in',
  status VARCHAR(40) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3) table_bookings
CREATE TABLE IF NOT EXISTS table_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120) NULL,
  date DATE NOT NULL,
  time VARCHAR(20) NOT NULL,
  guests INT NOT NULL,
  special_requests TEXT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4) catering_bookings
CREATE TABLE IF NOT EXISTS catering_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120) NULL,
  event_type VARCHAR(60) NOT NULL,
  event_date DATE NOT NULL,
  venue TEXT NOT NULL,
  guests_count INT NOT NULL,
  menu_preference VARCHAR(40) NOT NULL,
  budget DECIMAL(12,2) NULL,
  message TEXT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5) admin_users
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6) upi_ids (admin-managed UPI IDs for payment QR)
CREATE TABLE IF NOT EXISTS upi_ids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  upi_id VARCHAR(120) NOT NULL,
  label VARCHAR(80) NULL COMMENT 'e.g. Primary, Backup',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed default UPI ID if none exists
INSERT INTO upi_ids (upi_id, label, is_default)
SELECT 'anjali.restaurant@upi', 'Primary', 1
WHERE NOT EXISTS (SELECT 1 FROM upi_ids LIMIT 1);

-- 7) sales_report (view)
DROP VIEW IF EXISTS sales_report;
CREATE VIEW sales_report AS
SELECT
  DATE_FORMAT(created_at, '%Y-%m') AS month,
  SUM(total_amount) AS total,
  COUNT(*) AS orders
FROM orders
GROUP BY DATE_FORMAT(created_at, '%Y-%m');

-- Seed admin user (default: admin / admin123) - CHANGE AFTER SETUP
INSERT INTO admin_users (username, password_hash)
SELECT 'admin', '$2y$10$jjp81TNplZTHwbpv5iixReuo8Z/xhd0iaFgASii7r4rl3MZeAk5Wy'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username='admin');

-- Seed Menu Items
INSERT INTO menu_items (category, name, description, price, image_url, is_available)
SELECT * FROM (
  SELECT 'morning', 'Idly', 'Soft steamed rice cakes', 30.00,
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'morning', 'Poori', 'Fluffy poori with masala', 40.00,
    'https://images.unsplash.com/photo-1604909052743-94e09f3b0c7b?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'morning', 'Pongal', 'Ven pongal with ghee & pepper', 35.00,
    'https://images.unsplash.com/photo-1601050690294-397f3c324515?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'morning', 'Vada', 'Crispy medu vada', 25.00,
    'https://images.unsplash.com/photo-1610192244261-3f9e12d83a80?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'morning', 'Dosa', 'Crispy dosa served hot', 40.00,
    'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'morning', 'Upma', 'Light and tasty upma', 30.00,
    'https://images.unsplash.com/photo-1600626333392-87f635b16001?auto=format&fit=crop&w=1200&q=80', 1

  UNION ALL SELECT 'afternoon', 'Rice', 'Steamed rice', 60.00,
    'https://images.unsplash.com/photo-1604908554027-7a0a3a8c95b6?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'afternoon', 'Veg Meals', 'Traditional South Indian meals', 80.00,
    'https://images.unsplash.com/photo-1626078294432-7bbd5f3c2f24?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'afternoon', 'Chicken Curry', 'Spicy chicken curry', 120.00,
    'https://images.unsplash.com/photo-1604909053418-1aebfd9c3d55?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'afternoon', 'Fish Curry', 'Tangy fish curry', 130.00,
    'https://images.unsplash.com/photo-1625944525333-1e8bd5db8b7f?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'afternoon', 'Mutton Curry', 'Slow-cooked mutton curry', 150.00,
    'https://images.unsplash.com/photo-1628294895951-7f8e3d9b8a3a?auto=format&fit=crop&w=1200&q=80', 1

  UNION ALL SELECT 'night', 'Chicken Rice', 'Flavorful chicken rice', 100.00,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'night', 'Noodles', 'Street-style noodles', 80.00,
    'https://images.unsplash.com/photo-1604908177244-c6a2c8b6c8b2?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'night', 'Parotta', 'Flaky layered parotta (per piece)', 15.00,
    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'night', 'Dosa', 'Crispy dosa served hot', 40.00,
    'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'night', 'Egg Dosa', 'Dosa topped with egg', 50.00,
    'https://images.unsplash.com/photo-1608032077018-1b7ae6d1c44e?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'night', 'Kothu Parotta', 'Chopped parotta masala', 90.00,
    'https://images.unsplash.com/photo-1626078295706-6b3f9e4d9b9a?auto=format&fit=crop&w=1200&q=80', 1

  UNION ALL SELECT 'snacks', 'Tea', 'Hot tea', 15.00,
    'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'snacks', 'Coffee', 'Filter coffee', 20.00,
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'juices', 'Fresh Juice', 'Seasonal fresh juice', 40.00,
    'https://images.unsplash.com/photo-1542444459-db47a8bb7a52?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'snacks', 'Samosa', 'Crispy samosa', 20.00,
    'https://images.unsplash.com/photo-1617196039897-6e1f3d47779f?auto=format&fit=crop&w=1200&q=80', 1
  UNION ALL SELECT 'snacks', 'Bajji', 'Classic bajji', 15.00,
    'https://images.unsplash.com/photo-1604909052570-1c2c1d6a2b2a?auto=format&fit=crop&w=1200&q=80', 1
) AS seed
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items WHERE name = seed.name AND category = seed.category
);

