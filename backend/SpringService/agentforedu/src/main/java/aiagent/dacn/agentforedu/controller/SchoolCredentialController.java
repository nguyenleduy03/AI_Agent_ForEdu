package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.dto.SchoolCredentialRequest;
import aiagent.dacn.agentforedu.dto.SchoolCredentialResponse;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.service.SchoolCredentialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/school-credentials")
@RequiredArgsConstructor
@Tag(name = "School Credentials", description = "API quản lý tài khoản trường (cho web scraping)")
@SecurityRequirement(name = "bearerAuth")
public class SchoolCredentialController {
    
    private final SchoolCredentialService credentialService;
    
    @PostMapping
    @Operation(summary = "Lưu tài khoản trường", description = "Lưu username/password trường để Agent tự động login")
    public ResponseEntity<?> saveCredentials(
            @AuthenticationPrincipal User user,
            @RequestBody SchoolCredentialRequest request) {
        
        SchoolCredentialResponse response = credentialService.saveCredentials(user.getId(), request);
        
        return ResponseEntity.ok(Map.of(
            "message", "Đã lưu tài khoản trường thành công!",
            "data", response
        ));
    }
    
    @GetMapping
    @Operation(summary = "Lấy tài khoản trường", description = "Lấy thông tin tài khoản trường đã lưu")
    public ResponseEntity<?> getCredentials(@AuthenticationPrincipal User user) {
        return credentialService.getCredentials(user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/sync")
    @Operation(summary = "Cập nhật thời gian sync", description = "Cập nhật last_synced_at sau khi scrape thành công")
    public ResponseEntity<?> updateLastSynced(@AuthenticationPrincipal User user) {
        credentialService.updateLastSyncedAt(user.getId());
        return ResponseEntity.ok(Map.of("message", "Updated"));
    }
    
    @DeleteMapping
    @Operation(summary = "Xóa tài khoản trường", description = "Xóa tài khoản trường đã lưu")
    public ResponseEntity<?> deleteCredentials(@AuthenticationPrincipal User user) {
        credentialService.deleteCredentials(user.getId());
        return ResponseEntity.ok(Map.of("message", "Đã xóa tài khoản trường"));
    }
}
