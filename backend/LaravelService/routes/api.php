<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\FlashcardController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\GoogleOAuthController;
use App\Http\Controllers\UserCredentialController;
use App\Http\Controllers\SchoolCredentialController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\LogController;

/*
|--------------------------------------------------------------------------
| API Routes - Port 8080 (Same as Spring Boot)
|--------------------------------------------------------------------------
*/

// ===== PUBLIC ROUTES =====
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// ===== INTERNAL API (No Auth - For Python Service) =====
Route::prefix('chat/internal')->group(function () {
    Route::get('/sessions/{sessionId}/messages', [ChatController::class, 'getMessagesInternal']);
});

Route::prefix('credentials')->group(function () {
    Route::get('/user/{userId}', [UserCredentialController::class, 'getByUserId']);
    Route::get('/{id}/decrypt', [UserCredentialController::class, 'getDecrypted']);
});

Route::prefix('oauth/google')->group(function () {
    Route::get('/token/{userId}', [GoogleOAuthController::class, 'getAccessTokenByUserId']);
    Route::get('/callback', [GoogleOAuthController::class, 'handleCallback']);
});

// ===== TEST ENDPOINTS (No Auth) - Remove in production! =====
Route::get('/test/materials/lesson/{lessonId}', [MaterialController::class, 'testGetMaterials']);
Route::get('/test/materials/all', [MaterialController::class, 'testGetAllMaterials']);
Route::post('/test/materials/upload-simple', [MaterialController::class, 'testUploadSimple']);

