<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Expand users.role to include 'front_desk'
        try {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'customer', 'kitchen', 'rider', 'front_desk') NOT NULL DEFAULT 'customer'");
        } catch (\Exception $e) {
            // Fallback for sqlite or systems without direct enum alter
            \Log::info("Users role alter: " . $e->getMessage());
        }

        // 2. Expand orders.delivery_type to include 'dine_in'
        try {
            DB::statement("ALTER TABLE orders MODIFY COLUMN delivery_type ENUM('pickup', 'delivery', 'dine_in') NOT NULL DEFAULT 'pickup'");
        } catch (\Exception $e) {
            \Log::info("Orders delivery_type alter: " . $e->getMessage());
        }

        // 3. Add walk-in customer details & table number to orders
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'customer_name')) {
                $table->string('customer_name')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('orders', 'customer_phone')) {
                $table->string('customer_phone')->nullable()->after('customer_name');
            }
            if (!Schema::hasColumn('orders', 'table_number')) {
                $table->string('table_number')->nullable()->after('delivery_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'table_number')) {
                $table->dropColumn('table_number');
            }
            if (Schema::hasColumn('orders', 'customer_phone')) {
                $table->dropColumn('customer_phone');
            }
            if (Schema::hasColumn('orders', 'customer_name')) {
                $table->dropColumn('customer_name');
            }
        });

        try {
            DB::statement("ALTER TABLE orders MODIFY COLUMN delivery_type ENUM('pickup', 'delivery') NOT NULL DEFAULT 'delivery'");
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'customer', 'kitchen', 'rider') NOT NULL DEFAULT 'customer'");
        } catch (\Exception $e) {
            // Log fallback
        }
    }
};
