<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class CourseController extends Controller
{
    /**
     * Get all courses
     */
    public function index(Request $request)
    {
        $courses = Course::with('creator:id,username,full_name')
            ->withCount('lessons')
            ->withCount('enrollments')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($course) use ($request) {
                return $this->formatCourse($course, $request->user());
            });

        return response()->json($courses);
    }

    /**
     * Get course by ID
     */
    public function show(Request $request, $id)
    {
        $course = Course::with(['creator:id,username,full_name', 'lessons'])
            ->withCount('enrollments')
            ->find($id);

        if (!$course) {
            return $this->error('Course not found', 404);
        }

        return response()->json($this->formatCourse($course, $request->user()));
    }

    /**
     * Create new course (Teacher/Admin only)
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        if (!in_array($user->role, ['TEACHER', 'ADMIN'])) {
            return $this->error('Only teachers can create courses', 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'isPublic' => 'nullable|boolean',
            'accessPassword' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $course = Course::create([
            'title' => $request->title,
            'description' => $request->description,
            'created_by' => $user->id,
            'is_public' => $request->isPublic ?? true,
            'access_password' => (!($request->isPublic ?? true) && $request->accessPassword) ? $request->accessPassword : null,
        ]);

        return response()->json($this->formatCourse($course, $user), 201);
    }

    /**
     * Update course (Creator or Admin only)
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $course = Course::find($id);

        if (!$course) {
            return $this->error('Course not found', 404);
        }

        if ($course->created_by !== $user->id && $user->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $course->title = $request->title;
        $course->description = $request->description;
        $course->save();

        return response()->json($this->formatCourse($course, $user));
    }

    /**
     * Delete course (Creator or Admin only) - Cascade delete
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $course = Course::find($id);

        if (!$course) {
            return $this->error('Course not found', 404);
        }

        if ($course->created_by !== $user->id && $user->role !== 'ADMIN') {
            return $this->error('Unauthorized', 403);
        }

        DB::transaction(function () use ($course, $id) {
            // 1. Get all lessons
            $lessons = Lesson::where('course_id', $id)->get();
            
            // 2. For each lesson, delete quizzes and related data
            foreach ($lessons as $lesson) {
                $quizzes = Quiz::where('lesson_id', $lesson->id)->get();
                foreach ($quizzes as $quiz) {
                    // Delete quiz results
                    QuizResult::where('quiz_id', $quiz->id)->delete();
                    // Delete quiz questions
                    QuizQuestion::where('quiz_id', $quiz->id)->delete();
                    // Delete quiz
                    $quiz->delete();
                }
                // Delete lesson
                $lesson->delete();
            }
            
            // 3. Delete all lesson progress for this course
            LessonProgress::where('course_id', $id)->delete();
            
            // 4. Delete all enrollments
            CourseEnrollment::where('course_id', $id)->delete();
            
            // 5. Finally delete the course
            $course->delete();
        });

        return response()->json(['message' => 'Course deleted successfully']);
    }

    /**
     * Enroll in course
     */
    public function enroll(Request $request, $id)
    {
        $user = $request->user();
        $course = Course::find($id);

        if (!$course) {
            return $this->error('Course not found', 404);
        }

        // Check if already enrolled
        $existing = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $id)
            ->first();

        if ($existing) {
            return $this->error('Already enrolled in this course', 400);
        }

        // Check if private course requires password
        if (!$course->is_public) {
            if (!$course->access_password) {
                return $this->error('This course does not allow enrollment', 403);
            }
            
            $validator = Validator::make($request->all(), [
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return $this->error('Password is required for private courses', 422, $validator->errors());
            }

            if ($request->password !== $course->access_password) {
                return $this->error('Incorrect password', 403);
            }
        }

        CourseEnrollment::create([
            'user_id' => $user->id,
            'course_id' => $id,
            'enrolled_at' => now(),
        ]);

        return response()->json($this->formatCourse($course, $user));
    }

    /**
     * Unenroll from course
     */
    public function unenroll(Request $request, $id)
    {
        $user = $request->user();
        
        if (!Course::find($id)) {
            return $this->error('Course not found', 404);
        }

        $enrollment = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $id)
            ->first();

        if (!$enrollment) {
            return $this->error('Not enrolled in this course', 400);
        }

        $enrollment->delete();

        return response()->json(['message' => 'Unenrolled successfully']);
    }

    /**
     * Get my courses (Teacher: created courses, Student: enrolled courses)
     */
    public function myCourses(Request $request)
    {
        $user = $request->user();

        // If teacher/admin: return courses created by user
        if (in_array($user->role, ['TEACHER', 'ADMIN'])) {
            $courses = Course::where('created_by', $user->id)
                ->withCount('lessons')
                ->withCount('enrollments')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($course) use ($user) {
                    return $this->formatCourse($course, $user);
                });
        } else {
            // If student: return enrolled courses
            $enrollments = CourseEnrollment::where('user_id', $user->id)->get();
            $courses = $enrollments->map(function ($enrollment) use ($user) {
                $course = Course::with('creator:id,username,full_name')
                    ->withCount('lessons')
                    ->withCount('enrollments')
                    ->find($enrollment->course_id);
                return $course ? $this->formatCourse($course, $user) : null;
            })->filter();
        }

        return response()->json($courses->values());
    }

    private function formatCourse($course, $user = null)
    {
        $data = [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'createdBy' => $course->created_by,
            'creatorName' => $course->creator->username ?? null,
            'isPublic' => $course->is_public,
            'enrollmentCount' => $course->enrollments_count ?? $course->enrollments->count(),
            'totalLessons' => $course->lessons_count ?? $course->lessons->count(),
            'createdAt' => $course->created_at,
            'updatedAt' => $course->updated_at,
        ];

        if ($user) {
            // Check if enrolled
            $data['isEnrolled'] = CourseEnrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->exists();
            
            // Check if creator
            $data['isCreator'] = $course->created_by === $user->id;
        } else {
            $data['isEnrolled'] = false;
            $data['isCreator'] = false;
        }

        return $data;
    }
}
