package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.dto.AssistantReminderResponse;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.service.AssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
@Tag(name = "Assistant", description = "API cho trợ lý ảo nhắc nhở")
@SecurityRequirement(name = "bearerAuth")
public class AssistantController {

    private final AssistantService assistantService;

    @GetMapping("/reminders")
    @Operation(summary = "Lấy danh sách nhắc nhở cho user hiện tại")
    public ResponseEntity<AssistantReminderResponse> getReminders(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(assistantService.getReminders(user));
    }
}
