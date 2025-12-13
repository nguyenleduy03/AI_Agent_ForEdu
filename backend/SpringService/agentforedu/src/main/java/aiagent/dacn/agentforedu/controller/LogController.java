package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.entity.SystemLog;
import aiagent.dacn.agentforedu.service.LogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
@Tag(name = "System Logs", description = "API xem log hệ thống")
@SecurityRequirement(name = "bearerAuth")
public class LogController {
    
    private final LogService logService;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy tất cả log hệ thống (ADMIN)")
    public ResponseEntity<List<SystemLog>> getAllLogs() {
        return ResponseEntity.ok(logService.getAllLogs());
    }
    
    @GetMapping("/user/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy log của một user (ADMIN)")
    public ResponseEntity<List<SystemLog>> getUserLogs(@PathVariable Long id) {
        return ResponseEntity.ok(logService.getUserLogs(id));
    }
}
