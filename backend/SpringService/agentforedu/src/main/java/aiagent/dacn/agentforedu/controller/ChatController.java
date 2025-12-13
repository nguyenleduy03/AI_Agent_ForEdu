package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.dto.ChatMessageResponse;
import aiagent.dacn.agentforedu.dto.ChatSessionRequest;
import aiagent.dacn.agentforedu.dto.ChatSessionResponse;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.service.ChatService;
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
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Chat Sessions", description = "API quản lý phiên chat")
@SecurityRequirement(name = "bearerAuth")
public class ChatController {
    
    private final ChatService chatService;
    
    @GetMapping("/sessions")
    @Operation(summary = "Lấy danh sách phiên chat của user")
    public ResponseEntity<List<ChatSessionResponse>> getUserSessions(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.getUserSessions(user));
    }
    
    @PostMapping("/sessions")
    @Operation(summary = "Tạo phiên chat mới")
    public ResponseEntity<ChatSessionResponse> createSession(
            @Valid @RequestBody ChatSessionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.createSession(request, user));
    }
    
    @GetMapping("/sessions/{id}/messages")
    @Operation(summary = "Lấy danh sách tin nhắn trong phiên chat")
    public ResponseEntity<List<ChatMessageResponse>> getSessionMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.getSessionMessages(id, user));
    }
    
    @PostMapping("/sessions/{id}/messages")
    @Operation(summary = "Thêm tin nhắn vào phiên chat")
    public ResponseEntity<ChatMessageResponse> addMessage(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user) {
        String sender = request.get("sender");
        String message = request.get("message");
        return ResponseEntity.ok(chatService.addMessage(id, sender, message, user));
    }
    
    @DeleteMapping("/sessions/{id}")
    @Operation(summary = "Xóa phiên chat")
    public ResponseEntity<Map<String, String>> deleteSession(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        chatService.deleteSession(id, user);
        return ResponseEntity.ok(Map.of("message", "Xóa phiên chat thành công"));
    }
}
