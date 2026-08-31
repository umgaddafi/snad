<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'min_spend',
        'is_active',
        'expires_at',
        'used_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'discount_value' => 'float',
        'min_spend' => 'float',
        'expires_at' => 'datetime',
    ];
}
