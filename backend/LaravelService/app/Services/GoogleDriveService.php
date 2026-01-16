<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\UserCredential;

class GoogleDriveService
{
    /**
     * Upload file to Google Drive
     */
    public function uploadFile($userId, $file, $fileName, $mimeType, $folderId = null)
    {
        try {
            // Get user's Google access token
            $accessToken = $this->getAccessToken($userId);
            
            if (!$accessToken) {
                throw new \Exception('No Google Drive access token found. Please connect your Google account.');
            }

            // Step 1: Create file metadata
            $metadata = [
                'name' => $fileName,
                'mimeType' => $mimeType,
            ];

            if ($folderId) {
                $metadata['parents'] = [$folderId];
            }

            // Step 2: Upload file using multipart upload
            $boundary = uniqid();
            $delimiter = "\r\n--" . $boundary . "\r\n";
            $closeDelimiter = "\r\n--" . $boundary . "--";

            $multipartBody = $delimiter;
            $multipartBody .= "Content-Type: application/json; charset=UTF-8\r\n\r\n";
            $multipartBody .= json_encode($metadata);
            $multipartBody .= $delimiter;
            $multipartBody .= "Content-Type: " . $mimeType . "\r\n\r\n";
            $multipartBody .= file_get_contents($file->getRealPath());
            $multipartBody .= $closeDelimiter;

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'multipart/related; boundary=' . $boundary,
            ])->withBody($multipartBody)
              ->post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');

            if ($response->failed()) {
                Log::error('Google Drive upload failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Failed to upload file to Google Drive: ' . $response->body());
            }

            $fileData = $response->json();

            // Step 3: Make file publicly accessible (optional)
            $this->makeFilePublic($fileData['id'], $accessToken);

            return [
                'id' => $fileData['id'],
                'name' => $fileData['name'],
                'mimeType' => $fileData['mimeType'],
                'webViewLink' => "https://drive.google.com/file/d/{$fileData['id']}/view",
                'webContentLink' => "https://drive.google.com/uc?id={$fileData['id']}&export=download",
            ];

        } catch (\Exception $e) {
            Log::error('Google Drive upload error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Get file from Google Drive
     */
    public function getFile($userId, $fileId)
    {
        try {
            $accessToken = $this->getAccessToken($userId);
            
            if (!$accessToken) {
                throw new \Exception('No Google Drive access token found.');
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
            ])->get("https://www.googleapis.com/drive/v3/files/{$fileId}?fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime");

            if ($response->failed()) {
                throw new \Exception('Failed to get file from Google Drive');
            }

            return $response->json();

        } catch (\Exception $e) {
            Log::error('Google Drive get file error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Delete file from Google Drive
     */
    public function deleteFile($userId, $fileId)
    {
        try {
            $accessToken = $this->getAccessToken($userId);
            
            if (!$accessToken) {
                throw new \Exception('No Google Drive access token found.');
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
            ])->delete("https://www.googleapis.com/drive/v3/files/{$fileId}");

            if ($response->failed()) {
                throw new \Exception('Failed to delete file from Google Drive');
            }

            return true;

        } catch (\Exception $e) {
            Log::error('Google Drive delete file error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Make file publicly accessible
     */
    private function makeFilePublic($fileId, $accessToken)
    {
        try {
            Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ])->post("https://www.googleapis.com/drive/v3/files/{$fileId}/permissions", [
                'role' => 'reader',
                'type' => 'anyone',
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to make file public', ['error' => $e->getMessage()]);
            // Don't throw - this is optional
        }
    }

    /**
     * Get user's Google access token from Laravel
     */
    public function getAccessToken($userId)
    {
        // Call Laravel OAuth endpoint to get access token
        try {
            $response = Http::withHeaders([
                'X-User-Id' => $userId,
            ])->get('http://localhost:8080/api/google/access-token');

            if ($response->successful()) {
                $data = $response->json();
                return $data['access_token'] ?? null;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Failed to get access token', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
