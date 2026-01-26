<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('game_name');
            $table->integer('games_played')->default(0);
            $table->integer('games_won')->default(0);
            $table->integer('games_lost')->default(0);
            $table->integer('best_time')->nullable(); // in seconds
            $table->integer('total_time')->default(0); // in seconds
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_stats');
    }
};
