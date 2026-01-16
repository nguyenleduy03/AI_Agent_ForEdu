<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizResult;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;

class QuizController extends Controller
{
    /**
     * Get quizzes for a course
     */
    public function index($courseId)
    {
        $quizzes = Quiz::where('course_id', $courseId)
            ->where('is_public', true)
            ->withCount('questions')
            ->get()
            ->map(function ($quiz) {
                return $this->formatQuiz($quiz);
            });

        return response()->json($quizzes);
    }

    /**
     * Get quiz by ID with questions
     */
    public function show($id)
    {
        $quiz = Quiz::with('questions')->find($id);

        if (!$quiz) {
            return $this->error('Quiz not found', 404);
        }

        return response()->json($this->formatQuiz($quiz, true));
    }

    /**
     * Create new quiz
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['TEACHER', 'ADMIN'])) {
            return $this->error('Only teachers can create quizzes', 403);
        }

        $validator = Validator::make($request->all(), [
            'courseId' => 'required|exists:courses,id',
            'lessonId' => 'nullable|exists:lessons,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'difficulty' => 'in:EASY,MEDIUM,HARD',
            'timeLimitMinutes' => 'integer|min:1',
            'passScore' => 'integer|min:0|max:100',
            'questions' => 'required|array|min:1',
            'questions.*.question' => 'required|string',
            'questions.*.optionA' => 'required|string',
            'questions.*.optionB' => 'required|string',
            'questions.*.optionC' => 'required|string',
            'questions.*.optionD' => 'required|string',
            'questions.*.correctAnswer' => 'required|in:A,B,C,D',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.points' => 'integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $quiz = Quiz::create([
            'course_id' => $request->courseId,
            'lesson_id' => $request->lessonId,
            'title' => $request->title,
            'description' => $request->description,
            'difficulty' => $request->difficulty ?? 'MEDIUM',
            'time_limit_minutes' => $request->timeLimitMinutes ?? 30,
            'pass_score' => $request->passScore ?? 60,
            'is_public' => false,
        ]);

        foreach ($request->questions as $q) {
            QuizQuestion::create([
                'quiz_id' => $quiz->id,
                'question' => $q['question'],
                'option_a' => $q['optionA'],
                'option_b' => $q['optionB'],
                'option_c' => $q['optionC'],
                'option_d' => $q['optionD'],
                'correct_answer' => $q['correctAnswer'],
                'explanation' => $q['explanation'] ?? null,
                'points' => $q['points'] ?? 1,
            ]);
        }

        return response()->json($this->formatQuiz($quiz->load('questions'), true), 201);
    }

    /**
     * Update existing quiz
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $quiz = Quiz::find($id);

        if (!$quiz) {
            return $this->error('Quiz not found', 404);
        }

        // Only teacher/admin can update
        if (!in_array($user->role, ['TEACHER', 'ADMIN'])) {
            return $this->error('Only teachers can update quizzes', 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'difficulty' => 'in:EASY,MEDIUM,HARD',
            'questions' => 'array',
            'questions.*.id' => 'nullable|integer',
            'questions.*.question' => 'required|string',
            'questions.*.optionA' => 'required|string',
            'questions.*.optionB' => 'required|string',
            'questions.*.optionC' => 'required|string',
            'questions.*.optionD' => 'required|string',
            'questions.*.correctAnswer' => 'required|in:A,B,C,D',
            'questions.*.explanation' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        // Update quiz info
        if ($request->has('title')) {
            $quiz->title = $request->title;
        }
        if ($request->has('description')) {
            $quiz->description = $request->description;
        }
        if ($request->has('difficulty')) {
            $quiz->difficulty = $request->difficulty;
        }
        $quiz->save();

        // Update questions if provided
        if ($request->has('questions')) {
            foreach ($request->questions as $q) {
                if (isset($q['id'])) {
                    // Update existing question
                    $question = QuizQuestion::find($q['id']);
                    if ($question && $question->quiz_id == $quiz->id) {
                        $question->update([
                            'question' => $q['question'],
                            'option_a' => $q['optionA'],
                            'option_b' => $q['optionB'],
                            'option_c' => $q['optionC'],
                            'option_d' => $q['optionD'],
                            'correct_answer' => $q['correctAnswer'],
                            'explanation' => $q['explanation'] ?? null,
                        ]);
                    }
                }
            }
        }

        return response()->json($this->formatQuiz($quiz->load('questions'), true));
    }

    /**
     * Publish quiz (make it public for students)
     */
    public function publish(Request $request, $id)
    {
        $user = $request->user();
        $quiz = Quiz::find($id);

        if (!$quiz) {
            return $this->error('Quiz not found', 404);
        }

        // Only teacher/admin can publish
        if (!in_array($user->role, ['TEACHER', 'ADMIN'])) {
            return $this->error('Only teachers can publish quizzes', 403);
        }

        $quiz->is_public = true;
        $quiz->save();

        return response()->json([
            'message' => 'Quiz published successfully',
            'quiz' => $this->formatQuiz($quiz->load('questions'), true)
        ]);
    }

