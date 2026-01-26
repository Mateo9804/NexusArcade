<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_stats', function (Blueprint $table) {
            $table->integer('best_moves')->nullable()->after('best_time');
        });
    }

    public function down(): void
    {
        Schema::table('game_stats', function (Blueprint $table) {
            $table->dropColumn('best_moves');
        });
    }
};
