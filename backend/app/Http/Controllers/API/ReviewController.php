<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Order;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * List all reviews (admin) or reviews for a specific food (public)
     */
    public function index(Request $request)
    {
        $query = Review::with('user:id,name', 'food:id,name,image_url')->latest();

        if ($request->has('food_id')) {
            $query->where('food_id', $request->food_id);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Customer submits a review after a delivered order
     */
    public function store(Request $request)
    {
        $request->validate([
            'food_id'   => 'required|exists:foods,id',
            'order_id'  => 'required|exists:orders,id',
            'rating'    => 'required|integer|min:1|max:5',
            'comment'   => 'nullable|string|max:1000',
        ]);

        // Verify the order belongs to the customer and is delivered
        $order = Order::where('id', $request->order_id)
                      ->where('user_id', $request->user()->id)
                      ->where('status', 'delivered')
                      ->first();

        if (!$order) {
            return response()->json(['message' => 'You can only review meals from your delivered orders.'], 403);
        }

        // Prevent duplicate reviews
        $existing = Review::where('user_id', $request->user()->id)
                          ->where('food_id', $request->food_id)
                          ->where('order_id', $request->order_id)
                          ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already reviewed this meal.'], 409);
        }

        $review = Review::create([
            'user_id'  => $request->user()->id,
            'food_id'  => $request->food_id,
            'order_id' => $request->order_id,
            'rating'   => $request->rating,
            'comment'  => $request->comment,
        ]);

        return response()->json($review->load('user:id,name', 'food:id,name'), 201);
    }

    /**
     * Admin reply to or delete a review
     */
    public function update(Request $request, Review $review)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate(['admin_reply' => 'nullable|string|max:1000']);
        $review->update(['admin_reply' => $request->admin_reply]);

        if (!empty($request->admin_reply)) {
            $foodName = $review->food ? $review->food->name : 'your meal';
            \App\Models\Notification::create([
                'user_id' => $review->user_id,
                'title'   => 'New reply to your meal review',
                'message' => "Snad Kitchen replied to your review on {$foodName}: \"{$request->admin_reply}\"",
                'type'    => 'review_reply',
                'is_read' => false,
            ]);
        }

        return response()->json($review);
    }

    public function destroy(Request $request, Review $review)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $review->delete();
        return response()->json(null, 204);
    }
}