    /**
     * Submit quiz answers
     */
    public function submit(Request $request, $id)
    {
        $user = $request->user();
        $quiz = Quiz::with('questions')->find($id);

        if (!$quiz) {
            return $this->error('Quiz not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'answers' => 'required|array',
            'timeTakenSeconds' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $answers = $request->answers;
        $correctCount = 0;
        $totalPoints = 0;
        $earnedPoints = 0;

        foreach ($quiz->questions as $question) {
            $totalPoints += $question->points;
            $userAnswer = $answers[$question->id] ?? null;
            
            if ($userAnswer === $question->correct_answer) {
                $correctCount++;
                $earnedPoints += $question->points;
            }
        }

        $score = $totalPoints > 0 ? ($earnedPoints / $totalPoints) * 100 : 0;
        $passed = $score >= $quiz->pass_score;

        $result = QuizResult::create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'score' => $score,
            'total_questions' => $quiz->questions->count(),
            'correct_answers' => $correctCount,
            'time_taken_seconds' => $request->timeTakenSeconds,
            'passed' => $passed,
            'answers_json' => $answers,
            'completed_at' => now(),
        ]);

        return response()->json([
            'id' => $result->id,
            'score' => $result->score,
            'totalQuestions' => $result->total_questions,
            'correctAnswers' => $result->correct_answers,
            'passed' => $result->passed,
            'timeTakenSeconds' => $result->time_taken_seconds,
            'completedAt' => $result->completed_at,
        ]);
    }

    /**
     * Get quiz results for current user
     */
    public function myResults(Request $request)
    {
        $results = QuizResult::where('user_id', $request->user()->id)
            ->with('quiz:id,title,course_id')
            ->orderBy('completed_at', 'desc')
            ->get()
            ->map(function ($result) {
                return [
                    'id' => $result->id,
                    'quizId' => $result->quiz_id,
                    'quizTitle' => $result->quiz->title ?? null,
                    'score' => $result->score,
                    'totalQuestions' => $result->total_questions,
                    'correctAnswers' => $result->correct_answers,
                    'passed' => $result->passed,
                    'completedAt' => $result->completed_at,
                ];
            });

        return response()->json($results);
    }

    /**
     * Get quiz by lesson ID
     */
    public function getByLesson($lessonId)
    {
        $quiz = Quiz::where('lesson_id', $lessonId)
            ->where('is_public', true)
            ->with('questions')
            ->first();

        if (!$quiz) {
            return $this->error('No quiz found for this lesson', 404);
        }

        return response()->json($this->formatQuiz($quiz, true));
    }

    private function formatQuiz($quiz, $withQuestions = false)
    {
        $data = [
            'id' => $quiz->id,
            'courseId' => $quiz->course_id,
            'lessonId' => $quiz->lesson_id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'difficulty' => $quiz->difficulty,
            'timeLimitMinutes' => $quiz->time_limit_minutes,
            'passScore' => $quiz->pass_score,
            'isPublic' => $quiz->is_public,
            'questionCount' => $quiz->questions_count ?? $quiz->questions->count(),
            'createdAt' => $quiz->created_at,
        ];

        if ($withQuestions && $quiz->questions) {
            $data['questions'] = $quiz->questions->map(function ($q) {
                return [
                    'id' => $q->id,
                    'question' => $q->question,
                    'optionA' => $q->option_a,
                    'optionB' => $q->option_b,
                    'optionC' => $q->option_c,
                    'optionD' => $q->option_d,
                    'correctAnswer' => $q->correct_answer,
                    'explanation' => $q->explanation,
                    'points' => $q->points,
                ];
            });
        }

        return $data;
    }

    /**
     * Generate quiz using AI
     */
    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lessonId' => 'nullable|integer',
            'materialId' => 'nullable|integer',
            'difficulty' => 'required|in:EASY,MEDIUM,HARD',
            'numQuestions' => 'integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        // Must provide either lessonId or materialId
        if (!$request->lessonId && !$request->materialId) {
            return $this->error('Either lessonId or materialId is required', 422);
        }

        $user = $request->user();
        $difficulty = $request->difficulty;
        $numQuestions = $request->numQuestions ?? 10;
        $content = '';
        $courseId = null;
        $lessonId = null;

