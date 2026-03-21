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
  $event_type = trim($data['event_type'] ?? '');
  $event_date = trim($data['event_date'] ?? '');
  $venue = trim($data['venue'] ?? '');
  $guests_count = intval($data['guests_count'] ?? 0);
  $menu_preference = trim($data['menu_preference'] ?? '');
  $budget = isset($data['budget']) && $data['budget'] !== null && $data['budget'] !== '' ? floatval($data['budget']) : 0.0;
  $message = trim($data['message'] ?? '');
  $status = 'Pending';

  if (!$name || !preg_match('/^\d{10}$/', $phone) || !$event_type || !$event_date || !$venue || $guests_count < 10) {
    json_error('Invalid data', 400);
  }

  $stmt = $conn->prepare('INSERT INTO catering_bookings (customer_name, phone, email, event_type, event_date, venue, guests_count, menu_preference, budget, message, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  $stmt->bind_param('ssssssisdss', $name, $phone, $email, $event_type, $event_date, $venue, $guests_count, $menu_preference, $budget, $message, $status);
  if (!$stmt->execute()) json_error('Insert failed', 500);
  json_ok(['id' => $conn->insert_id]);
}

if ($method === 'GET') {
  require_admin();
  $res = $conn->query('SELECT * FROM catering_bookings ORDER BY id DESC');
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
  $stmt = $conn->prepare('UPDATE catering_bookings SET status=? WHERE id=?');
  $stmt->bind_param('si', $status, $id);
  if (!$stmt->execute()) json_error('Update failed', 500);
  json_ok(['ok' => true]);
}

json_error('Method not allowed', 405);

