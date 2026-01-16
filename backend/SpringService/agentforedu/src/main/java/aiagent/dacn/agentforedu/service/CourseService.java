package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.CourseRequest;
import aiagent.dacn.agentforedu.dto.CourseResponse;
import aiagent.dacn.agentforedu.dto.EnrollCourseRequest;
import aiagent.dacn.agentforedu.entity.Course;
import aiagent.dacn.agentforedu.entity.CourseEnrollment;
import aiagent.dacn.agentforedu.entity.Lesson;
import aiagent.dacn.agentforedu.entity.Quiz;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.repository.CourseEnrollmentRepository;
import aiagent.dacn.agentforedu.repository.CourseProgressRepository;
import aiagent.dacn.agentforedu.repository.CourseRepository;
import aiagent.dacn.agentforedu.repository.LessonProgressRepository;
import aiagent.dacn.agentforedu.repository.LessonRepository;
import aiagent.dacn.agentforedu.repository.QuizQuestionRepository;
import aiagent.dacn.agentforedu.repository.QuizRepository;
import aiagent.dacn.agentforedu.repository.QuizResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {
    
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizResultRepository quizResultRepository;
    
    @Transactional(readOnly = true)
    public List<CourseResponse> getAllCourses(User currentUser) {
        return courseRepository.findAll().stream()
                .map(course -> toResponse(course, currentUser))
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(Long id, User currentUser) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        return toResponse(course, currentUser);
    }
    
    @Transactional
    public CourseResponse createCourse(CourseRequest request, User user) {
        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setCreatedBy(user.getId());
        course.setIsPublic(request.getIsPublic() != null ? request.getIsPublic() : true);
        
        // Set password for private courses
        if (!course.getIsPublic() && request.getAccessPassword() != null && !request.getAccessPassword().isEmpty()) {
            course.setAccessPassword(request.getAccessPassword());
        }
        
        Course saved = courseRepository.save(course);
        return toResponse(saved, user);
    }
    
    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request, User user) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        
        Course updated = courseRepository.save(course);
        return toResponse(updated, user);
    }
    
    @Transactional
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy khóa học");
        }
        
        // 1. Get all lessons in this course
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndexAsc(id);
        
        // 2. For each lesson, delete quizzes and related data
        for (Lesson lesson : lessons) {
            List<Quiz> quizzes = quizRepository.findByLessonId(lesson.getId());
            for (Quiz quiz : quizzes) {
                // Delete quiz results
                quizResultRepository.deleteByQuizId(quiz.getId());
                // Delete quiz questions
                quizQuestionRepository.deleteByQuizId(quiz.getId());
                // Delete quiz
                quizRepository.delete(quiz);
            }
            // Delete lesson (lesson progress will be deleted by courseId below)
            lessonRepository.delete(lesson);
        }
        
        // 3. Delete all lesson progress for this course
        lessonProgressRepository.deleteByCourseId(id);
        
        // 4. Delete course progress
        courseProgressRepository.deleteByCourseId(id);
        
        // 5. Delete all enrollments
        enrollmentRepository.deleteByCourseId(id);
        
        // 6. Finally delete the course
        courseRepository.deleteById(id);
    }
    
    @Transactional
    public CourseResponse enrollCourse(Long courseId, EnrollCourseRequest request, User user) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        
        // Check if already enrolled
        if (enrollmentRepository.existsByUserIdAndCourseId(user.getId(), courseId)) {
            throw new RuntimeException("Bạn đã đăng ký khóa học này rồi");
        }
        
        // Check if private course requires password
        if (!course.getIsPublic()) {
            if (course.getAccessPassword() == null || course.getAccessPassword().isEmpty()) {
                throw new RuntimeException("Khóa học này không cho phép đăng ký");
            }
            
            if (request.getPassword() == null || !request.getPassword().equals(course.getAccessPassword())) {
                throw new RuntimeException("Mật khẩu không đúng");
            }
        }
        
        // Create enrollment
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setUserId(user.getId());
        enrollment.setCourseId(courseId);
        enrollmentRepository.save(enrollment);
        
        return toResponse(course, user);
    }
    
    @Transactional(readOnly = true)
    public List<CourseResponse> getMyEnrolledCourses(User user) {
        List<CourseEnrollment> enrollments = enrollmentRepository.findByUserId(user.getId());
        return enrollments.stream()
                .map(enrollment -> {
                    Course course = courseRepository.findById(enrollment.getCourseId())
                            .orElse(null);
                    return course != null ? toResponse(course, user) : null;
                })
                .filter(response -> response != null)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getMyCourses(User user) {
        // If teacher/admin: return courses created by user
        if ("TEACHER".equals(user.getRole().name()) || "ADMIN".equals(user.getRole().name())) {
            return courseRepository.findAll().stream()
                    .filter(course -> course.getCreatedBy().equals(user.getId()))
                    .map(course -> toResponse(course, user))
                    .collect(Collectors.toList());
        }
        
        // If student: return enrolled courses
        return getMyEnrolledCourses(user);
    }
    
    @Transactional
    public void unenrollCourse(Long courseId, User user) {
        // Check if course exists
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Không tìm thấy khóa học");
        }
        
        // Find enrollment
        CourseEnrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(user.getId(), courseId)
                .orElseThrow(() -> new RuntimeException("Bạn chưa đăng ký khóa học này"));
        
        // Delete enrollment
        enrollmentRepository.delete(enrollment);
    }
    
    @Transactional
    public CourseResponse updateThumbnail(Long courseId, String thumbnailUrl, String thumbnailDriveId, User user) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        
        // Check if user is the creator
        if (!course.getCreatedBy().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền cập nhật khóa học này");
        }
        
        course.setThumbnailUrl(thumbnailUrl);
        course.setThumbnailDriveId(thumbnailDriveId);
        
        Course updated = courseRepository.save(course);
        return toResponse(updated, user);
    }
    
    private CourseResponse toResponse(Course course, User currentUser) {
        CourseResponse response = new CourseResponse();
        response.setId(course.getId());
        response.setTitle(course.getTitle());
        response.setDescription(course.getDescription());
        response.setThumbnailUrl(course.getThumbnailUrl());
        response.setCreatedBy(course.getCreatedBy());
        response.setIsPublic(course.getIsPublic());
        response.setCreatedAt(course.getCreatedAt());
        response.setUpdatedAt(course.getUpdatedAt());
        
        if (course.getCreator() != null) {
            response.setCreatorName(course.getCreator().getUsername());
        }
        
        // Check if current user is enrolled
        if (currentUser != null) {
            boolean isEnrolled = enrollmentRepository.existsByUserIdAndCourseId(currentUser.getId(), course.getId());
            response.setIsEnrolled(isEnrolled);
            
            // Check if current user is the creator
            boolean isCreator = course.getCreatedBy().equals(currentUser.getId());
            response.setIsCreator(isCreator);
        }
        
        // Get enrollment count
        long enrollmentCount = enrollmentRepository.countByCourseId(course.getId());
        response.setEnrollmentCount(enrollmentCount);
        
        // Get total lessons count
        int totalLessons = (int) lessonRepository.findByCourseIdOrderByOrderIndexAsc(course.getId()).size();
        response.setTotalLessons(totalLessons);
        
        return response;
    }
    
    // ============================================================================
    // PUBLIC METHODS - For internal API (no authentication)
    // ============================================================================
    
    @Transactional(readOnly = true)
    public List<CourseResponse> getAllCoursesPublic() {
        return courseRepository.findAll().stream()
                .map(this::toResponsePublic)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public CourseResponse getCourseByIdPublic(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        return toResponsePublic(course);
    }
    
    @Transactional(readOnly = true)
    public List<?> getLessonsByCoursePublic(Long courseId) {
        return lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId).stream()
                .map(lesson -> {
                    var map = new java.util.HashMap<String, Object>();
                    map.put("id", lesson.getId());
                    map.put("title", lesson.getTitle());
                    map.put("content", lesson.getContent());
                    map.put("orderIndex", lesson.getOrderIndex());
                    map.put("courseId", lesson.getCourseId());
                    return map;
                })
                .collect(Collectors.toList());
    }
    
    private CourseResponse toResponsePublic(Course course) {
        CourseResponse response = new CourseResponse();
        response.setId(course.getId());
        response.setTitle(course.getTitle());
        response.setDescription(course.getDescription());
        response.setThumbnailUrl(course.getThumbnailUrl());
        response.setCreatedBy(course.getCreatedBy());
        response.setIsPublic(course.getIsPublic());
        response.setCreatedAt(course.getCreatedAt());
        response.setUpdatedAt(course.getUpdatedAt());
        
        if (course.getCreator() != null) {
            response.setCreatorName(course.getCreator().getUsername());
        }
        
        // Get enrollment count
        long enrollmentCount = enrollmentRepository.countByCourseId(course.getId());
        response.setEnrollmentCount(enrollmentCount);
        
        // Get total lessons count
        int totalLessons = (int) lessonRepository.findByCourseIdOrderByOrderIndexAsc(course.getId()).size();
        response.setTotalLessons(totalLessons);
        
        return response;
    }
}
