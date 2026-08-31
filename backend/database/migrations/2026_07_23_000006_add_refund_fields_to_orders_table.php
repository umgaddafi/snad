<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('cancellation_reason')->nullable()->after('special_instructions');
            $table->enum('refund_status', ['none', 'requested', 'approved', 'refunded', 'rejected'])->default('none')->after('cancellation_reason');
            $table->text('refund_reason')->nullable()->after('refund_status');
            $table->text('refund_account_details')->nullable()->after('refund_reason');
        });
    }

    public function down(): void {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['cancellation_reason', 'refund_status', 'refund_reason', 'refund_account_details']);
        });
    }
};
