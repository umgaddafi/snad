<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain');

echo "=== LARAVEL BOOT DIAGNOSTIC ===\n";

try {
    echo "1. Loading autoload.php...\n";
    require __DIR__ . '/../vendor/autoload.php';
    echo "   Autoload success!\n";

    echo "2. Bootstrapping app.php...\n";
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    echo "   Bootstrap success!\n";

    echo "3. Testing DB facade connection...\n";
    $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
    echo "   DB Facade Connection SUCCESS! Driver: " . $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) . "\n";

    echo "4. Testing Food Model...\n";
    $count = \App\Models\Food::count();
    echo "   Food model count: " . $count . "\n";

} catch (\Throwable $e) {
    echo "\nFATAL EXCEPTION THROWN:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "\nTrace:\n" . $e->getTraceAsString() . "\n";
}
