<?php

use Illuminate\Support\Facades\Route;

// Solo dejamos la ruta de bienvenida o una redirección
Route::get('/', function () {
    return ['message' => 'Nexus Arcade API is running'];
});
