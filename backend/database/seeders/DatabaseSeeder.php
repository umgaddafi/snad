<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Food;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Users
        User::create([
            'name' => 'Super Admin',
            'email' => 'gaddafiumar4445@gmail.com',
            'password' => Hash::make('12345678'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
        User::create([
            'name' => 'Chef Amina',
            'email' => 'kitchen@snadkitchen.com',
            'password' => Hash::make('password'),
            'role' => 'kitchen',
            'email_verified_at' => now(),
        ]);
        User::create([
            'name' => 'Delivery Man',
            'email' => 'umgaddafi4@gmail.com',
            'password' => Hash::make('12345678'),
            'role' => 'rider',
            'email_verified_at' => now(),
        ]);
        User::create([
            'name' => 'Sarah Student',
            'email' => 'sarah@jostum.edu.ng',
            'password' => Hash::make('password'),
            'role' => 'customer',
        ]);

        // Categories
        $catRice = Category::create(['name' => 'Rice', 'slug' => 'rice']);
        $catSwallow = Category::create(['name' => 'Swallow', 'slug' => 'swallow']);
        $catDrinks = Category::create(['name' => 'Drinks', 'slug' => 'drinks']);

        // Foods
        Food::create([
            'category_id' => $catRice->id,
            'name' => 'Jollof Rice & Chicken',
            'description' => 'Classic Nigerian Jollof with grilled chicken and plantain.',
            'price' => 2500,
            'image_url' => '/images/jollof_rice.png',
            'is_featured' => true,
        ]);
        Food::create([
            'category_id' => $catRice->id,
            'name' => 'Fried Rice & Beef',
            'description' => 'Rich fried rice with mixed vegetables and fried beef.',
            'price' => 2300,
            'image_url' => '/images/fried_rice.png',
            'is_featured' => false,
        ]);
        Food::create([
            'category_id' => $catSwallow->id,
            'name' => 'Pounded Yam & Egusi',
            'description' => 'Hot pounded yam served with rich egusi soup and assorted meat.',
            'price' => 3000,
            'image_url' => '/images/pounded_yam.png',
            'is_featured' => true,
        ]);
        Food::create([
            'category_id' => $catDrinks->id,
            'name' => 'Chilled Coca Cola 50cl',
            'description' => 'Cold soft drink.',
            'price' => 500,
            'image_url' => '/images/chilled_coke.png',
            'is_featured' => false,
        ]);
    }
}
