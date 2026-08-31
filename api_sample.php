<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;dbname=kisproje_snad_kitchen;charset=utf8mb4",
        "kisproje_root",
        "kenny@123!",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    $stmt = $pdo->query("SELECT id, name, description, price, image_url, is_available FROM foods LIMIT 10");
    $foods = $stmt->fetchAll();

    echo json_encode([
        'status' => 'success',
        'message' => 'Connected successfully to kisproje_snad_kitchen database!',
        'total_meals' => count($foods),
        'data' => $foods
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
