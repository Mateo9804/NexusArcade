<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_stats', function (Blueprint $table) {
            $table->timestamp('last_reward_claim')->nullable()->after('total_chips');
        });
    }

    public function down(): void
    {
        Schema::table('game_stats', function (Blueprint $table) {
            $table->dropColumn('last_reward_claim');
        });
    }
};
