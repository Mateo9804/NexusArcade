<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameStats extends Model
{
    protected $fillable = [
        'user_id', 
        'game_name', 
        'games_played', 
        'games_won', 
        'games_lost', 
        'best_time', 
        'best_moves',
        'total_time'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
