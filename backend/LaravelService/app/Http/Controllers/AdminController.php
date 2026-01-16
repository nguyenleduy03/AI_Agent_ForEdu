<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Course;
use App\Models\SystemLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    /**
     * Get all users (Admin only)
     */
    public function getUsers(Request $request)
    {
        if ($request->user()->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        $users = User::orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'email' => $user->email,
                    'fullName' => $user->full_name,
                    'role' => $user->role,
                    'avatarUrl' => $user->avatar_url,
                    'createdAt' => $user->created_at,
                ];
            });

        return response()->json($users);
    }

    /**
     * Update user role
     */
    public function updateUserRole(Request $request, $id)
    {
        if ($request->user()->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        $validator = Validator::make($request->all(), [
            'role' => 'required|in:STUDENT,TEACHER,ADMIN',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $user = User::find($id);
        if (!$user) {
            return $this->error('User not found', 404);
        }

        $user->role = $request->role;
        $user->save();

        return response()->json(['message' => 'User role updated successfully']);
    }

    /**
     * Delete user
     */
    public function deleteUser(Request $request, $id)
    {
        if ($request->user()->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        $user = User::find($id);
        if (!$user) {
            return $this->error('User not found', 404);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Get system statistics
     */
    public function getStats(Request $request)
    {
        if ($request->user()->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        return response()->json([
            'totalUsers' => User::count(),
            'totalStudents' => User::where('role', 'STUDENT')->count(),
            'totalTeachers' => User::where('role', 'TEACHER')->count(),
            'totalCourses' => Course::count(),
            'publishedCourses' => Course::where('is_published', true)->count(),
        ]);
    }

    /**
     * Get system logs
     */
    public function getLogs(Request $request)
    {
        if ($request->user()->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        $logs = SystemLog::with('user:id,email,full_name')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'userId' => $log->user_id,
                    'userEmail' => $log->user->email ?? null,
                    'action' => $log->action,
                    'entityType' => $log->entity_type,
                    'entityId' => $log->entity_id,
                    'details' => $log->details,
                    'ipAddress' => $log->ip_address,
                    'createdAt' => $log->created_at,
                ];
            });

        return response()->json($logs);
    }
}
