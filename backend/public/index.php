<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Force error reporting on for diagnostic
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Determine if the application is under maintenance...
    if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
        require $maintenance;
    }

    // Register the Auto Loader...
    require __DIR__.'/../vendor/autoload.php';

    // Bootstrap Laravel and handle the request...
    $app = require_once __DIR__.'/../bootstrap/app.php';
    $app->handleRequest(Request::capture());
} catch (\Throwable $e) {
    if (!headers_sent()) {
        header('Content-Type: application/json', true, 500);
    }
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => explode("\n", $e->getTraceAsString())
    ], JSON_PRETTY_PRINT);
}
