<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Root PHP Test</h1>";
echo "PHP Version: " . phpversion() . "<br>";

try {
    if (file_exists(__DIR__ . '/backend/.env')) {
        $lines = file(__DIR__ . '/backend/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            list($name, $value) = explode('=', $line, 2) + [NULL, NULL];
            if ($name) {
                $_ENV[trim($name)] = trim($value);
            }
        }
        echo "DB Host: " . ($_ENV['DB_HOST'] ?? 'not found') . "<br>";
        echo "DB Database: " . ($_ENV['DB_DATABASE'] ?? 'not found') . "<br>";
        echo "DB User: " . ($_ENV['DB_USERNAME'] ?? 'not found') . "<br>";

        $pdo = new PDO(
            "mysql:host=" . ($_ENV['DB_HOST'] ?? '127.0.0.1') . ";dbname=" . ($_ENV['DB_DATABASE'] ?? ''),
            $_ENV['DB_USERNAME'] ?? '',
            $_ENV['DB_PASSWORD'] ?? ''
        );
        echo "<b style='color:green'>Database connection successful!</b><br>";
    } else {
        echo "backend/.env file not found!<br>";
    }
} catch (Throwable $e) {
    echo "<b style='color:red'>Error: " . $e->getMessage() . "</b><br>";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "<br>";
}
