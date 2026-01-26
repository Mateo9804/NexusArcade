<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('game_name'); // e.g., 'sudoku'
            $table->json('game_data');   // grid, solution, lives, timer, difficulty, etc.
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};
