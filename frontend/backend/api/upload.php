<?php
require_once __DIR__ . '/_helpers.php';

cors();
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

if (!isset($_FILES['image'])) json_error('Missing file', 400);
$file = $_FILES['image'];
if ($file['error'] !== UPLOAD_ERR_OK) json_error('Upload error', 400);

$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
$type = mime_content_type($file['tmp_name']);
if (!isset($allowed[$type])) json_error('Unsupported image type', 400);

$ext = $allowed[$type];
$name = 'food_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;

$uploadDir = realpath(__DIR__ . '/../uploads');
if (!$uploadDir) {
  $targetDir = __DIR__ . '/../uploads';
  if (!mkdir($targetDir, 0755, true)) json_error('Cannot create uploads dir', 500);
  $uploadDir = realpath($targetDir);
}

$dest = $uploadDir . DIRECTORY_SEPARATOR . $name;
if (!move_uploaded_file($file['tmp_name'], $dest)) json_error('Save failed', 500);

// Build a URL that works both for:
// - PHP built-in server:     http://localhost:8000/api/upload.php
//   → images at              http://localhost:8000/uploads/...
// - XAMPP/Apache:            http://localhost/anjali-restaurant/backend/api/upload.php
//   → images at              http://localhost/anjali-restaurant/backend/uploads/...
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '/api'); // e.g. "/api" or "/anjali-restaurant/backend/api"
$basePath = rtrim(preg_replace('#/api/?$#', '/uploads', $scriptDir), '/');
$path = $basePath . '/' . $name;
$image_url = $scheme . '://' . $host . $path;

json_ok(['image_url' => $image_url]);

