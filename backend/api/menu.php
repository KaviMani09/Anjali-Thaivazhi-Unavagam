<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/db.php';

cors();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $category = isset($_GET['category']) ? trim($_GET['category']) : '';
  if ($category) {
    $stmt = $conn->prepare('SELECT * FROM menu_items WHERE category = ? ORDER BY id DESC');
  } else {
    $stmt = $conn->prepare('SELECT * FROM menu_items ORDER BY id DESC');
  }
  if (!$stmt) json_error('Database not initialized. Import database.sql and verify menu_items table exists.', 500);
  if ($category) {
    $stmt->bind_param('s', $category);
  }
  if (!$stmt->execute()) {
    $err = $stmt->error ?: 'Query failed. Import database.sql and verify menu_items table exists.';
    json_error($err, 500);
  }
  $res = $stmt->get_result();
  $items = [];
  while ($row = $res->fetch_assoc()) {
    $row['is_available'] = intval($row['is_available']);
    $items[] = $row;
  }
  json_ok(['items' => $items]);
}

if ($method === 'POST') {
  require_admin();
  $data = read_json();
  $category = trim($data['category'] ?? '');
  $name = trim($data['name'] ?? '');
  $description = trim($data['description'] ?? '');
  $price = floatval($data['price'] ?? 0);
  $image_url = trim($data['image_url'] ?? '');
  $is_available = intval($data['is_available'] ?? 1);

  if (!$category || !$name || $price <= 0) json_error('Invalid data', 400);

  $stmt = $conn->prepare('INSERT INTO menu_items (category, name, description, price, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?)');
  $stmt->bind_param('sssdsi', $category, $name, $description, $price, $image_url, $is_available);
  if (!$stmt->execute()) json_error('Insert failed', 500);
  json_ok(['id' => $conn->insert_id]);
}

if ($method === 'PUT') {
  require_admin();
  $data = read_json();
  $id = intval($data['id'] ?? 0);
  if ($id <= 0) json_error('Missing id', 400);

  $category = trim($data['category'] ?? '');
  $name = trim($data['name'] ?? '');
  $description = trim($data['description'] ?? '');
  $price = floatval($data['price'] ?? 0);
  $image_url = trim($data['image_url'] ?? '');
  $is_available = intval($data['is_available'] ?? 1);
  if (!$category || !$name || $price <= 0) json_error('Invalid data', 400);

  $stmt = $conn->prepare('UPDATE menu_items SET category=?, name=?, description=?, price=?, image_url=?, is_available=? WHERE id=?');
  $stmt->bind_param('sssdsii', $category, $name, $description, $price, $image_url, $is_available, $id);
  if (!$stmt->execute()) json_error('Update failed', 500);
  json_ok(['ok' => true]);
}

if ($method === 'DELETE') {
  require_admin();
  $data = read_json();
  $id = intval($data['id'] ?? 0);
  if ($id <= 0) json_error('Missing id', 400);
  $stmt = $conn->prepare('DELETE FROM menu_items WHERE id=?');
  $stmt->bind_param('i', $id);
  if (!$stmt->execute()) json_error('Delete failed', 500);
  json_ok(['ok' => true]);
}

json_error('Method not allowed', 405);

