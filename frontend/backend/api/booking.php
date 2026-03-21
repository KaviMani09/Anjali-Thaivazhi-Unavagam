<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/db.php';

cors();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
  $data = read_json();
  $name = trim($data['customer_name'] ?? '');
  $phone = trim($data['phone'] ?? '');
  $email = trim($data['email'] ?? '');
  $date = trim($data['date'] ?? '');
  $time = trim($data['time'] ?? '');
  $guests = intval($data['guests'] ?? 0);
  $special = trim($data['special_requests'] ?? '');
  if (!$name || !preg_match('/^\d{10}$/', $phone) || !$date || !$time || $guests < 1 || $guests > 50) {
    json_error('Invalid data', 400);
  }

  $status = 'Pending';
  $stmt = $conn->prepare('INSERT INTO table_bookings (customer_name, phone, email, date, time, guests, special_requests, status) VALUES (?,?,?,?,?,?,?,?)');
  $stmt->bind_param('ssssisss', $name, $phone, $email, $date, $time, $guests, $special, $status);
  if (!$stmt->execute()) json_error('Insert failed', 500);
  json_ok(['id' => $conn->insert_id]);
}

if ($method === 'GET') {
  require_admin();
  $res = $conn->query('SELECT * FROM table_bookings ORDER BY id DESC');
  $rows = [];
  while ($r = $res->fetch_assoc()) $rows[] = $r;
  json_ok(['bookings' => $rows]);
}

if ($method === 'PUT') {
  require_admin();
  $data = read_json();
  $id = intval($data['id'] ?? 0);
  $status = trim($data['status'] ?? '');
  if ($id <= 0 || !$status) json_error('Invalid data', 400);
  $stmt = $conn->prepare('UPDATE table_bookings SET status=? WHERE id=?');
  $stmt->bind_param('si', $status, $id);
  if (!$stmt->execute()) json_error('Update failed', 500);
  json_ok(['ok' => true]);
}

json_error('Method not allowed', 405);

