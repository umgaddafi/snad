<?php
require __DIR__.'/vendor/autoload.php';
$response = \Illuminate\Support\Facades\Http::post('https://my.kudisms.net/api/sms', [
    'token' => 'sZvFugdyKcQq9lp0IUD4BzVYw2Mm3nxo5NLhRtXOCjT6JPbSr1WGHi7a8efkEA',
    'senderID' => 'SnadKitchen',
    'recipients' => '2348123456789',
    'message' => 'Test message'
]);
echo "Status: " . $response->status() . "\n";
echo "Body: " . $response->body() . "\n";
