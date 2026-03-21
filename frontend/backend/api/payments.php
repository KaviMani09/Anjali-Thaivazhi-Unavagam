<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/db.php';

cors();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
  $data = read_json();

  $order_id = intval($data['order_id'] ?? 0);
  $amount = floatval($data['amount'] ?? 0);
  $payment_status = trim($data['payment_status'] ?? 'Pending');
  $transaction_id = trim($data['transaction_id'] ?? '');

  if ($order_id <= 0) json_error('Invalid order_id', 400);
  if ($amount <= 0) json_error('Invalid amount', 400);

  // Normalize status
  $allowed = ['Pending', 'Paid', 'Failed'];
  if (!in_array($payment_status, $allowed, true)) {
    $payment_status = 'Pending';
  }

  $payment_time = date('Y-m-d H:i:s');

  $stmt = $conn->prepare('INSERT INTO payments (order_id, amount, payment_status, transaction_id, payment_time) VALUES (?,?,?,?,?)');
  if (!$stmt) json_error('Payments table missing. Create it in MySQL.', 500);
  $stmt->bind_param('idsss', $order_id, $amount, $payment_status, $transaction_id, $payment_time);
  if (!$stmt->execute()) json_error('Insert failed', 500);

  // If this payment is marked as Paid, also mark the corresponding order as Paid.
  if ($payment_status === 'Paid') {
    try {
      $stmtOrder = $conn->prepare('UPDATE orders SET status = ?, payment_method = ? WHERE id = ?');
      if ($stmtOrder) {
        $statusVal = 'Paid';
        // Keep payment_method consistent with latest payment
        $methodVal = $transaction_id ? 'UPI' : 'Online';
        $stmtOrder->bind_param('ssi', $statusVal, $methodVal, $order_id);
        $stmtOrder->execute();
      }
    } catch (\Throwable $e) {
      // Do not fail the payment API if order sync fails
    }
  }

  json_ok([
    'id' => $conn->insert_id,
    'order_id' => $order_id,
    'amount' => $amount,
    'payment_status' => $payment_status,
    'transaction_id' => $transaction_id,
    'payment_time' => $payment_time,
  ]);
}

if ($method === 'GET') {
  $orderId = isset($_GET['order_id']) ? intval($_GET['order_id']) : 0;

  if ($orderId > 0) {
    // Lightweight lookup for a single order (can be used for real-time polling if you
    // later connect a UPI gateway / webhook that updates this table).
    $stmt = $conn->prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1');
    $stmt->bind_param('i', $orderId);
    if (!$stmt->execute()) json_error('Query failed', 500);
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    if (!$row) json_ok(['payment' => null]);
    json_ok(['payment' => $row]);
  }

  // Admin-only listing of all payments
  require_admin();
  $res = $conn->query('SELECT * FROM payments ORDER BY payment_time DESC, id DESC');

  // If the payments table is missing, fail soft with an empty list instead of 500
  if (!$res) {
    if ($conn->errno === 1146) { // ER_NO_SUCH_TABLE
      json_ok(['payments' => []]);
    }
    json_error('Query failed', 500);
  }

  $rows = [];
  while ($r = $res->fetch_assoc()) $rows[] = $r;
  json_ok(['payments' => $rows]);
}

if ($method === 'PUT') {
  // Allow admin to correct or update payment status manually.
  require_admin();
  $data = read_json();
  $id = intval($data['id'] ?? 0);
  $payment_status = trim($data['payment_status'] ?? '');
  $transaction_id = trim($data['transaction_id'] ?? '');

  if ($id <= 0) json_error('Invalid id', 400);
  if (!$payment_status && !$transaction_id) json_error('Nothing to update', 400);

  $fields = [];
  $types = '';
  $values = [];

  if ($payment_status) {
    $allowed = ['Pending', 'Paid', 'Failed'];
    if (!in_array($payment_status, $allowed, true)) $payment_status = 'Pending';
    $fields[] = 'payment_status=?';
    $types .= 's';
    $values[] = $payment_status;
  }

  if ($transaction_id) {
    $fields[] = 'transaction_id=?';
    $types .= 's';
    $values[] = $transaction_id;
  }

  // Always bump payment_time when updating
  $fields[] = 'payment_time=NOW()';

  $sql = 'UPDATE payments SET ' . implode(',', $fields) . ' WHERE id=?';
  $types .= 'i';
  $values[] = $id;

  $stmt = $conn->prepare($sql);
  if (!$stmt) json_error('Prepare failed', 500);
  $stmt->bind_param($types, ...$values);
  if (!$stmt->execute()) json_error('Update failed', 500);

  // Keep orders table in sync when a payment row is updated.
  if ($payment_status) {
    try {
      // Look up the related order_id first
      $lookup = $conn->prepare('SELECT order_id FROM payments WHERE id = ? LIMIT 1');
      if ($lookup) {
        $lookup->bind_param('i', $id);
        if ($lookup->execute()) {
          $res = $lookup->get_result();
          $row = $res ? $res->fetch_assoc() : null;
          $orderId = intval($row['order_id'] ?? 0);
          if ($orderId > 0 && $payment_status === 'Paid') {
            $statusVal = 'Paid';
            $methodVal = $transaction_id ? 'UPI' : 'Online';
            $stmtOrder = $conn->prepare('UPDATE orders SET status = ?, payment_method = ? WHERE id = ?');
            if ($stmtOrder) {
              $stmtOrder->bind_param('ssi', $statusVal, $methodVal, $orderId);
              $stmtOrder->execute();
            }
          }
        }
      }
    } catch (\Throwable $e) {
      // Best-effort only; do not break admin updates
    }
  }

  json_ok(['ok' => true]);
}

json_error('Method not allowed', 405);

