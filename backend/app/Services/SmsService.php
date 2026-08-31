<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Send an SMS via KudiSMS API using application/json
     *
     * @param string $phone
     * @param string $message
     * @return bool
     */
    public static function send($phone, $message)
    {
        if (empty($phone)) {
            Log::warning("SmsService: Phone number is empty, cannot send SMS.");
            return false;
        }

        // Clean phone number: keep digits only
        $phone = preg_replace('/[^0-9]/', '', (string)$phone);

        // Normalize Nigerian phone numbers
        if (strlen($phone) === 10 && in_array(substr($phone, 0, 1), ['7', '8', '9'])) {
            $phone = '234' . $phone;
        } elseif (strlen($phone) === 11 && str_starts_with($phone, '0')) {
            $phone = '234' . substr($phone, 1);
        }

        $apiKey = env('KUDISMS_API_KEY', 'sZvFugdyKcQq9lp0IUD4BzVYw2Mm3nxo5NLhRtXOCjT6JPbSr1WGHi7a8efkEA');
        $senderId = env('KUDISMS_SENDER_ID', 'SnadKitchen');

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json'
            ])->post('https://my.kudisms.net/api/sms', [
                'token' => $apiKey,
                'senderID' => $senderId,
                'recipients' => $phone,
                'mobiles' => $phone,
                'message' => $message,
                'gateway' => '2',
            ]);

            $resBody = $response->body();
            Log::info("KudiSMS response for recipient {$phone}: {$resBody}");

            return $response->successful() && (str_contains($resBody, '"status":"success"') || str_contains($resBody, '"error_code":"000"'));
        } catch (\Exception $e) {
            Log::error("KudiSMS exception for recipient {$phone}: " . $e->getMessage());
            return false;
        }
    }
}
