package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.dto.CourseRequest;
import aiagent.dacn.agentforedu.dto.CourseResponse;
import aiagent.dacn.agentforedu.dto.EnrollCourseRequest;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "API quản lý khóa học")
@SecurityRequirement(name = "bearerAuth")
public class CourseController {
    
    private final CourseService courseService;
    
    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả khóa học")
    public ResponseEntity<List<CourseResponse>> getAllCourses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.getAllCourses(user));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin khóa học theo ID")
    public ResponseEntity<CourseResponse> getCourseById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.getCourseById(id, user));
    }
    
    @PostMapping
    @Operation(summary = "Tạo khóa học mới")
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.createCourse(request, user));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật khóa học")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.updateCourse(id, request, user));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa khóa học")
    public ResponseEntity<Map<String, String>> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(Map.of("message", "Xóa khóa học thành công"));
    }
    
    @PostMapping("/{id}/enroll")
    @Operation(summary = "Đăng ký vào khóa học")
    public ResponseEntity<CourseResponse> enrollCourse(
            @PathVariable Long id,
            @RequestBody(required = false) EnrollCourseRequest request,
            @AuthenticationPrincipal User user) {
        if (request == null) {
            request = new EnrollCourseRequest();
        }
        return ResponseEntity.ok(courseService.enrollCourse(id, request, user));
    }
    
    @GetMapping("/my-enrollments")
    @Operation(summary = "Lấy danh sách khóa học đã đăng ký")
    public ResponseEntity<List<CourseResponse>> getMyEnrolledCourses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.getMyEnrolledCourses(user));
    }

    @GetMapping("/my-courses")
    @Operation(summary = "Lấy khóa học của tôi - Sinh viên: khóa đã đăng ký, Giáo viên: khóa đã tạo")
    public ResponseEntity<List<CourseResponse>> getMyCourses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.getMyCourses(user));
    }
    
    @DeleteMapping("/{id}/unenroll")
    @Operation(summary = "Hủy đăng ký khóa học")
    public ResponseEntity<Map<String, String>> unenrollCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        courseService.unenrollCourse(id, user);
        return ResponseEntity.ok(Map.of("message", "Đã hủy đăng ký khóa học"));
    }
    
    @PutMapping("/{id}/thumbnail")
    @Operation(summary = "Cập nhật ảnh đại diện khóa học")
    public ResponseEntity<CourseResponse> updateThumbnail(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user) {
        String thumbnailUrl = request.get("thumbnailUrl");
        String thumbnailDriveId = request.get("thumbnailDriveId");
        
        if (thumbnailUrl == null || thumbnailUrl.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(courseService.updateThumbnail(id, thumbnailUrl, thumbnailDriveId, user));
    }
    
    // ============================================================================
    // INTERNAL ENDPOINTS - No authentication required (for AI service)
    // ============================================================================
    
    @GetMapping("/internal/all")
    @Operation(summary = "Internal: Lấy tất cả khóa học (không cần auth)")
    public ResponseEntity<List<CourseResponse>> getAllCoursesInternal() {
        return ResponseEntity.ok(courseService.getAllCoursesPublic());
    }
    
    @GetMapping("/internal/{id}")
    @Operation(summary = "Internal: Lấy khóa học theo ID (không cần auth)")
    public ResponseEntity<CourseResponse> getCourseByIdInternal(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseByIdPublic(id));
    }
    
    @GetMapping("/internal/{courseId}/lessons")
    @Operation(summary = "Internal: Lấy bài học của khóa học (không cần auth)")
    public ResponseEntity<?> getLessonsInternal(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.getLessonsByCoursePublic(courseId));
    }
}
