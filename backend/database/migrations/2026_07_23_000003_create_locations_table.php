<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->decimal('delivery_fee', 10, 2)->default(500.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default campus locations
        DB::table('locations')->insert([
            ['name' => 'Hostel A (Male Student Hostel)', 'delivery_fee' => 400.00, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Hostel B (Female Student Hostel)', 'delivery_fee' => 400.00, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'ETF Lecture Hall Block', 'delivery_fee' => 500.00, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Engineering Complex / Workshops', 'delivery_fee' => 500.00, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Agriculture Lecture Theater (ALT)', 'delivery_fee' => 500.00, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Post Graduate School (PG School)', 'delivery_fee' => 600.00, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Senate Building Administration Complex', 'delivery_fee' => 600.00, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Campus Health Center / Clinic', 'delivery_fee' => 500.00, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'University Library Complex', 'delivery_fee' => 500.00, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void {
        Schema::dropIfExists('locations');
    }
};
