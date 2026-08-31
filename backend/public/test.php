<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "PHP Version: " . phpversion() . "<br>";

try {
    $env = parse_ini_file(__DIR__ . '/../.env');
    echo "DB Host: " . ($env['DB_HOST'] ?? 'not found') . "<br>";
    echo "DB Database: " . ($env['DB_DATABASE'] ?? 'not found') . "<br>";
    echo "DB User: " . ($env['DB_USERNAME'] ?? 'not found') . "<br>";

    $pdo = new PDO(
        "mysql:host=" . ($env['DB_HOST'] ?? '127.0.0.1') . ";dbname=" . ($env['DB_DATABASE'] ?? ''),
        $env['DB_USERNAME'] ?? '',
        $env['DB_PASSWORD'] ?? ''
    );
    echo "Database connection successful!<br>";
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "<br>";
}
