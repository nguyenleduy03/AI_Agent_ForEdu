package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.dto.LessonRequest;
import aiagent.dacn.agentforedu.dto.LessonResponse;
import aiagent.dacn.agentforedu.service.LessonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Lessons", description = "API quản lý bài học")
@SecurityRequirement(name = "bearerAuth")
public class LessonController {
    
    private final LessonService lessonService;
    
    @GetMapping("/courses/{courseId}/lessons")
    @Operation(summary = "Lấy danh sách bài học của khóa học")
    public ResponseEntity<List<LessonResponse>> getLessonsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(lessonService.getLessonsByCourse(courseId));
    }
    
    @GetMapping("/lessons/{id}")
    @Operation(summary = "Lấy thông tin bài học theo ID")
    public ResponseEntity<LessonResponse> getLessonById(@PathVariable Long id) {
        return ResponseEntity.ok(lessonService.getLessonById(id));
    }
    
    @PostMapping("/courses/{courseId}/lessons")
    @Operation(summary = "Tạo bài học mới trong khóa học")
    public ResponseEntity<LessonResponse> createLesson(
            @PathVariable Long courseId,
            @Valid @RequestBody LessonRequest request) {
        return ResponseEntity.ok(lessonService.createLesson(courseId, request));
    }
    
    @PutMapping("/lessons/{id}")
    @Operation(summary = "Cập nhật bài học")
    public ResponseEntity<LessonResponse> updateLesson(
            @PathVariable Long id,
            @Valid @RequestBody LessonRequest request) {
        return ResponseEntity.ok(lessonService.updateLesson(id, request));
    }
    
    @DeleteMapping("/lessons/{id}")
    @Operation(summary = "Xóa bài học")
    public ResponseEntity<Map<String, String>> deleteLesson(@PathVariable Long id) {
        lessonService.deleteLesson(id);
        return ResponseEntity.ok(Map.of("message", "Xóa bài học thành công"));
    }
}
