<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

// Rutas de la API (Sin prefijo /api porque están en web.php)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Game Session Routes
    Route::post('/game/session', [GameController::class, 'saveSession']);
    Route::get('/game/session/{gameName}', [GameController::class, 'getSession']);
    Route::delete('/game/session/{gameName}', [GameController::class, 'deleteSession']);

    // Game Stats & History Routes
    Route::post('/game/stats', [GameController::class, 'updateStats']);
    Route::get('/game/stats/{gameName}', [GameController::class, 'getStats']);
    Route::get('/game/history/{gameName}', [GameController::class, 'getHistory']);
});

// Ruta por defecto para el inicio (opcional)
Route::get('/', function () {
    return view('welcome');
});
