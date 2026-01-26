<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('game_name');
            $table->string('difficulty')->nullable();
            $table->string('result'); // 'won', 'lost'
            $table->integer('time'); // in seconds
            $table->integer('lives_left');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_histories');
    }
};

