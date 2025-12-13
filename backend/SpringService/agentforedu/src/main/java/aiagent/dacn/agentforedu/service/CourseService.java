package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.CourseRequest;
import aiagent.dacn.agentforedu.dto.CourseResponse;
import aiagent.dacn.agentforedu.dto.EnrollCourseRequest;
import aiagent.dacn.agentforedu.entity.Course;
import aiagent.dacn.agentforedu.entity.CourseEnrollment;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.repository.CourseEnrollmentRepository;
import aiagent.dacn.agentforedu.repository.CourseRepository;
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
    
    private CourseResponse toResponse(Course course, User currentUser) {
        CourseResponse response = new CourseResponse();
        response.setId(course.getId());
        response.setTitle(course.getTitle());
        response.setDescription(course.getDescription());
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
        }
        
        // Get enrollment count
        long enrollmentCount = enrollmentRepository.countByCourseId(course.getId());
        response.setEnrollmentCount(enrollmentCount);
        
        return response;
    }
}
