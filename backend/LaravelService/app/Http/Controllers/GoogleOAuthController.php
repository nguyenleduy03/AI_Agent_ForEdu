<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class GoogleOAuthController extends Controller
{
    /**
     * Get Google OAuth authorization URL
     */
    public function getAuthUrl(Request $request)
    {
        $clientId = config('services.google.client_id');
        $redirectUri = config('services.google.redirect_uri');
        
        if (!$clientId || $clientId === 'your-google-client-id') {
            return $this->error('Google OAuth not configured. Please set GOOGLE_CLIENT_ID in .env', 500);
        }

        $scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
        ];

        $params = [
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', $scopes),
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $request->user()->id, // Pass user ID in state
        ];

        $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);

        return response()->json(['authUrl' => $authUrl]);
    }

    /**
     * Handle OAuth callback
     */
    public function handleCallback(Request $request)
    {
        $code = $request->query('code');
        $state = $request->query('state'); // user_id
        $error = $request->query('error');

        if ($error) {
            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/settings?google_error=' . $error);
        }

        if (!$code || !$state) {
            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/settings?google_error=missing_params');
        }

        try {
            // Exchange code for tokens
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'code' => $code,
                'redirect_uri' => config('services.google.redirect_uri'),
                'grant_type' => 'authorization_code',
            ]);

            if ($response->failed()) {
                return redirect(config('app.frontend_url', 'http://localhost:5173') . '/settings?google_error=token_exchange_failed');
            }

            $data = $response->json();

            // Save tokens to user
            $user = User::find($state);
            if (!$user) {
                return redirect(config('app.frontend_url', 'http://localhost:5173') . '/settings?google_error=user_not_found');
            }

            $user->google_access_token = $data['access_token'];
            $user->google_refresh_token = $data['refresh_token'] ?? $user->google_refresh_token;
            $user->google_token_expiry = now()->addSeconds($data['expires_in']);
            $user->save();

            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/settings?google_connected=true');

        } catch (\Exception $e) {
            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/settings?google_error=' . urlencode($e->getMessage()));
        }
    }

    /**
     * Save Google OAuth tokens
     */
    public function saveTokens(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'accessToken' => 'required|string',
            'refreshToken' => 'nullable|string',
            'expiresIn' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $user = $request->user();
        $user->google_access_token = $request->accessToken;
        
        if ($request->refreshToken) {
            $user->google_refresh_token = $request->refreshToken;
        }
        
        $user->google_token_expiry = now()->addSeconds($request->expiresIn);
        $user->save();

        return response()->json([
            'message' => 'Google tokens saved successfully',
            'expiresAt' => $user->google_token_expiry,
        ]);
    }

    /**
     * Get Google connection status
     */
    public function getStatus(Request $request)
    {
        $user = $request->user();

        $isConnected = !empty($user->google_access_token);
        $isExpired = $user->google_token_expiry ? $user->google_token_expiry < now() : true;

        return response()->json([
            'isConnected' => $isConnected,
            'isExpired' => $isExpired,
            'expiresAt' => $user->google_token_expiry,
        ]);
    }

    /**
     * Refresh Google access token
     */
    public function refreshToken(Request $request)
    {
        $user = $request->user();

        if (!$user->google_refresh_token) {
            return $this->error('No refresh token available', 400);
        }

        try {
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'refresh_token' => $user->google_refresh_token,
                'grant_type' => 'refresh_token',
            ]);

            if ($response->failed()) {
                return $this->error('Failed to refresh token', 400);
            }

            $data = $response->json();

            $user->google_access_token = $data['access_token'];
            $user->google_token_expiry = now()->addSeconds($data['expires_in']);
            $user->save();

            return response()->json([
                'accessToken' => $data['access_token'],
                'expiresAt' => $user->google_token_expiry,
            ]);
        } catch (\Exception $e) {
            return $this->error('Failed to refresh token: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Disconnect Google account
     */
    public function disconnect(Request $request)
    {
        $user = $request->user();
        $user->google_access_token = null;
        $user->google_refresh_token = null;
        $user->google_token_expiry = null;
        $user->save();

        return response()->json(['message' => 'Google account disconnected']);
    }

    /**
     * Get Google access token for API calls
     */
    public function getAccessToken(Request $request)
    {
        $user = $request->user();

        if (!$user->google_access_token) {
            return $this->error('Google not connected', 400);
        }

        // Check if token is expired
        if ($user->google_token_expiry && $user->google_token_expiry < now()) {
            // Try to refresh
            if ($user->google_refresh_token) {
                $refreshResponse = $this->refreshToken($request);
                if ($refreshResponse->getStatusCode() !== 200) {
                    return $this->error('Token expired and refresh failed', 401);
                }
                $user->refresh();
            } else {
                return $this->error('Token expired', 401);
            }
        }

        return response()->json([
            'accessToken' => $user->google_access_token,
            'expiresAt' => $user->google_token_expiry,
        ]);
    }

    /**
     * Get Google access token by user ID (for internal services like Python)
     * No authentication required - for internal API calls only
     */
    public function getAccessTokenByUserId($userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'error' => 'User not found',
                'need_auth' => true
            ], 404);
        }

        if (!$user->google_access_token) {
            return response()->json([
                'error' => 'Google not connected',
                'need_auth' => true
            ], 400);
        }

        // Check if token is expired and refresh if needed
        if ($user->google_token_expiry && $user->google_token_expiry < now()) {
            if ($user->google_refresh_token) {
                try {
                    $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                        'client_id' => config('services.google.client_id'),
                        'client_secret' => config('services.google.client_secret'),
                        'refresh_token' => $user->google_refresh_token,
                        'grant_type' => 'refresh_token',
                    ]);

                    if ($response->successful()) {
                        $data = $response->json();
                        $user->google_access_token = $data['access_token'];
                        $user->google_token_expiry = now()->addSeconds($data['expires_in']);
                        $user->save();
                    } else {
                        return response()->json([
                            'error' => 'Token expired and refresh failed',
                            'need_auth' => true
                        ], 401);
                    }
                } catch (\Exception $e) {
                    return response()->json([
                        'error' => 'Token refresh error: ' . $e->getMessage(),
                        'need_auth' => true
                    ], 500);
                }
            } else {
                return response()->json([
                    'error' => 'Token expired',
                    'need_auth' => true
                ], 401);
            }
        }

        return response()->json([
            'access_token' => $user->google_access_token,
            'expires_at' => $user->google_token_expiry,
        ]);
    }
}
