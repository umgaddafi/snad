<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain');

echo "=== TESTING LARAVEL HANDLE REQUEST ===\n";

try {
    require __DIR__ . '/backend/vendor/autoload.php';
    $app = require_once __DIR__ . '/backend/bootstrap/app.php';

    echo "App bootstrapped! Handling capture...\n";
    $request = Illuminate\Http\Request::capture();
    echo "Request captured: " . $request->fullUrl() . "\n";

    $response = $app->handleRequest($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content:\n" . $response->getContent() . "\n";

} catch (\Throwable $e) {
    echo "\nFATAL EXCEPTION THROWN:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "\nTrace:\n" . $e->getTraceAsString() . "\n";
}
