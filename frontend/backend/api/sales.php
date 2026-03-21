<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/db.php';

cors();
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Method not allowed', 405);

$sql = "
  SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
         SUM(total_amount) AS total,
         COUNT(*) AS orders
  FROM orders
  GROUP BY DATE_FORMAT(created_at, '%Y-%m')
  ORDER BY month ASC
";

$res = $conn->query($sql);
if (!$res) json_error('Query failed', 500);

$out = [];
while ($r = $res->fetch_assoc()) {
  $out[] = [
    'month' => $r['month'],
    'total' => floatval($r['total']),
    'orders' => intval($r['orders']),
  ];
}

json_ok(['data' => $out]);

