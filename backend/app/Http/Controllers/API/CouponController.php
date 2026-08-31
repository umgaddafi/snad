<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CouponController extends Controller
{
    public function validateCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $code = strtoupper(trim($request->code));
        $subtotal = floatval($request->subtotal);

        // Auto-seed initial default campus promo codes if DB is empty
        if (Coupon::count() === 0) {
            Coupon::create([
                'code' => 'JOSTUM2026',
                'discount_type' => 'percent',
                'discount_value' => 15,
                'min_spend' => 1000,
                'is_active' => true,
            ]);
            Coupon::create([
                'code' => 'SNAD10',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'min_spend' => 500,
                'is_active' => true,
            ]);
            Coupon::create([
                'code' => 'WELCOME500',
                'discount_type' => 'fixed',
                'discount_value' => 500,
                'min_spend' => 2000,
                'is_active' => true,
            ]);
        }

        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            return response()->json(['message' => 'Invalid promo code'], 404);
        }

        if (!$coupon->is_active) {
            return response()->json(['message' => 'This promo code is no longer active'], 422);
        }

        if ($coupon->expires_at && Carbon::now()->greaterThan($coupon->expires_at)) {
            return response()->json(['message' => 'This promo code has expired'], 422);
        }

        if ($subtotal < $coupon->min_spend) {
            return response()->json([
                'message' => "Minimum order amount of ₦" . number_format($coupon->min_spend) . " required for this code"
            ], 422);
        }

        $discount = 0;
        if ($coupon->discount_type === 'percent') {
            $discount = ($subtotal * $coupon->discount_value) / 100;
        } else {
            $discount = min($coupon->discount_value, $subtotal);
        }

        return response()->json([
            'valid' => true,
            'code' => $coupon->code,
            'discount_type' => $coupon->discount_type,
            'discount_value' => $coupon->discount_value,
            'discount_amount' => round($discount, 2),
            'message' => 'Promo code applied successfully!',
        ]);
    }

    public function index()
    {
        $coupons = Coupon::latest()->get();
        return response()->json($coupons);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:coupons,code',
            'discount_type' => 'required|in:percent,fixed',
            'discount_value' => 'required|numeric|min:0.01',
            'min_spend' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'expires_at' => 'nullable|date',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $coupon = Coupon::create($validated);

        return response()->json($coupon, 201);
    }

    public function update(Request $request, Coupon $coupon)
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|unique:coupons,code,' . $coupon->id,
            'discount_type' => 'sometimes|in:percent,fixed',
            'discount_value' => 'sometimes|numeric|min:0.01',
            'min_spend' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'expires_at' => 'nullable|date',
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $coupon->update($validated);
        return response()->json($coupon);
    }

    public function destroy(Coupon $coupon)
    {
        $coupon->delete();
        return response()->json(['message' => 'Coupon deleted successfully']);
    }
}
