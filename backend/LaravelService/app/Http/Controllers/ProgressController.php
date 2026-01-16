<?php

namespace App\Http\Controllers;

use App\Models\CourseEnrollment;
use App\Models\LessonProgress;
use App\Models\Course;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    /**
     * Get course progress for current user
     */
    public function getCourseProgress(Request $request, $courseId)
    {
        $user = $request->user();
        
        $course = Course::with('lessons')->find($courseId);
        if (!$course) {
            return $this->error('Course not found', 404);
        }

        $enrollment = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->first();

        if (!$enrollment) {
            return $this->error('Not enrolled in this course', 400);
        }

        $totalLessons = $course->lessons->count();
        $completedLessons = LessonProgress::where('user_id', $user->id)
            ->whereIn('lesson_id', $course->lessons->pluck('id'))
            ->where('is_completed', true)
            ->count();

        $progressPercent = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

        $lessonProgress = [];
        foreach ($course->lessons as $lesson) {
            $progress = LessonProgress::where('user_id', $user->id)
                ->where('lesson_id', $lesson->id)
                ->first();

            $lessonProgress[] = [
                'lessonId' => $lesson->id,
                'lessonTitle' => $lesson->title,
                'completed' => $progress ? $progress->completed : false,
                'progressPercent' => $progress ? $progress->progress_percent : 0,
                'lastPosition' => $progress ? $progress->last_position : 0,
            ];
        }

        return response()->json([
            'courseId' => $courseId,
            'totalLessons' => $totalLessons,
            'completedLessons' => $completedLessons,
            'progressPercent' => $progressPercent,
            'isCompleted' => $enrollment->completed_at !== null,
            'enrolledAt' => $enrollment->enrolled_at,
            'completedAt' => $enrollment->completed_at,
            'lessons' => $lessonProgress,
        ]);
    }

    /**
     * Get all course progress for current user (Dashboard format)
     */
    public function getMyCoursesProgress(Request $request)
    {
        $user = $request->user();

        $enrollments = CourseEnrollment::where('user_id', $user->id)
            ->with(['course.lessons'])
            ->get();

        $progress = [];
        foreach ($enrollments as $enrollment) {
            $course = $enrollment->course;
            $totalLessons = $course->lessons->count();
            
            // Calculate total time spent
            $totalTimeSpent = LessonProgress::where('user_id', $user->id)
                ->whereIn('lesson_id', $course->lessons->pluck('id'))
                ->sum('time_spent') ?? 0;
            
            $completedLessons = LessonProgress::where('user_id', $user->id)
                ->whereIn('lesson_id', $course->lessons->pluck('id'))
                ->where('is_completed', true)
                ->count();

            $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

            // Get last accessed time
            $lastProgress = LessonProgress::where('user_id', $user->id)
                ->whereIn('lesson_id', $course->lessons->pluck('id'))
                ->orderBy('updated_at', 'desc')
                ->first();

            $progress[] = [
                'courseId' => $course->id,
                'courseTitle' => $course->title,
                'progressPercentage' => $progressPercentage,
                'completedLessons' => $completedLessons,
                'totalLessons' => $totalLessons,
                'totalTimeSpent' => $totalTimeSpent,
                'lastAccessedAt' => $lastProgress ? $lastProgress->updated_at : $enrollment->enrolled_at,
            ];
        }

        return response()->json($progress);
    }

    /**
     * Get all course progress for current user
     */
    public function getAllProgress(Request $request)
    {
        $user = $request->user();

        $enrollments = CourseEnrollment::where('user_id', $user->id)
            ->with(['course.lessons'])
            ->get();

        $progress = [];
        foreach ($enrollments as $enrollment) {
            $course = $enrollment->course;
            $totalLessons = $course->lessons->count();
            
            $completedLessons = LessonProgress::where('user_id', $user->id)
                ->whereIn('lesson_id', $course->lessons->pluck('id'))
                ->where('is_completed', true)
                ->count();

            $progressPercent = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

            $progress[] = [
                'courseId' => $course->id,
                'courseTitle' => $course->title,
                'totalLessons' => $totalLessons,
                'completedLessons' => $completedLessons,
                'progressPercent' => $progressPercent,
                'isCompleted' => $enrollment->completed_at !== null,
                'enrolledAt' => $enrollment->enrolled_at,
            ];
        }

        return response()->json($progress);
    }

    /**
     * Mark course as completed
     */
    public function completeCourse(Request $request, $courseId)
    {
        $user = $request->user();

        $enrollment = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->first();

        if (!$enrollment) {
            return $this->error('Not enrolled in this course', 400);
        }

        $enrollment->completed_at = now();
        $enrollment->save();

        return response()->json(['message' => 'Course marked as completed']);
    }
}
