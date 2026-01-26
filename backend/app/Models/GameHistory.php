<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameHistory extends Model
{
    protected $fillable = [
        'user_id',
        'game_name',
        'difficulty',
        'result',
        'time',
        'lives_left'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

