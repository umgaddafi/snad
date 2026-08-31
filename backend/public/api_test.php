<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain');

echo "=== SNAD KITCHEN DIAGNOSTIC ===\n\n";

echo "PHP Version: " . phpversion() . "\n";
echo "Current File: " . __FILE__ . "\n";
echo "Root Dir: " . realpath(__DIR__ . '/../../') . "\n";

$envPath = __DIR__ . '/../.env';
echo ".env exists? " . (file_exists($envPath) ? "YES" : "NO") . "\n";

if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    preg_match('/DB_DATABASE=(.*)/', $envContent, $dbMatch);
    preg_match('/DB_USERNAME=(.*)/', $envContent, $userMatch);
    preg_match('/DB_HOST=(.*)/', $envContent, $hostMatch);
    
    echo "DB_HOST: " . trim($dbMatch[1] ?? 'not set') . "\n";
    echo "DB_DATABASE: " . trim($dbMatch[1] ?? 'not set') . "\n";
    echo "DB_USERNAME: " . trim($userMatch[1] ?? 'not set') . "\n";
}

echo "\n--- Testing MySQL Connection ---\n";
try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=kisproje_snad_kitchen", "kisproje_root", "kenny@123!");
    echo "MySQL Connection SUCCESSFUL!\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM foods");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Foods count in DB: " . $row['count'] . "\n";
} catch (Exception $e) {
    echo "MySQL Connection FAILED: " . $e->getMessage() . "\n";
}

echo "\n--- Testing Storage Permissions ---\n";
$storagePath = __DIR__ . '/../storage';
echo "Storage writable? " . (is_writable($storagePath) ? "YES" : "NO") . "\n";
$logsPath = __DIR__ . '/../storage/logs';
echo "Logs dir writable? " . (is_writable($logsPath) ? "YES" : "NO") . "\n";

if (file_exists($logsPath . '/laravel.log')) {
    echo "\n--- Last 20 lines of laravel.log ---\n";
    $lines = array_slice(file($logsPath . '/laravel.log'), -20);
    echo implode("", $lines);
}
