<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return response()->json([
        'name' => 'AgentForEdu API',
        'version' => '1.0.0',
        'status' => 'running',
        'documentation' => '/api/documentation'
    ]);
});

Route::get('/test', function () {
    return response()->json(['message' => 'Test OK', 'time' => now()]);
});
