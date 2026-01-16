<?php

namespace App\Http\Controllers;

use App\Models\SystemLog;
use Illuminate\Http\Request;

class LogController extends Controller
{
    /**
     * Get all system logs (Admin only)
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        $logs = SystemLog::with('user:id,email,full_name')
            ->orderBy('created_at', 'desc')
            ->limit(500)
            ->get();

        return response()->json($logs);
    }

    /**
     * Get logs by user (Admin only)
     */
    public function getUserLogs(Request $request, $userId)
    {
        if ($request->user()->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        $logs = SystemLog::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json($logs);
    }
}
