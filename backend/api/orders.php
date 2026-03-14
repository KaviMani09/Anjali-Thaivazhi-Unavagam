<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/db.php';

cors();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
  $data = read_json();
  $customer_name = trim($data['customer_name'] ?? '');
  $customer_phone = trim($data['customer_phone'] ?? '');
  $items = $data['items'] ?? [];
  $total_amount = floatval($data['total_amount'] ?? 0);
  $payment_method = trim($data['payment_method'] ?? 'Cash');
  $order_type = trim($data['order_type'] ?? 'dine-in');
  $status = trim($data['status'] ?? 'Pending');

  if (!$customer_name) $customer_name = 'Customer';
  if ($customer_phone && !preg_match('/^\d{10}$/', $customer_phone)) $customer_phone = 'NA';
  if (!is_array($items) || count($items) === 0) json_error('Cart is empty', 400);
  if ($total_amount <= 0) json_error('Invalid total', 400);

  $items_json = json_encode($items, JSON_UNESCAPED_UNICODE);

  $stmt = $conn->prepare('INSERT INTO orders (customer_name, customer_phone, items, total_amount, payment_method, order_type, status) VALUES (?,?,?,?,?,?,?)');
  $stmt->bind_param('sssdsss', $customer_name, $customer_phone, $items_json, $total_amount, $payment_method, $order_type, $status);
  if (!$stmt->execute()) json_error('Insert failed', 500);
  json_ok(['id' => $conn->insert_id]);
}

if ($method === 'GET') {
  require_admin();
  $res = $conn->query('SELECT * FROM orders ORDER BY id DESC');
  $rows = [];
  while ($r = $res->fetch_assoc()) $rows[] = $r;
  json_ok(['orders' => $rows]);
}

if ($method === 'PUT') {
  require_admin();
  $data = read_json();
  $id = intval($data['id'] ?? 0);
  $status = trim($data['status'] ?? '');
  if ($id <= 0 || !$status) json_error('Invalid data', 400);
  $stmt = $conn->prepare('UPDATE orders SET status=? WHERE id=?');
  $stmt->bind_param('si', $status, $id);
  if (!$stmt->execute()) json_error('Update failed', 500);
  json_ok(['ok' => true]);
}

json_error('Method not allowed', 405);

