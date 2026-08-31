<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'delivery_fee', 'is_active'];

    protected $casts = [
        'delivery_fee' => 'float',
        'is_active' => 'boolean',
    ];
}
