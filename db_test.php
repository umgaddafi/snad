<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain');

echo "=== SNAD KITCHEN DB CONNECTION TEST ===\n\n";

echo "PHP Version: " . phpversion() . "\n";
echo "Current File: " . __FILE__ . "\n";

$host = '127.0.0.1';
$db   = 'kisproje_snad_kitchen';
$user = 'kisproje_root';
$pass = 'kenny@123!';

echo "Attempting PDO connection to $db at $host with user $user...\n";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "SUCCESS: Connected to database '$db'!\n\n";

    echo "--- Tables in Database ---\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        echo "Table: $table ($count rows)\n";
    }
} catch (\PDOException $e) {
    echo "ERROR: Database connection failed!\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "Code: " . $e->getCode() . "\n";
}

echo "\n--- Checking backend/.env file ---\n";
$envPath = __DIR__ . '/backend/.env';
if (file_exists($envPath)) {
    echo "backend/.env EXISTS.\n";
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, 'DB_') === 0 || strpos($line, 'APP_') === 0) {
            if (strpos($line, 'KEY') === false && strpos($line, 'PASS') === false) {
                echo "  $line\n";
            }
        }
    }
} else {
    echo "backend/.env DOES NOT EXIST!\n";
}
