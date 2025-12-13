package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.dto.MaterialRequest;
import aiagent.dacn.agentforedu.dto.MaterialResponse;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.service.MaterialService;
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
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Materials", description = "API quản lý tài liệu học tập")
@SecurityRequirement(name = "bearerAuth")
public class MaterialController {
    
    private final MaterialService materialService;
    
    @GetMapping("/courses/{courseId}/materials")
    @Operation(summary = "Lấy danh sách tài liệu của khóa học")
    public ResponseEntity<List<MaterialResponse>> getMaterialsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(materialService.getMaterialsByCourse(courseId));
    }
    
    @PostMapping("/materials/upload")
    @Operation(summary = "Upload tài liệu mới (tự động ingest vào RAG)")
    public ResponseEntity<MaterialResponse> uploadMaterial(
            @Valid @RequestBody MaterialRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(materialService.uploadMaterial(request, user));
    }
    
    @DeleteMapping("/materials/{id}")
    @Operation(summary = "Xóa tài liệu")
    public ResponseEntity<Map<String, String>> deleteMaterial(@PathVariable Long id) {
        materialService.deleteMaterial(id);
        return ResponseEntity.ok(Map.of("message", "Xóa tài liệu thành công"));
    }
}
