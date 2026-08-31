<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

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

// Determine if the application is under maintenance...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Auto Loader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
