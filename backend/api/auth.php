<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/db.php';

cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$data = read_json();
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (!$username || !$password) json_error('Missing credentials', 400);

$stmt = $conn->prepare('SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1');
$stmt or json_error('Database not initialized. Import database.sql and verify admin_users table exists.', 500);
$stmt->bind_param('s', $username);
if (!$stmt->execute()) json_error($stmt->error ?: 'Query failed', 500);
$res = $stmt->get_result();
$row = $res ? $res->fetch_assoc() : null;

if (!$row || !password_verify($password, $row['password_hash'])) {
  json_error('Invalid credentials', 401);
}

$token = make_token($row['username'], 60 * 60 * 24 * 7); // 7 days
json_ok(['token' => $token, 'username' => $row['username']]);

