<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Register new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'username' => 'nullable|string|unique:users,username|max:50',
            'password' => 'required|min:6',
            'fullName' => 'required|string|max:255',
            'role' => 'in:STUDENT,TEACHER,ADMIN',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        // Generate username from email if not provided
        $username = $request->username ?? explode('@', $request->email)[0];
        
        // Ensure username is unique
        $baseUsername = $username;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $baseUsername . $counter;
            $counter++;
        }

        $user = User::create([
            'email' => $request->email,
            'username' => $username,
            'password' => Hash::make($request->password),
            'full_name' => $request->fullName,
            'role' => $request->role ?? 'STUDENT',
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token' => $token,
            'user' => $this->formatUser($user),
        ], 201);
    }

    /**
     * Login user (supports both username and email)
     */
    public function login(Request $request)
    {
        // Accept either username or email
        $validator = Validator::make($request->all(), [
            'username' => 'required_without:email|string',
            'email' => 'required_without:username|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        // Try to find user by username or email
        $user = null;
        if ($request->has('username')) {
            $user = User::where('username', $request->username)->first();
        } elseif ($request->has('email')) {
            $user = User::where('email', $request->email)->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->error('Invalid credentials', 401);
        }

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token' => $token,
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Get current user profile
     */
    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json($this->formatUser($user));
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'fullName' => 'string|max:255',
            'avatarUrl' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        if ($request->has('fullName')) {
            $user->full_name = $request->fullName;
        }
        if ($request->has('avatarUrl')) {
            $user->avatar_url = $request->avatarUrl;
        }

        $user->save();

        return response()->json($this->formatUser($user));
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'currentPassword' => 'required',
            'newPassword' => 'required|min:6',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $user = $request->user();

        if (!Hash::check($request->currentPassword, $user->password)) {
            return $this->error('Current password is incorrect', 400);
        }

        $user->password = Hash::make($request->newPassword);
        $user->save();

        return response()->json(['message' => 'Password changed successfully']);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json(['message' => 'Successfully logged out']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Successfully logged out']);
        }
    }

    /**
     * Refresh token
     */
    public function refresh()
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            return response()->json(['token' => $token]);
        } catch (\Exception $e) {
            return $this->error('Could not refresh token', 401);
        }
    }

    private function formatUser($user)
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'fullName' => $user->full_name,
            'avatarUrl' => $user->avatar_url,
            'role' => $user->role,
            'createdAt' => $user->created_at,
            'updatedAt' => $user->updated_at,
        ];
    }
}
