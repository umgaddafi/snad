<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_source', 20)->default('online')->after('status');
        });

        // Backfill existing orders:
        // Any order with a table number, dine-in delivery type, or placed by front_desk staff is 'pos'
        \Illuminate\Support\Facades\DB::table('orders')
            ->whereNotNull('table_number')
            ->orWhere('delivery_type', 'dine_in')
            ->orWhereIn('user_id', function ($query) {
                $query->select('id')->from('users')->where('role', 'front_desk');
            })
            ->update(['order_source' => 'pos']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('order_source');
        });
    }
};
