<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');
error_reporting(0);

$host = getenv('DB_HOST') ?: '127.0.0.1';
$db = getenv('DB_NAME') ?: 'anjali_restaurant';
$user = getenv('DB_USER') ?: 'root';
// XAMPP/WAMP defaults typically use an empty root password.
$pass = getenv('DB_PASS');
if ($pass === false) $pass = 'Manikandan@27';
$portEnv = getenv('DB_PORT');
$port = $portEnv !== false ? intval($portEnv) : 3306;

mysqli_report(MYSQLI_REPORT_OFF);

try {
  $conn = @new mysqli($host, $user, $pass, $db, $port);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'error' => 'DB connection failed. Start MySQL and verify credentials in backend/config/db.php',
    'details' => $e->getMessage(),
  ]);
  exit;
}
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode([
    'error' => 'DB connection failed. Start MySQL and verify credentials in backend/config/db.php',
    'details' => $conn->connect_error,
    'target' => ['host' => $host, 'port' => $port, 'db' => $db, 'user' => $user],
  ]);
  exit;
}

$conn->set_charset('utf8mb4');

