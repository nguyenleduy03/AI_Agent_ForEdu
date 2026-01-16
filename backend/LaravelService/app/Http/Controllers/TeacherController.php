<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\LessonProgress;
use App\Models\QuizResult;
use App\Models\User;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    /**
     * Get course students
     */
    public function getCourseStudents(Request $request, $courseId)
    {
        $teacher = $request->user();
        $course = Course::where('id', $courseId)
            ->where('created_by', $teacher->id)
            ->first();

        if (!$course) {
            return $this->error('Course not found or unauthorized', 404);
        }

        $enrollments = CourseEnrollment::where('course_id', $courseId)
            ->with('user:id,email,full_name,avatar_url')
            ->get();

        $students = $enrollments->map(function ($enrollment) use ($course) {
            $user = $enrollment->user;
            $totalLessons = $course->lessons->count();
            $completedLessons = LessonProgress::where('user_id', $user->id)
                ->whereIn('lesson_id', $course->lessons->pluck('id'))
                ->where('is_completed', true)
                ->count();

            return [
                'id' => $user->id,
                'email' => $user->email,
                'fullName' => $user->full_name,
                'avatarUrl' => $user->avatar_url,
                'enrolledAt' => $enrollment->enrolled_at,
                'completedAt' => $enrollment->completed_at,
                'progressPercent' => $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0,
            ];
        });

        return response()->json([
            'courseId' => $course->id,
            'courseTitle' => $course->title,
            'totalStudents' => $students->count(),
            'students' => $students,
        ]);
    }

    /**
     * Remove student from course
     */
    public function removeStudent(Request $request, $courseId, $studentId)
    {
        $teacher = $request->user();
        $course = Course::where('id', $courseId)
            ->where('created_by', $teacher->id)
            ->first();

        if (!$course) {
            return $this->error('Course not found or unauthorized', 404);
        }

        $enrollment = CourseEnrollment::where('course_id', $courseId)
            ->where('user_id', $studentId)
            ->first();

        if (!$enrollment) {
            return $this->error('Student not enrolled', 404);
        }

        $enrollment->delete();

        return response()->json(['message' => 'Đã xóa sinh viên khỏi khóa học']);
    }

    /**
     * Get my courses as teacher
     */
    public function getMyCourses(Request $request)
    {
        $teacher = $request->user();
        $courses = Course::where('created_by', $teacher->id)
            ->with(['lessons', 'enrollments.user:id,email,full_name,avatar_url'])
            ->get();

        $result = $courses->map(function ($course) {
            $students = $course->enrollments->map(function ($enrollment) use ($course) {
                $user = $enrollment->user;
                $totalLessons = $course->lessons->count();
                $completedLessons = LessonProgress::where('user_id', $user->id)
                    ->whereIn('lesson_id', $course->lessons->pluck('id'))
                    ->where('is_completed', true)
                    ->count();

                return [
                    'id' => $user->id,
                    'email' => $user->email,
                    'fullName' => $user->full_name,
                    'avatarUrl' => $user->avatar_url,
                    'enrolledAt' => $enrollment->enrolled_at,
                    'progressPercent' => $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0,
                ];
            });

            return [
                'courseId' => $course->id,
                'courseTitle' => $course->title,
                'totalStudents' => $students->count(),
                'students' => $students,
            ];
        });

        return response()->json($result);
    }

    /**
     * Get student detail
     */
    public function getStudentDetail(Request $request, $courseId, $studentId)
    {
        $teacher = $request->user();
        $course = Course::where('id', $courseId)
            ->where('created_by', $teacher->id)
            ->with('lessons')
            ->first();

        if (!$course) {
            return $this->error('Course not found or unauthorized', 404);
        }

        $student = User::find($studentId);
        if (!$student) {
            return $this->error('Student not found', 404);
        }

        $enrollment = CourseEnrollment::where('course_id', $courseId)
            ->where('user_id', $studentId)
            ->first();

        if (!$enrollment) {
            return $this->error('Student not enrolled', 404);
        }

        // Lesson progress
        $lessonProgress = [];
        foreach ($course->lessons as $lesson) {
            $progress = LessonProgress::where('user_id', $studentId)
                ->where('lesson_id', $lesson->id)
                ->first();

            $lessonProgress[] = [
                'lessonId' => $lesson->id,
                'lessonTitle' => $lesson->title,
                'completed' => $progress ? $progress->completed : false,
                'progressPercent' => $progress ? $progress->progress_percent : 0,
            ];
        }

        // Quiz results
        $quizResults = QuizResult::where('user_id', $studentId)
            ->whereHas('quiz', fn($q) => $q->where('course_id', $courseId))
            ->with('quiz:id,title')
            ->get()
            ->map(fn($r) => [
                'quizId' => $r->quiz_id,
                'quizTitle' => $r->quiz->title,
                'score' => $r->score,
                'totalQuestions' => $r->total_questions,
                'submittedAt' => $r->submitted_at,
            ]);

        return response()->json([
            'studentId' => $student->id,
            'email' => $student->email,
            'fullName' => $student->full_name,
            'avatarUrl' => $student->avatar_url,
            'enrolledAt' => $enrollment->enrolled_at,
            'completedAt' => $enrollment->completed_at,
            'lessonProgress' => $lessonProgress,
            'quizResults' => $quizResults,
        ]);
    }

    /**
     * Get course analytics
     */
    public function getCourseAnalytics(Request $request, $courseId)
    {
        $teacher = $request->user();
        $course = Course::where('id', $courseId)
            ->where('created_by', $teacher->id)
            ->with(['lessons', 'enrollments'])
            ->first();

        if (!$course) {
            return $this->error('Course not found or unauthorized', 404);
        }

        $totalStudents = $course->enrollments->count();
        $completedStudents = $course->enrollments->whereNotNull('completed_at')->count();

        // Average progress
        $avgProgress = 0;
        if ($totalStudents > 0 && $course->lessons->count() > 0) {
            $totalProgress = 0;
            foreach ($course->enrollments as $enrollment) {
                $completed = LessonProgress::where('user_id', $enrollment->user_id)
                    ->whereIn('lesson_id', $course->lessons->pluck('id'))
                    ->where('is_completed', true)
                    ->count();
                $totalProgress += ($completed / $course->lessons->count()) * 100;
            }
            $avgProgress = round($totalProgress / $totalStudents);
        }

        // Quiz stats
        $quizResults = QuizResult::whereHas('quiz', fn($q) => $q->where('course_id', $courseId))->get();
        $avgQuizScore = $quizResults->count() > 0 
            ? round($quizResults->avg('score') / $quizResults->avg('total_questions') * 100) 
            : 0;

        return response()->json([
            'courseId' => $course->id,
            'courseTitle' => $course->title,
            'totalStudents' => $totalStudents,
            'completedStudents' => $completedStudents,
            'averageProgress' => $avgProgress,
            'averageQuizScore' => $avgQuizScore,
            'totalLessons' => $course->lessons->count(),
        ]);
    }
}
