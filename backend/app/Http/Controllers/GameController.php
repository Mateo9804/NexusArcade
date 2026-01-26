<?php

namespace App\Http\Controllers;

use App\Models\GameSession;
use App\Models\GameStats;
use App\Models\GameHistory;
use Illuminate\Http\Request;

class GameController extends Controller
{
    public function saveSession(Request $request)
    {
        $request->validate([
            'game_name' => 'required|string',
            'game_data' => 'required|array',
        ]);

        $session = GameSession::updateOrCreate(
            ['user_id' => $request->user()->id, 'game_name' => $request->game_name],
            ['game_data' => $request->game_data]
        );

        return response()->json($session);
    }

    public function getSession(Request $request, $gameName)
    {
        $session = GameSession::where('user_id', $request->user()->id)
            ->where('game_name', $gameName)
            ->first();

        return response()->json($session);
    }

    public function deleteSession(Request $request, $gameName)
    {
        GameSession::where('user_id', $request->user()->id)
            ->where('game_name', $gameName)
            ->delete();

        return response()->json(['message' => 'Session deleted']);
    }

    public function updateStats(Request $request)
    {
        $request->validate([
            'game_name' => 'required|string',
            'result' => 'required|in:won,lost',
            'time' => 'required|integer',
            'difficulty' => 'nullable|string',
            'lives_left' => 'required|integer'
        ]);

        $user = $request->user();

        $stats = GameStats::firstOrCreate(
            ['user_id' => $user->id, 'game_name' => $request->game_name]
        );

        $stats->games_played += 1;
        if ($request->result === 'won') {
            $stats->games_won += 1;
            if (!$stats->best_time || $request->time < $stats->best_time) {
                $stats->best_time = $request->time;
            }
        } else {
            $stats->games_lost += 1;
        }
        $stats->total_time += $request->time;
        $stats->save();

        GameHistory::create([
            'user_id' => $user->id,
            'game_name' => $request->game_name,
            'difficulty' => $request->difficulty,
            'result' => $request->result,
            'time' => $request->time,
            'lives_left' => $request->lives_left
        ]);

        return response()->json(['stats' => $stats, 'message' => 'Stats and history updated']);
    }

    public function getHistory(Request $request, $gameName)
    {
        $history = GameHistory::where('user_id', $request->user()->id)
            ->where('game_name', $gameName)
            ->orderBy('created_at', 'desc')
            ->paginate(5);

        return response()->json($history);
    }

    public function getStats(Request $request, $gameName)
    {
        $stats = GameStats::where('user_id', $request->user()->id)
            ->where('game_name', $gameName)
            ->first();

        return response()->json($stats);
    }
}
