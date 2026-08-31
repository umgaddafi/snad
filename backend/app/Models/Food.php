<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Food extends Model
{
    protected $table = 'foods';
    
    protected $fillable = [
        'category_id', 'name', 'description', 'price', 
        'image_url', 'discount_price', 'prep_time', 'is_available', 
        'ingredients', 'is_featured'
    ];

    protected $casts = [
        'ingredients' => 'array',
        'is_available' => 'boolean',
        'is_featured' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
