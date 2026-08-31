<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain');

// Polyfill missing mbstring extension functions on cPanel if disabled
if (!function_exists('mb_split')) {
    function mb_split($pattern, $string, $limit = -1) {
        return preg_split('/' . $pattern . '/u', $string, $limit);
    }
}
if (!function_exists('mb_strtolower')) {
    function mb_strtolower($string, $encoding = null) {
        return strtolower($string);
    }
}
if (!function_exists('mb_strtoupper')) {
    function mb_strtoupper($string, $encoding = null) {
        return strtoupper($string);
    }
}
if (!function_exists('mb_strlen')) {
    function mb_strlen($string, $encoding = null) {
        return strlen($string);
    }
}
if (!function_exists('mb_substr')) {
    function mb_substr($string, $start, $length = null, $encoding = null) {
        return substr($string, $start, $length);
    }
}

echo "=== TESTING LARAVEL HANDLE REQUEST ===\n";

try {
    require __DIR__ . '/backend/vendor/autoload.php';
    $app = require_once __DIR__ . '/backend/bootstrap/app.php';

    echo "App bootstrapped! Handling capture...\n";
    $request = Illuminate\Http\Request::create('/api/v1/foods', 'GET');
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
