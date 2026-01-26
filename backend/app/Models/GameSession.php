<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameSession extends Model
{
    protected $fillable = ['user_id', 'game_name', 'game_data'];
    protected $casts = ['game_data' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
