<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\FoodController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\SettingController;
use App\Http\Controllers\API\CouponController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\LocationController;
use App\Http\Controllers\API\NotificationController;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/auth/resend-otp', [AuthController::class, 'resendOtp']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/verify-reset-otp', [AuthController::class, 'verifyResetOtp']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/foods', [FoodController::class, 'index']);
    Route::get('/foods/{food}', [FoodController::class, 'show']);
    Route::get('/settings', [SettingController::class, 'index']);
    Route::get('/orders/track/{order_number}', [OrderController::class, 'track']);
    Route::post('/coupons/validate', [CouponController::class, 'validateCoupon']);
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::get('/locations', [LocationController::class, 'index']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::match(['put', 'post'], '/auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAsRead']);
        
        Route::post('/orders/{order}/cancel', [OrderController::class, 'cancelOrder']);
        Route::post('/orders/{order}/refund', [OrderController::class, 'requestRefund']);
        Route::post('/orders/{order}/process-refund', [OrderController::class, 'processRefund']);
        Route::put('/orders/{order}/notes', [OrderController::class, 'updateNotes']);

        Route::apiResource('orders', OrderController::class);
        Route::apiResource('coupons', CouponController::class);
        Route::apiResource('reviews', ReviewController::class);
        Route::get('/admin/locations', [LocationController::class, 'adminIndex']);
        Route::apiResource('locations', LocationController::class)->except(['index']);

        Route::post('/foods', [FoodController::class, 'store']);
        Route::put('/foods/{food}', [FoodController::class, 'update']);
        Route::delete('/foods/{food}', [FoodController::class, 'destroy']);
        Route::get('/users', [AuthController::class, 'index']);
        Route::post('/users', [AuthController::class, 'storeStaff']);
        Route::put('/users/{id}', [AuthController::class, 'update']);
        Route::delete('/users/{id}', [AuthController::class, 'destroy']);
        Route::post('/settings', [SettingController::class, 'store']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    });
});