        // Get content from lesson OR material
        if ($request->lessonId) {
            // Generate from lesson content
            $lesson = Lesson::find($request->lessonId);
            if (!$lesson) {
                return $this->error('Lesson not found', 404);
            }
            $content = $lesson->content;
            $courseId = $lesson->course_id;
            $lessonId = $lesson->id;
            
        } elseif ($request->materialId) {
            // Generate from material file
            $material = Material::find($request->materialId);
            if (!$material) {
                return $this->error('Material not found', 404);
            }

            // Try to extract text from file if it's PDF/DOCX
            if (in_array($material->type, ['PDF', 'DOCUMENT']) && $material->file_url) {
                try {
                    \Log::info('Extracting text from material file', [
                        'material_id' => $material->id,
                        'type' => $material->type,
                        'file_url' => $material->file_url
                    ]);

                    $extractResponse = Http::timeout(60)->post('http://localhost:8000/api/ai/extract-text-from-url', [
                        'file_url' => $material->file_url,
                        'file_type' => $material->type,
                    ]);

                    if ($extractResponse->successful()) {
                        $extractData = $extractResponse->json();
                        $content = $extractData['text'] ?? '';
                        \Log::info('Text extracted successfully', ['length' => strlen($content)]);
                    } else {
                        \Log::warning('Failed to extract text, using fallback');
                        $content = "Title: {$material->title}\n\nDescription: {$material->description}";
                    }
                } catch (\Exception $e) {
                    \Log::warning('Text extraction error, using fallback', ['error' => $e->getMessage()]);
                    $content = "Title: {$material->title}\n\nDescription: {$material->description}";
                }
            } else {
                // For non-extractable types, use metadata
                $content = "Title: {$material->title}\n\n";
                if ($material->description) {
                    $content .= "Description: {$material->description}\n\n";
                }
                $content .= "Note: This quiz is generated from uploaded material: {$material->title}";
            }
            
            $courseId = $material->course_id;
            $lessonId = $material->lesson_id;
        }

        if (empty($content)) {
            return $this->error('No content available to generate quiz', 400);
        }

        // Call FastAPI to generate quiz
        try {
            $response = Http::timeout(120)->post('http://localhost:8000/api/ai/generate-quiz', [
                'content' => $content,
                'num_questions' => $numQuestions,
                'difficulty' => strtolower($difficulty),
            ]);

            if ($response->failed()) {
                \Log::error('AI generate quiz failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return $this->error('Failed to generate quiz from AI: ' . $response->body(), 500);
            }

            $aiResponse = $response->json();
            
            if (!isset($aiResponse['questions']) || !is_array($aiResponse['questions'])) {
                \Log::error('Invalid AI response format', ['response' => $aiResponse]);
                return $this->error('Invalid response from AI service', 500);
            }
            
            $questions = $aiResponse['questions'];

            if (empty($questions)) {
                return $this->error('No questions generated', 500);
            }

            // Create quiz as draft (not public yet)
            $sourceType = $request->materialId ? 'material' : 'lesson';
            $quiz = Quiz::create([
                'course_id' => $courseId,
                'lesson_id' => $lessonId,
                'created_by' => $user->id,
                'title' => "Quiz tự động từ {$sourceType} ($difficulty)",
                'difficulty' => $difficulty,
                'is_public' => false, // Draft - teacher needs to review and publish
            ]);

            // Create questions
            foreach ($questions as $q) {
                QuizQuestion::create([
                    'quiz_id' => $quiz->id,
                    'question' => $q['question'],
                    'option_a' => $q['a'],
                    'option_b' => $q['b'],
                    'option_c' => $q['c'],
                    'option_d' => $q['d'],
                    'correct_answer' => strtoupper($q['correct']),
                    'explanation' => $q['explanation'] ?? null,
                ]);
            }

            // Return quiz with questions
            $quiz->load('questions');

            return response()->json([
                'id' => $quiz->id,
                'courseId' => $quiz->course_id,
                'lessonId' => $quiz->lesson_id,
                'title' => $quiz->title,
                'difficulty' => $quiz->difficulty,
                'isPublic' => $quiz->is_public,
                'questions' => $quiz->questions->map(function ($q) {
                    return [
                        'id' => $q->id,
                        'question' => $q->question,
                        'optionA' => $q->option_a,
                        'optionB' => $q->option_b,
                        'optionC' => $q->option_c,
                        'optionD' => $q->option_d,
                        'correctAnswer' => $q->correct_answer,
                        'explanation' => $q->explanation,
                    ];
                }),
                'createdAt' => $quiz->created_at,
            ], 201);

        } catch (\Exception $e) {
            return $this->error('Error generating quiz: ' . $e->getMessage(), 500);
        }
    }

}
