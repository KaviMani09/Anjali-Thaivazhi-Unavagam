<?php

function cors() {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

function read_json() {
  $raw = file_get_contents('php://input');
  if ($raw) {
    $data = json_decode($raw, true);
    if (is_array($data)) return $data;
  }
  // Fallback for non-JSON requests (form posts)
  return is_array($_POST) ? $_POST : [];
}

function json_ok($data) {
  echo json_encode($data);
  exit;
}

function json_error($message, $code = 400) {
  http_response_code($code);
  echo json_encode(['error' => $message]);
  exit;
}

// Simple stateless admin token:
// base64url({"u":"admin","exp":<unix>,"sig":"<hmac>"})
function auth_secret() {
  $env = getenv('ADMIN_SECRET');
  if ($env && strlen($env) >= 16) return $env;
  // Fallback for local/dev; override via ADMIN_SECRET env in production.
  return 'CHANGE_ME_SUPER_SECRET';
}

function base64url_encode($data) {
  return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
  $data = strtr($data, '-_', '+/');
  $pad = strlen($data) % 4;
  if ($pad) $data .= str_repeat('=', 4 - $pad);
  return base64_decode($data);
}

function make_token($username, $ttl_seconds = 86400) {
  $exp = time() + $ttl_seconds;
  $payload = ['u' => $username, 'exp' => $exp];
  $sig = hash_hmac('sha256', $username . '|' . $exp, auth_secret());
  $payload['sig'] = $sig;
  return base64url_encode(json_encode($payload));
}

function require_admin() {
  $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!$hdr || stripos($hdr, 'Bearer ') !== 0) json_error('Unauthorized', 401);
  $token = trim(substr($hdr, 7));
  $decoded = base64url_decode($token);
  $payload = json_decode($decoded, true);
  if (!is_array($payload)) json_error('Unauthorized', 401);
  $u = $payload['u'] ?? '';
  $exp = $payload['exp'] ?? 0;
  $sig = $payload['sig'] ?? '';
  if (!$u || !$exp || !$sig) json_error('Unauthorized', 401);
  if (time() > intval($exp)) json_error('Token expired', 401);
  $expected = hash_hmac('sha256', $u . '|' . $exp, auth_secret());
  if (!hash_equals($expected, $sig)) json_error('Unauthorized', 401);
  return $u;
}

