<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/db.php';

cors();

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
  json_error('Method not allowed', 405);
}

$data = read_json();
$action = isset($data['action']) ? trim($data['action']) : 'order';

// Load Razorpay credentials from environment.
$razorpayKeyId = getenv('RAZORPAY_KEY_ID') ?: '';
$razorpayKeySecret = getenv('RAZORPAY_KEY_SECRET') ?: '';

if (!$razorpayKeyId || !$razorpayKeySecret) {
  json_error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your server environment.', 500);
}

if ($action === 'order') {
  // Create a Razorpay order for a given internal order + amount.
  $orderId = intval($data['order_id'] ?? 0);
  $amount = floatval($data['amount'] ?? 0.0); // in INR (rupees)

  if ($orderId <= 0) json_error('Invalid order_id', 400);
  if ($amount <= 0) json_error('Invalid amount', 400);

  $amountPaise = intval(round($amount * 100));

  $payload = [
    'amount' => $amountPaise,
    'currency' => 'INR',
    'receipt' => 'order_' . $orderId,
    'notes' => [
      'internal_order_id' => $orderId,
    ],
  ];

  $ch = curl_init('https://api.razorpay.com/v1/orders');
  curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
  curl_setopt($ch, CURLOPT_USERPWD, $razorpayKeyId . ':' . $razorpayKeySecret);

  $response = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $curlErr = curl_error($ch);
  curl_close($ch);

  if ($response === false || $httpCode < 200 || $httpCode >= 300) {
    $msg = $curlErr ?: 'Failed to create Razorpay order';
    json_error($msg, 502);
  }

  $orderData = json_decode($response, true);
  if (!is_array($orderData) || empty($orderData['id'])) {
    json_error('Invalid response from Razorpay', 502);
  }

  json_ok([
    'razorpay_key' => $razorpayKeyId,
    'order' => $orderData,
  ]);
}

if ($action === 'verify') {
  // Verify payment signature from Razorpay and record payment as Paid.
  $razorpayOrderId = trim($data['razorpay_order_id'] ?? '');
  $razorpayPaymentId = trim($data['razorpay_payment_id'] ?? '');
  $razorpaySignature = trim($data['razorpay_signature'] ?? '');
  $orderId = intval($data['order_id'] ?? 0); // internal order id
  $amount = floatval($data['amount'] ?? 0.0); // in INR

  if (!$razorpayOrderId || !$razorpayPaymentId || !$razorpaySignature) {
    json_error('Missing Razorpay payment details', 400);
  }
  if ($orderId <= 0) json_error('Invalid order_id', 400);
  if ($amount <= 0) json_error('Invalid amount', 400);

  $payload = $razorpayOrderId . '|' . $razorpayPaymentId;
  $expectedSignature = hash_hmac('sha256', $payload, $razorpayKeySecret);

  if (!hash_equals($expectedSignature, $razorpaySignature)) {
    json_error('Signature verification failed', 400);
  }

  // Record payment as Paid in the payments table and sync orders table.
  $payment_status = 'Paid';
  $transaction_id = $razorpayPaymentId;
  $payment_time = date('Y-m-d H:i:s');

  $stmt = $conn->prepare('INSERT INTO payments (order_id, amount, payment_status, transaction_id, payment_time) VALUES (?,?,?,?,?)');
  if (!$stmt) json_error('Payments table missing. Create it in MySQL.', 500);
  $stmt->bind_param('idsss', $orderId, $amount, $payment_status, $transaction_id, $payment_time);
  if (!$stmt->execute()) json_error('Insert failed', 500);

  // Mark the corresponding order as Paid and set payment_method as Online.
  try {
    $stmtOrder = $conn->prepare('UPDATE orders SET status = ?, payment_method = ? WHERE id = ?');
    if ($stmtOrder) {
      $statusVal = 'Paid';
      $methodVal = 'Online';
      $stmtOrder->bind_param('ssi', $statusVal, $methodVal, $orderId);
      $stmtOrder->execute();
    }
  } catch (\Throwable $e) {
    // Do not fail verification if order sync fails
  }

  json_ok([
    'ok' => true,
    'order_id' => $orderId,
    'amount' => $amount,
    'payment_id' => $razorpayPaymentId,
  ]);
}

json_error('Unknown action', 400);

