<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Food;
use App\Mail\OrderPlacedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Services\SmsService;

class OrderController extends Controller
{
    public function track($order_number)
    {
        $order = Order::where('order_number', $order_number)->with('items.food', 'user')->first();
        
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json($order);
    }
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'customer') {
            $orders = Order::where('user_id', $user->id)->with('items.food', 'delivery', 'rider')->latest()->get();
        } else if ($user->role === 'rider') {
            $orders = Order::whereIn('status', ['ready', 'out_for_delivery', 'delivered'])
                           ->with('items.food', 'user', 'delivery')
                           ->latest()
                           ->get();
        } else {
            $orders = Order::with('items.food', 'user', 'delivery', 'rider')->latest()->get();
        }
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.food_id' => 'required|exists:foods,id',
            'items.*.quantity' => 'required|integer|min:1',
            'delivery_type' => 'required|in:pickup,delivery',
            'address_id' => 'nullable|exists:addresses,id',
        ]);

        try {
            DB::beginTransaction();

            $subtotal = 0;
            foreach ($request->items as $item) {
                $food = Food::findOrFail($item['food_id']);
                $subtotal += ($food->discount_price ?? $food->price) * $item['quantity'];
            }

            $discount_amount = 0;
            $coupon_code = null;
            if ($request->filled('coupon_code')) {
                $coupon = \App\Models\Coupon::where('code', strtoupper(trim($request->coupon_code)))
                    ->where('is_active', true)
                    ->first();
                if ($coupon && $subtotal >= $coupon->min_spend) {
                    $coupon_code = $coupon->code;
                    if ($coupon->discount_type === 'percent') {
                        $discount_amount = round(($subtotal * $coupon->discount_value) / 100, 2);
                    } else {
                        $discount_amount = min($coupon->discount_value, $subtotal);
                    }
                    $coupon->increment('used_count');
                }
            }

            $taxable_subtotal = max(0, $subtotal - $discount_amount);
            $delivery_fee = $request->delivery_type === 'delivery' ? (float)($request->delivery_fee ?? 500) : 0;
            $tax = 0;
            $total_amount = round($taxable_subtotal + $delivery_fee, 2);

            $status = ($request->payment_method === 'paystack' && !empty($request->payment_reference)) ? 'confirmed' : 'pending';

            $order = Order::create([
                'user_id' => $request->user()->id,
                'order_number' => 'ORD-' . strtoupper(Str::random(8)),
                'status' => $status,
                'delivery_type' => $request->delivery_type,
                'subtotal' => $subtotal,
                'discount_amount' => $discount_amount,
                'coupon_code' => $coupon_code,
                'tax' => 0,
                'delivery_fee' => $delivery_fee,
                'total_amount' => $total_amount,
                'address_id' => $request->address_id,
                'special_instructions' => $request->special_instructions,
                'payment_method' => $request->payment_method ?? 'cod',
                'payment_reference' => $request->payment_reference,
            ]);

            foreach ($request->items as $item) {
                $food = Food::find($item['food_id']);
                OrderItem::create([
                    'order_id' => $order->id,
                    'food_id' => $food->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $food->discount_price ?? $food->price,
                    'customizations' => $item['customizations'] ?? null,
                ]);
            }

            DB::commit();

            try {
                Mail::to($request->user()->email)->send(new OrderPlacedMail($order->load('user', 'items.food')));
            } catch (\Exception $e) {
                // Log email error but don't fail the order
                \Log::error('Email failed: ' . $e->getMessage());
            }

            // Send SMS Notification via KudiSMS (Only sent on order placement)
            $recipientPhone = $request->user()->phone ?? $request->phone;
            if (!$recipientPhone && $request->address_id) {
                $address = \App\Models\Address::find($request->address_id);
                if ($address) {
                    $recipientPhone = $address->phone;
                }
            }

            if ($recipientPhone) {
                $fullName = $request->user()->name ?? 'Customer';
                $firstName = explode(' ', trim($fullName))[0];
                $msg = "Dear {$firstName}, your order #{$order->order_number} has been received successfully! Thank you for choosing Snad Kitchen.";
                SmsService::send($recipientPhone, $msg);
            } else {
                \Log::warning("Order #{$order->order_number} created without a recipient phone number for SMS.");
            }

            // Send Email Notification
            if ($request->user()->email) {
                try {
                    Mail::to($request->user()->email)->send(new OrderPlacedMail($order));
                } catch (\Exception $e) {
                    \Log::error('Email failed: ' . $e->getMessage());
                }
            }

            return response()->json($order->load('items.food'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to place order', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, Order $order)
    {
        $order->load('items.food', 'payment', 'delivery', 'address', 'user');
        return response()->json($order);
    }
    
    public function update(Request $request, Order $order)
    {
        $request->validate(['status' => 'required|in:pending,confirmed,preparing,ready,out_for_delivery,delivered,cancelled,rejected,returned']);
        
        $user = $request->user();
        
        $data = ['status' => $request->status];
        
        // Authorization check: Customer can confirm delivery or cancel pending/confirmed order
        if ($user->role === 'customer') {
            if ($order->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized to update this order'], 403);
            }
            if (!in_array($request->status, ['delivered', 'cancelled'])) {
                return response()->json(['message' => 'Customers can only cancel pending orders or confirm delivery.'], 403);
            }
            if ($request->status === 'cancelled' && !in_array($order->status, ['pending', 'confirmed'])) {
                return response()->json(['message' => 'Order cannot be cancelled after meal preparation has started.'], 422);
            }
            if ($request->status === 'delivered') {
                if ($order->status !== 'delivered') {
                    return response()->json(['message' => 'Rider must mark order as delivered before customer can confirm receipt.'], 422);
                }
                $data['customer_confirmed'] = true;
                $data['customer_confirmed_at'] = now();
            }
        }
        if ($user->role === 'rider') {
            if ($request->status === 'ready') {
                $data['rider_id'] = null; // Reset rider assignment when returned to ready
            } else {
                $data['rider_id'] = $user->id;
            }
        }
        if ($request->has('rider_id')) {
            $data['rider_id'] = $request->rider_id;
        }

        $order->update($data);

        if ($order->user_id) {
            $readableStatus = str_replace('_', ' ', $request->status);
            \App\Models\Notification::create([
                'user_id' => $order->user_id,
                'title'   => 'Order Update: ' . $order->order_number,
                'message' => "Your order {$order->order_number} status is now {$readableStatus}.",
                'type'    => 'order_status',
                'is_read' => false,
            ]);
        }

        // Auto-settle payment for Cash on Delivery when order is delivered
        if ($request->status === 'delivered') {
            \App\Models\Payment::where('order_id', $order->id)->update(['status' => 'success']);
        }
        
        return response()->json($order->load('rider', 'user', 'items.food', 'payment'));
    }

    /**
     * Customer cancels their order with reason and optional refund details
     */
    public function cancelOrder(Request $request, Order $order)
    {
        $user = $request->user();
        if ($user->role === 'customer' && $order->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json(['message' => 'Order cannot be cancelled after food preparation has started.'], 422);
        }

        $request->validate([
            'cancellation_reason' => 'required|string|max:500',
            'refund_account_details' => 'nullable|string|max:500',
        ]);

        $order->load('payment');
        $isPaid = $order->payment && $order->payment->status === 'success';

        $order->update([
            'status' => 'cancelled',
            'cancellation_reason' => $request->cancellation_reason,
            'refund_status' => $isPaid ? 'requested' : 'none',
            'refund_reason' => $isPaid ? 'Order cancelled by customer. Reason: ' . $request->cancellation_reason : null,
            'refund_account_details' => $request->refund_account_details,
        ]);

        // Notify Customer
        \App\Models\Notification::create([
            'user_id' => $order->user_id,
            'title'   => 'Order Cancelled: ' . $order->order_number,
            'message' => "Your order {$order->order_number} has been cancelled successfully." . ($isPaid ? " Refund request has been submitted for processing." : ""),
            'type'    => 'order_status',
            'is_read' => false,
        ]);

        // Notify Admins if refund requested
        if ($isPaid) {
            $admins = \App\Models\User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                \App\Models\Notification::create([
                    'user_id' => $admin->id,
                    'title'   => '💸 Refund Requested: ' . $order->order_number,
                    'message' => "Refund requested for cancelled Order {$order->order_number} by " . ($user->name ?? 'Customer') . " (Amount: ₦" . number_format($order->total_amount) . ").",
                    'type'    => 'refund_request',
                    'is_read' => false,
                ]);
            }
        }

        return response()->json($order->load('items.food', 'payment'));
    }

    /**
     * Customer submits or updates refund request details
     */
    public function requestRefund(Request $request, Order $order)
    {
        $user = $request->user();
        if ($user->role === 'customer' && $order->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'refund_reason' => 'required|string|max:500',
            'refund_account_details' => 'required|string|max:500',
        ]);

        $order->update([
            'refund_status' => 'requested',
            'refund_reason' => $request->refund_reason,
            'refund_account_details' => $request->refund_account_details,
        ]);

        \App\Models\Notification::create([
            'user_id' => $order->user_id,
            'title'   => 'Refund Requested: ' . $order->order_number,
            'message' => "Your refund request for order {$order->order_number} has been submitted to Snad Kitchen management.",
            'type'    => 'order_status',
            'is_read' => false,
        ]);

        // Notify Admins
        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            \App\Models\Notification::create([
                'user_id' => $admin->id,
                'title'   => '💸 Refund Requested: ' . $order->order_number,
                'message' => "Customer " . ($user->name ?? 'Customer') . " requested a refund for Order {$order->order_number} (Amount: ₦" . number_format($order->total_amount) . ").",
                'type'    => 'refund_request',
                'is_read' => false,
            ]);
        }

        return response()->json($order);
    }

    /**
     * Admin processes a refund request
     */
    public function processRefund(Request $request, Order $order)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'refund_status' => 'required|in:approved,refunded,rejected',
        ]);

        $order->update([
            'refund_status' => $request->refund_status,
        ]);

        if ($order->user_id) {
            $statusText = ucfirst($request->refund_status);
            \App\Models\Notification::create([
                'user_id' => $order->user_id,
                'title'   => "Refund Update: {$order->order_number}",
                'message' => "Your refund status for order {$order->order_number} has been updated to {$statusText}.",
                'type'    => 'order_status',
                'is_read' => false,
            ]);
        }

        return response()->json($order);
    }

    /**
     * Customer updates special instructions or order notes for pending order
     */
    public function updateNotes(Request $request, Order $order)
    {
        $user = $request->user();
        if ($user->role === 'customer' && $order->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order notes can only be changed while order is pending.'], 422);
        }

        $request->validate([
            'special_instructions' => 'required|string|max:500',
        ]);

        $order->update([
            'special_instructions' => $request->special_instructions,
        ]);

        return response()->json($order);
    }
}
