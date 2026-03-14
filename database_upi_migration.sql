-- Add upi_ids table (run this if UPI tab says "Table upi_ids not found")
-- Use your database: USE anjali_restaurant;

CREATE TABLE IF NOT EXISTS upi_ids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  upi_id VARCHAR(120) NOT NULL,
  label VARCHAR(80) NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO upi_ids (upi_id, label, is_default)
SELECT 'anjali.restaurant@upi', 'Primary', 1
WHERE NOT EXISTS (SELECT 1 FROM upi_ids LIMIT 1);
