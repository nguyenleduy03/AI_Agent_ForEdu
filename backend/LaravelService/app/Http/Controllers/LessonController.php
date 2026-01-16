<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LessonController extends Controller
{
    /**
     * Get lessons for a course
     */
    public function index($courseId)
    {
        $lessons = Lesson::where('course_id', $courseId)
            ->orderBy('order_index')
            ->get()
            ->map(function ($lesson) {
                return $this->formatLesson($lesson);
            });

        return response()->json($lessons);
    }

    /**
     * Get lesson by ID
     */
    public function show($courseId, $id)
    {
        $lesson = Lesson::where('course_id', $courseId)
            ->where('id', $id)
            ->with('materials')
            ->first();

        if (!$lesson) {
            return $this->error('Lesson not found', 404);
        }

        return response()->json($this->formatLesson($lesson, true));
    }

    /**
     * Create new lesson
     */
    public function store(Request $request, $courseId)
    {
        $user = $request->user();
        $course = Course::find($courseId);

        if (!$course) {
            return $this->error('Course not found', 404);
        }

        if ($course->created_by !== $user->id && $user->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'orderIndex' => 'integer',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $maxOrder = Lesson::where('course_id', $courseId)->max('order_index') ?? 0;

        $lesson = Lesson::create([
            'course_id' => $courseId,
            'title' => $request->title,
            'content' => $request->content,
            'order_index' => $request->orderIndex ?? ($maxOrder + 1),
        ]);

        return response()->json($this->formatLesson($lesson), 201);
    }

    /**
     * Update lesson
     */
    public function update(Request $request, $courseId, $id)
    {
        $user = $request->user();
        $course = Course::find($courseId);

        if (!$course) {
            return $this->error('Course not found', 404);
        }

        if ($course->created_by !== $user->id && $user->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        $lesson = Lesson::where('course_id', $courseId)->where('id', $id)->first();

        if (!$lesson) {
            return $this->error('Lesson not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'content' => 'string',
            'orderIndex' => 'integer',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $lesson->fill([
            'title' => $request->title ?? $lesson->title,
            'content' => $request->content ?? $lesson->content,
            'order_index' => $request->orderIndex ?? $lesson->order_index,
        ]);
        $lesson->save();

        return response()->json($this->formatLesson($lesson));
    }

    /**
     * Delete lesson
     */
    public function destroy(Request $request, $courseId, $id)
    {
        $user = $request->user();
        $course = Course::find($courseId);

        if (!$course) {
            return $this->error('Course not found', 404);
        }

        if ($course->created_by !== $user->id && $user->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        $lesson = Lesson::where('course_id', $courseId)->where('id', $id)->first();

        if (!$lesson) {
            return $this->error('Lesson not found', 404);
        }

        $lesson->delete();

        return response()->json(['message' => 'Lesson deleted successfully']);
    }

    /**
     * Update lesson progress
     */
    public function updateProgress(Request $request, $courseId, $id)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'progressPercent' => 'required|integer|min:0|max:100',
            'lastPosition' => 'integer',
            'completed' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $progress = LessonProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $id,
            ],
            [
                'progress_percent' => $request->progressPercent,
                'last_position' => $request->lastPosition ?? 0,
                'completed' => $request->completed ?? ($request->progressPercent >= 100),
                'completed_at' => $request->completed || $request->progressPercent >= 100 ? now() : null,
            ]
        );

        return response()->json([
            'lessonId' => $progress->lesson_id,
            'progressPercent' => $progress->progress_percent,
            'completed' => $progress->completed,
            'lastPosition' => $progress->last_position,
        ]);
    }

    /**
     * Get lesson by ID (shortcut without courseId)
     */
    public function showById($id)
    {
        $lesson = Lesson::with('materials')->find($id);

        if (!$lesson) {
            return $this->error('Lesson not found', 404);
        }

        return response()->json($this->formatLesson($lesson, true));
    }

    /**
     * Update lesson by ID (shortcut without courseId)
     */
    public function updateById(Request $request, $id)
    {
        $user = $request->user();
        $lesson = Lesson::find($id);

        if (!$lesson) {
            return $this->error('Lesson not found', 404);
        }

        $course = Course::find($lesson->course_id);
        if (!$course || ($course->created_by !== $user->id && $user->role !== 'ADMIN')) {
            return $this->error('Unauthorized', 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'content' => 'string',
            'orderIndex' => 'integer',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $lesson->fill([
            'title' => $request->title ?? $lesson->title,
            'content' => $request->content ?? $lesson->content,
            'order_index' => $request->orderIndex ?? $lesson->order_index,
        ]);
        $lesson->save();

        return response()->json($this->formatLesson($lesson));
    }

    /**
     * Delete lesson by ID (shortcut without courseId)
     */
    public function destroyById(Request $request, $id)
    {
        $user = $request->user();
        $lesson = Lesson::find($id);

        if (!$lesson) {
            return $this->error('Lesson not found', 404);
        }

        $course = Course::find($lesson->course_id);
        if (!$course || ($course->created_by !== $user->id && $user->role !== 'ADMIN')) {
            return $this->error('Unauthorized', 403);
        }

        $lesson->delete();

        return response()->json(['message' => 'Lesson deleted successfully']);
    }

    private function formatLesson($lesson, $withMaterials = false)
    {
        $data = [
            'id' => $lesson->id,
            'courseId' => $lesson->course_id,
            'title' => $lesson->title,
            'content' => $lesson->content,
            'orderIndex' => $lesson->order_index,
            'createdAt' => $lesson->created_at,
        ];

        if ($withMaterials && $lesson->materials) {
            $data['materials'] = $lesson->materials->map(function ($material) {
                return [
                    'id' => $material->id,
                    'title' => $material->title,
                    'type' => $material->type,
                    'fileUrl' => $material->file_url,
                    'description' => $material->description,
                ];
            });
        }

        return $data;
    }
}
