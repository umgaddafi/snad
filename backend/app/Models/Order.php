<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'customer_name', 'customer_phone', 'order_number', 'status', 'order_source', 'delivery_type', 'table_number',
        'subtotal', 'discount_amount', 'coupon_code', 'tax', 'delivery_fee', 'total_amount',
        'address_id', 'special_instructions', 'rider_id',
        'payment_method', 'payment_reference',
        'customer_confirmed', 'customer_confirmed_at',
        'cancellation_reason', 'refund_status', 'refund_reason', 'refund_account_details'
    ];

    protected $casts = [
        'customer_confirmed' => 'boolean',
        'customer_confirmed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function delivery(): HasOne
    {
        return $this->hasOne(Delivery::class);
    }
    
    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }
    
    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rider_id');
    }
}
