package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.dto.UserResponse;
import aiagent.dacn.agentforedu.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - User Management", description = "API quản lý người dùng (ADMIN ONLY)")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {
    
    private final UserService userService;
    
    @GetMapping("/users")
    @Operation(summary = "Lấy danh sách tất cả người dùng")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/users/{id}")
    @Operation(summary = "Lấy thông tin người dùng theo ID")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @DeleteMapping("/users/{id}")
    @Operation(summary = "Xóa người dùng")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Xóa người dùng thành công"));
    }
}
