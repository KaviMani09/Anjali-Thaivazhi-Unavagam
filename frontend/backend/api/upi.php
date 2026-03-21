<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/db.php';

cors();

// Create upi_ids table if it doesn't exist (auto-migration)
function ensure_upi_ids_table($conn) {
  $conn->query("CREATE TABLE IF NOT EXISTS upi_ids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    upi_id VARCHAR(120) NOT NULL,
    label VARCHAR(80) NULL,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB");
  $res = $conn->query("SELECT 1 FROM upi_ids LIMIT 1");
  if ($res && $res->num_rows === 0) {
    $conn->query("INSERT INTO upi_ids (upi_id, label, is_default) VALUES ('anjali.restaurant@upi', 'Primary', 1)");
  }
}

ensure_upi_ids_table($conn);

$method = $_SERVER['REQUEST_METHOD'];

// GET: public returns default UPI ID for billing; ?list=all with admin auth returns all
if ($method === 'GET') {
  $list_all = isset($_GET['list']) && $_GET['list'] === 'all';

  if ($list_all) {
    require_admin();
    $res = $conn->query('SELECT id, upi_id, label, is_default, created_at FROM upi_ids ORDER BY is_default DESC, id ASC');
    if (!$res) {
      ensure_upi_ids_table($conn);
      $res = $conn->query('SELECT id, upi_id, label, is_default, created_at FROM upi_ids ORDER BY is_default DESC, id ASC');
    }
    if (!$res) json_error('Table upi_ids not found. Run database.sql migration.', 500);
    $rows = [];
    while ($row = $res->fetch_assoc()) {
      $row['is_default'] = (int) $row['is_default'];
      $rows[] = $row;
    }
    json_ok(['upi_ids' => $rows]);
  }

  // Public: return default UPI ID for QR/billing
  $res = $conn->query("SELECT upi_id FROM upi_ids WHERE is_default = 1 LIMIT 1");
  if (!$res) {
    ensure_upi_ids_table($conn);
    $res = $conn->query("SELECT upi_id FROM upi_ids WHERE is_default = 1 LIMIT 1");
  }
  $row = $res ? $res->fetch_assoc() : null;
  if ($row) {
    json_ok(['upi_id' => $row['upi_id']]);
  }
  json_ok(['upi_id' => '']);
}

if ($method === 'POST') {
  require_admin();
  $data = read_json();
  $upi_id = trim($data['upi_id'] ?? '');
  $label = trim($data['label'] ?? '');
  $is_default = isset($data['is_default']) ? (int) $data['is_default'] : 0;

  if ($upi_id === '') json_error('UPI ID is required', 400);
  if (!preg_match('/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/', $upi_id)) json_error('Invalid UPI ID format', 400);

  if ($is_default) {
    $conn->query('UPDATE upi_ids SET is_default = 0');
  }
  $stmt = $conn->prepare('INSERT INTO upi_ids (upi_id, label, is_default) VALUES (?, ?, ?)');
  $stmt->bind_param('ssi', $upi_id, $label, $is_default);
  if (!$stmt->execute()) json_error('Insert failed', 500);
  json_ok(['id' => $conn->insert_id]);
}

if ($method === 'PUT') {
  require_admin();
  $data = read_json();
  $id = (int) ($data['id'] ?? 0);
  if ($id <= 0) json_error('Missing or invalid id', 400);

  $upi_id = trim($data['upi_id'] ?? '');
  $label = trim($data['label'] ?? '');
  $is_default = isset($data['is_default']) ? (int) $data['is_default'] : 0;

  if ($upi_id === '') json_error('UPI ID is required', 400);
  if (!preg_match('/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/', $upi_id)) json_error('Invalid UPI ID format', 400);

  if ($is_default) {
    $conn->query('UPDATE upi_ids SET is_default = 0');
  }
  $stmt = $conn->prepare('UPDATE upi_ids SET upi_id = ?, label = ?, is_default = ? WHERE id = ?');
  $stmt->bind_param('ssii', $upi_id, $label, $is_default, $id);
  if (!$stmt->execute()) json_error('Update failed', 500);
  json_ok(['ok' => true]);
}

if ($method === 'DELETE') {
  require_admin();
  $data = read_json();
  $id = (int) ($data['id'] ?? 0);
  if ($id <= 0) json_error('Missing or invalid id', 400);

  $stmt = $conn->prepare('DELETE FROM upi_ids WHERE id = ?');
  $stmt->bind_param('i', $id);
  if (!$stmt->execute()) json_error('Delete failed', 500);
  if ($stmt->affected_rows === 0) json_error('Not found', 404);
  json_ok(['ok' => true]);
}

json_error('Method not allowed', 405);