// ===== PROTECTED ROUTES =====
Route::middleware('jwt.auth')->group(function () {
    
    // Auth
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/profile', [AuthController::class, 'me']); // Alias for SpringService compatibility
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });

    // Chat Sessions
    Route::prefix('chat')->group(function () {
        Route::get('/sessions', [ChatController::class, 'getSessions']);
        Route::post('/sessions', [ChatController::class, 'createSession']);
        Route::delete('/sessions/{id}', [ChatController::class, 'deleteSession']);
        Route::get('/sessions/{sessionId}/messages', [ChatController::class, 'getMessages']);
        Route::post('/sessions/{sessionId}/messages', [ChatController::class, 'addMessage']);
    });

    // Courses
    Route::prefix('courses')->group(function () {
        Route::get('/', [CourseController::class, 'index']);
        Route::get('/my', [CourseController::class, 'myCourses']);
        Route::get('/enrolled', [CourseController::class, 'myEnrollments']);
        Route::get('/{id}', [CourseController::class, 'show']);
        Route::post('/', [CourseController::class, 'store']);
        Route::put('/{id}', [CourseController::class, 'update']);
        Route::delete('/{id}', [CourseController::class, 'destroy']);
        Route::post('/{id}/enroll', [CourseController::class, 'enroll']);
        
        // Lessons
        Route::get('/{courseId}/lessons', [LessonController::class, 'index']);
        Route::get('/{courseId}/lessons/{id}', [LessonController::class, 'show']);
        Route::post('/{courseId}/lessons', [LessonController::class, 'store']);
        Route::put('/{courseId}/lessons/{id}', [LessonController::class, 'update']);
        Route::delete('/{courseId}/lessons/{id}', [LessonController::class, 'destroy']);
        Route::post('/{courseId}/lessons/{id}/progress', [LessonController::class, 'updateProgress']);
        
        // Quizzes
        Route::get('/{courseId}/quizzes', [QuizController::class, 'index']);
    });

    // Lesson shortcuts (without courseId)
    Route::prefix('lessons')->group(function () {
        Route::get('/{id}', [LessonController::class, 'showById']);
        Route::put('/{id}', [LessonController::class, 'updateById']);
        Route::delete('/{id}', [LessonController::class, 'destroyById']);
        Route::get('/{lessonId}/materials', [MaterialController::class, 'getByLesson']);
    });

    // Quizzes
    Route::prefix('quizzes')->group(function () {
        Route::get('/{id}', [QuizController::class, 'show']);
        Route::post('/', [QuizController::class, 'store']);
        Route::post('/{id}/submit', [QuizController::class, 'submit']);
        Route::get('/results/my', [QuizController::class, 'myResults']);
    });

    // Quiz (singular) - for frontend compatibility
    Route::prefix('quiz')->group(function () {
        Route::post('/generate', [QuizController::class, 'generate']); // AI generation
        Route::post('/create', [QuizController::class, 'store']); // Alias for create
        Route::get('/lesson/{lessonId}', [QuizController::class, 'getByLesson']); // Get by lesson
        Route::get('/{id}', [QuizController::class, 'show']); // Get quiz detail
        Route::put('/{id}', [QuizController::class, 'update']); // Update quiz
        Route::post('/{id}/publish', [QuizController::class, 'publish']); // Publish quiz
        Route::post('/{id}/submit', [QuizController::class, 'submit']); // Submit quiz
        Route::get('/materials/course/{courseId}', [MaterialController::class, 'getByCourse']); // Get materials for quiz generation
    });

    // Flashcards
    Route::prefix('flashcards')->group(function () {
        Route::get('/stats/overview', [FlashcardController::class, 'getOverviewStats']); // Dashboard stats
        Route::get('/decks', [FlashcardController::class, 'getDecks']);
        Route::post('/decks', [FlashcardController::class, 'createDeck']);
        Route::get('/decks/{id}', [FlashcardController::class, 'getDeck']);
        Route::put('/decks/{id}', [FlashcardController::class, 'updateDeck']); // Update deck
        Route::delete('/decks/{id}', [FlashcardController::class, 'deleteDeck']);
        Route::post('/decks/{deckId}/cards', [FlashcardController::class, 'addFlashcard']);
        Route::get('/decks/{deckId}/due', [FlashcardController::class, 'getDueCards']);
        Route::get('/decks/{deckId}/stats', [FlashcardController::class, 'getDeckStats']);
        Route::put('/cards/{cardId}', [FlashcardController::class, 'updateFlashcard']); // Update flashcard
        Route::delete('/cards/{cardId}', [FlashcardController::class, 'deleteFlashcard']); // Delete flashcard
        Route::post('/cards/{cardId}/review', [FlashcardController::class, 'reviewCard']);
    });

    // Schedules
    Route::prefix('schedules')->group(function () {
        Route::get('/', [ScheduleController::class, 'index']);
        Route::get('/today', [ScheduleController::class, 'today']);
        Route::get('/range', [ScheduleController::class, 'getByDateRange']);
        Route::post('/', [ScheduleController::class, 'store']);
        Route::put('/{id}', [ScheduleController::class, 'update']);
        Route::delete('/{id}', [ScheduleController::class, 'destroy']);
    });

    // Google OAuth
    Route::prefix('google')->group(function () {
        Route::get('/auth-url', [GoogleOAuthController::class, 'getAuthUrl']);
        Route::post('/tokens', [GoogleOAuthController::class, 'saveTokens']);
        Route::get('/status', [GoogleOAuthController::class, 'getStatus']);
        Route::post('/refresh', [GoogleOAuthController::class, 'refreshToken']);
        Route::post('/disconnect', [GoogleOAuthController::class, 'disconnect']);
        Route::get('/access-token', [GoogleOAuthController::class, 'getAccessToken']);
    });

    // User Credentials
    Route::prefix('credentials')->group(function () {
        Route::get('/', [UserCredentialController::class, 'index']);
        Route::post('/', [UserCredentialController::class, 'store']);
        Route::get('/{id}', [UserCredentialController::class, 'show']);
        Route::put('/{id}', [UserCredentialController::class, 'update']);
        Route::delete('/{id}', [UserCredentialController::class, 'destroy']);
        Route::post('/search', [UserCredentialController::class, 'search']);
        Route::post('/{id}/use', [UserCredentialController::class, 'logUsage']);
    });

    // School Credentials
    Route::prefix('school-credentials')->group(function () {
        Route::get('/', [SchoolCredentialController::class, 'index']);
        Route::post('/', [SchoolCredentialController::class, 'store']);
        Route::get('/{id}', [SchoolCredentialController::class, 'show']);
        Route::put('/{id}', [SchoolCredentialController::class, 'update']);
        Route::delete('/{id}', [SchoolCredentialController::class, 'destroy']);
        Route::post('/search', [SchoolCredentialController::class, 'getBySchoolName']);
    });

    // Progress
    Route::prefix('progress')->group(function () {
        Route::get('/', [ProgressController::class, 'getAllProgress']);
        Route::get('/my-courses', [ProgressController::class, 'getMyCoursesProgress']); // For dashboard
        Route::get('/courses/{courseId}', [ProgressController::class, 'getCourseProgress']);
        Route::post('/courses/{courseId}/complete', [ProgressController::class, 'completeCourse']);
    });

    // Admin (Admin only)
    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::put('/users/{id}/role', [AdminController::class, 'updateUserRole']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::get('/stats', [AdminController::class, 'getStats']);
        Route::get('/logs', [AdminController::class, 'getLogs']);
    });

    // Materials
    Route::get('/courses/{courseId}/materials', [MaterialController::class, 'getByCourse']);
    Route::get('/courses/{courseId}/materials/general', [MaterialController::class, 'getCourseMaterialsWithoutLesson']);
    Route::get('/materials/{id}', [MaterialController::class, 'show']); // Get material detail
    Route::get('/materials/{id}/stream', [MaterialController::class, 'stream']); // Get embed/stream URLs
    Route::get('/materials/{id}/download', [MaterialController::class, 'download']); // Download/proxy file
    Route::post('/materials/upload', [MaterialController::class, 'upload']); // New: Upload file directly
    Route::post('/materials/upload-legacy', [MaterialController::class, 'uploadLegacy']); // Legacy: Pre-uploaded URL
    Route::put('/materials/{id}', [MaterialController::class, 'update']); // Update material (replace file)
    Route::delete('/materials/{id}', [MaterialController::class, 'destroy']);

    // Teacher Management
    Route::prefix('teacher')->group(function () {
        Route::get('/courses/{courseId}/students', [TeacherController::class, 'getCourseStudents']);
        Route::delete('/courses/{courseId}/students/{studentId}', [TeacherController::class, 'removeStudent']);
        Route::get('/my-courses', [TeacherController::class, 'getMyCourses']);
        Route::get('/courses/{courseId}/students/{studentId}/detail', [TeacherController::class, 'getStudentDetail']);
        Route::get('/courses/{courseId}/analytics', [TeacherController::class, 'getCourseAnalytics']);
    });

    // System Logs (Admin only)
    Route::prefix('logs')->group(function () {
        Route::get('/', [LogController::class, 'index']);
        Route::get('/user/{id}', [LogController::class, 'getUserLogs']);
    });
});
