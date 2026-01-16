<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\Course;
use App\Models\Lesson;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class MaterialController extends Controller
{
    protected $driveService;

    public function __construct(GoogleDriveService $driveService)
    {
        $this->driveService = $driveService;
    }
    /**
     * Get materials by course
     */
    public function getByCourse($courseId)
    {
        $materials = Material::where('course_id', $courseId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($m) => $this->formatMaterial($m));

        return response()->json($materials);
    }

    /**
     * Get materials by lesson
     */
    public function getByLesson($lessonId)
    {
        $materials = Material::where('lesson_id', $lessonId)
            ->orderBy('created_at', 'desc')
            ->get();

        Log::info('Getting materials for lesson', [
            'lesson_id' => $lessonId,
            'count' => $materials->count(),
            'materials' => $materials->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'has_drive_id' => !empty($m->drive_file_id),
                'file_url' => $m->file_url,
            ])
        ]);

        return response()->json($materials->map(fn($m) => $this->formatMaterial($m)));
    }

    /**
     * Get material by ID with Drive file info
     */
    public function show(Request $request, $id)
    {
        $material = Material::find($id);
        
        if (!$material) {
            return $this->error('Material not found', 404);
        }

        // If has drive_file_id, get fresh info from Drive
        if ($material->drive_file_id) {
            try {
                $user = $request->user();
                $driveFile = $this->driveService->getFile($user->id, $material->drive_file_id);
                
                // Update file_url if changed
                if (isset($driveFile['webContentLink'])) {
                    $material->file_url = $driveFile['webContentLink'];
                }
            } catch (\Exception $e) {
                Log::warning('Failed to get Drive file info', [
                    'material_id' => $id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return response()->json($this->formatMaterial($material));
    }

    /**
     * Get course materials without lesson
     */
    public function getCourseMaterialsWithoutLesson($courseId)
    {
        $materials = Material::where('course_id', $courseId)
            ->whereNull('lesson_id')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($m) => $this->formatMaterial($m));

        return response()->json($materials);
    }

    /**
     * Upload material (with file upload to Google Drive)
     */
    public function upload(Request $request)
    {
        // Log request để debug
        Log::info('Material upload request', [
            'has_file' => $request->hasFile('file'),
            'all_data' => $request->except(['file']),
            'files' => $request->allFiles(),
        ]);

        // Flexible validation - accept either file upload OR legacy format
        $validator = Validator::make($request->all(), [
            'courseId' => 'required|integer',
            'lessonId' => 'nullable|integer',
            'title' => 'required|string|max:255',
            'file' => 'nullable|file|max:102400', // Optional now
            'description' => 'nullable|string',
            // Legacy format fields
            'type' => 'nullable|string',
            'fileUrl' => 'nullable|string',
            'driveFileId' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            Log::error('Material upload validation failed', [
                'errors' => $validator->errors()->toArray()
            ]);
            return $this->error('Validation failed', 422, $validator->errors());
        }

        try {
            $user = $request->user();

            // Check if this is file upload or legacy format
            if ($request->hasFile('file')) {
                // NEW: Upload file to Drive
                $file = $request->file('file');
                
                $mimeType = $file->getMimeType();
                $extension = $file->getClientOriginalExtension();
                $type = $this->determineFileType($mimeType, $extension);

                Log::info('Uploading file to Google Drive', [
                    'user_id' => $user->id,
                    'filename' => $file->getClientOriginalName(),
                    'mime_type' => $mimeType,
                ]);

                $driveFile = $this->driveService->uploadFile(
                    $user->id,
                    $file,
                    $file->getClientOriginalName(),
                    $mimeType
                );

                $material = Material::create([
                    'course_id' => $request->courseId,
                    'lesson_id' => $request->lessonId,
                    'title' => $request->title,
                    'type' => $type,
                    'file_url' => $driveFile['webContentLink'],
                    'drive_file_id' => $driveFile['id'],
                    'description' => $request->description,
                    'uploaded_by' => $user->id,
                ]);

            } else {
                // LEGACY: Use provided URLs
                $material = Material::create([
                    'course_id' => $request->courseId,
                    'lesson_id' => $request->lessonId,
                    'title' => $request->title,
                    'type' => $request->type ?? 'FILE',
                    'file_url' => $request->fileUrl ?? 'https://example.com/placeholder.pdf',
                    'drive_file_id' => $request->driveFileId,
                    'description' => $request->description,
                    'uploaded_by' => $user->id,
                ]);
            }

            Log::info('Material created successfully', [
                'material_id' => $material->id,
                'drive_file_id' => $material->drive_file_id,
            ]);

            return response()->json($this->formatMaterial($material), 201);

        } catch (\Exception $e) {
            Log::error('Material upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->error('Failed to upload material: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Upload material (legacy - accepts pre-uploaded file URL)
     */
    public function uploadLegacy(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'courseId' => 'required|integer',
            'lessonId' => 'nullable|integer',
            'title' => 'required|string|max:255',
            'type' => 'required|string',
            'fileUrl' => 'required|string',
            'driveFileId' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $material = Material::create([
            'course_id' => $request->courseId,
            'lesson_id' => $request->lessonId,
            'title' => $request->title,
            'type' => $request->type,
            'file_url' => $request->fileUrl,
            'drive_file_id' => $request->driveFileId,
            'uploaded_by' => $request->user()->id ?? 1,
        ]);

        return response()->json($this->formatMaterial($material), 201);
    }

    /**
     * Update material (replace file if new file provided)
     */
    public function update(Request $request, $id)
    {
        $material = Material::find($id);
        if (!$material) {
            return $this->error('Material not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|file|max:102400', // Max 100MB
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        try {
            $user = $request->user();

            // Update title and description
            if ($request->has('title')) {
                $material->title = $request->title;
            }
            if ($request->has('description')) {
                $material->description = $request->description;
            }

            // If new file provided, replace old file
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $mimeType = $file->getMimeType();
                $extension = $file->getClientOriginalExtension();
                $type = $this->determineFileType($mimeType, $extension);

                // Delete old file from Drive
                if ($material->drive_file_id) {
                    try {
                        $this->driveService->deleteFile($user->id, $material->drive_file_id);
                        Log::info('Deleted old file from Drive', ['drive_file_id' => $material->drive_file_id]);
                    } catch (\Exception $e) {
                        Log::warning('Failed to delete old file from Drive', ['error' => $e->getMessage()]);
                    }
                }

                // Upload new file to Drive
                Log::info('Uploading new file to Google Drive', [
                    'user_id' => $user->id,
                    'filename' => $file->getClientOriginalName(),
                ]);

                $driveFile = $this->driveService->uploadFile(
                    $user->id,
                    $file,
                    $file->getClientOriginalName(),
                    $mimeType
                );

                // Update material with new file info
                $material->type = $type;
                $material->file_url = $driveFile['webContentLink'];
                $material->drive_file_id = $driveFile['id'];
            }

            $material->save();

            return response()->json($this->formatMaterial($material));

        } catch (\Exception $e) {
            Log::error('Material update failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->error('Failed to update material: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete material (also delete from Google Drive)
     */
    public function destroy(Request $request, $id)
    {
        $material = Material::find($id);
        if (!$material) {
            return $this->error('Material not found', 404);
        }

        try {
            // Delete from Google Drive if drive_file_id exists
            if ($material->drive_file_id) {
                $user = $request->user();
                $this->driveService->deleteFile($user->id, $material->drive_file_id);
                Log::info('Deleted file from Google Drive', ['drive_file_id' => $material->drive_file_id]);
            }

            // Delete from MySQL
            $material->delete();

            return response()->json(['message' => 'Xóa tài liệu thành công']);

        } catch (\Exception $e) {
            Log::error('Failed to delete material', ['error' => $e->getMessage()]);
            // Still delete from MySQL even if Drive deletion fails
            $material->delete();
            return response()->json(['message' => 'Đã xóa tài liệu khỏi database (Drive file có thể vẫn tồn tại)']);
        }
    }

    /**
     * Download/proxy file from Google Drive
     */
    public function download(Request $request, $id)
    {
        $material = Material::find($id);
        
        if (!$material) {
            return $this->error('Material not found', 404);
        }

        if (!$material->drive_file_id) {
            return $this->error('File not available on Drive', 404);
        }

        try {
            $user = $request->user();
            $accessToken = $this->driveService->getAccessToken($user->id);
            
            if (!$accessToken) {
                return $this->error('Google Drive not connected', 403);
            }

            // Get file content from Drive
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
            ])->get("https://www.googleapis.com/drive/v3/files/{$material->drive_file_id}?alt=media");

            if ($response->failed()) {
                Log::error('Failed to download from Drive', [
                    'material_id' => $id,
                    'drive_file_id' => $material->drive_file_id,
                    'status' => $response->status()
                ]);
                return $this->error('Failed to download file from Drive', 500);
            }

            // Return file with proper headers
            return response($response->body())
                ->header('Content-Type', $material->type === 'PDF' ? 'application/pdf' : 'application/octet-stream')
                ->header('Content-Disposition', 'inline; filename="' . $material->title . '"')
                ->header('Access-Control-Allow-Origin', '*');

        } catch (\Exception $e) {
            Log::error('Download error', ['error' => $e->getMessage()]);
            return $this->error('Failed to download file: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get file stream URL (for embedding)
     */
    public function stream($id)
    {
        $material = Material::find($id);
        
        if (!$material) {
            return $this->error('Material not found', 404);
        }

        if (!$material->drive_file_id) {
            return $this->error('File not available on Drive', 404);
        }

        // Return embeddable Drive URL
        $embedUrl = "https://drive.google.com/file/d/{$material->drive_file_id}/preview";
        
        return response()->json([
            'id' => $material->id,
            'title' => $material->title,
            'type' => $material->type,
            'embedUrl' => $embedUrl,
            'downloadUrl' => url("/api/materials/{$id}/download"),
            'driveViewUrl' => "https://drive.google.com/file/d/{$material->drive_file_id}/view",
        ]);
    }

    /**
     * TEST ENDPOINT - Get materials without auth (for debugging)
     * Remove this in production!
     */
    public function testGetMaterials($lessonId)
    {
        $materials = Material::where('lesson_id', $lessonId)
            ->orderBy('created_at', 'desc')
            ->get();

        $result = [
            'lesson_id' => $lessonId,
            'total_materials' => $materials->count(),
            'materials' => $materials->map(function($m) {
                return [
                    'id' => $m->id,
                    'title' => $m->title,
                    'type' => $m->type,
                    'file_url' => $m->file_url,
                    'drive_file_id' => $m->drive_file_id,
                    'has_drive_id' => !empty($m->drive_file_id),
                    'created_at' => $m->created_at,
                    // Test URLs
                    'test_urls' => [
                        'original' => $m->file_url,
                        'embed' => $m->drive_file_id ? "https://drive.google.com/file/d/{$m->drive_file_id}/preview" : null,
                        'direct' => $m->drive_file_id ? "https://drive.google.com/uc?id={$m->drive_file_id}&export=download" : null,
                    ]
                ];
            })
        ];

        return response()->json($result);
    }

    /**
     * TEST ENDPOINT - Get ALL materials (for debugging)
     */
    public function testGetAllMaterials()
    {
        $materials = Material::orderBy('created_at', 'desc')->limit(20)->get();

        $result = [
            'total_materials' => Material::count(),
            'showing' => $materials->count(),
            'materials' => $materials->map(function($m) {
                return [
                    'id' => $m->id,
                    'course_id' => $m->course_id,
                    'lesson_id' => $m->lesson_id,
                    'title' => $m->title,
                    'type' => $m->type,
                    'file_url' => substr($m->file_url, 0, 100),
                    'drive_file_id' => $m->drive_file_id,
                    'has_drive_id' => !empty($m->drive_file_id),
                    'created_at' => $m->created_at,
                ];
            })
        ];

        return response()->json($result);
    }

    /**
     * TEST ENDPOINT - Simple upload without Drive (for debugging)
     */
    public function testUploadSimple(Request $request)
    {
        try {
            // Log everything
            $debug = [
                'method' => $request->method(),
                'content_type' => $request->header('Content-Type'),
                'has_file' => $request->hasFile('file'),
                'all_input' => $request->except(['file']),
                'all_files' => array_keys($request->allFiles()),
            ];

            Log::info('Test upload request', $debug);

            // Simple validation
            if (!$request->has('title')) {
                return response()->json(['error' => 'Missing title', 'debug' => $debug], 422);
            }

            if (!$request->has('courseId')) {
                return response()->json(['error' => 'Missing courseId', 'debug' => $debug], 422);
            }

            // Create material without file upload
            $material = Material::create([
                'course_id' => $request->courseId,
                'lesson_id' => $request->lessonId,
                'title' => $request->title,
                'type' => $request->type ?? 'FILE',
                'file_url' => $request->fileUrl ?? 'https://example.com/test.pdf',
                'drive_file_id' => $request->driveFileId,
                'description' => $request->description,
                'uploaded_by' => 1, // Test user
            ]);

            return response()->json([
                'success' => true,
                'material' => $this->formatMaterial($material),
                'debug' => $debug
            ], 201);

        } catch (\Exception $e) {
            Log::error('Test upload failed', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    private function determineFileType($mimeType, $extension)
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'IMAGE';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'VIDEO';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            return 'AUDIO';
        } elseif ($mimeType === 'application/pdf') {
            return 'PDF';
        } elseif (in_array($extension, ['doc', 'docx'])) {
            return 'DOCUMENT';
        } elseif (in_array($extension, ['ppt', 'pptx'])) {
            return 'PRESENTATION';
        } elseif (in_array($extension, ['xls', 'xlsx'])) {
            return 'SPREADSHEET';
        } else {
            return 'FILE';
        }
    }

    private function formatMaterial($material)
    {
        $data = [
            'id' => $material->id,
            'courseId' => $material->course_id,
            'lessonId' => $material->lesson_id,
            'title' => $material->title,
            'type' => $material->type,
            'fileUrl' => $material->file_url, // Original URL (may be local or Drive)
            'driveFileId' => $material->drive_file_id,
            'createdAt' => $material->created_at,
        ];

        // Add convenient URLs if drive_file_id exists
        if ($material->drive_file_id) {
            $data['embedUrl'] = "https://drive.google.com/file/d/{$material->drive_file_id}/preview";
            $data['downloadUrl'] = url("/api/materials/{$material->id}/download");
            $data['driveViewUrl'] = "https://drive.google.com/file/d/{$material->drive_file_id}/view";
            $data['directDownloadUrl'] = "https://drive.google.com/uc?id={$material->drive_file_id}&export=download";
            
            // Set viewUrl to best option for embedding
            $data['viewUrl'] = $data['embedUrl'];
        } else {
            // Fallback for old materials without drive_file_id
            // Use original fileUrl (may be local path or old Drive link)
            $data['viewUrl'] = $material->file_url;
            $data['embedUrl'] = $material->file_url;
            $data['downloadUrl'] = $material->file_url;
        }

        return $data;
    }
}
