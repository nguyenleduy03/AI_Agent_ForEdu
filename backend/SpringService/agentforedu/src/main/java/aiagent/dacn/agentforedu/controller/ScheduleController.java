package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.dto.ScheduleRequest;
import aiagent.dacn.agentforedu.dto.ScheduleResponse;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.service.ScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
@Tag(name = "Schedules", description = "API quản lý thời khóa biểu")
@SecurityRequirement(name = "bearerAuth")
public class ScheduleController {
    
    private final ScheduleService scheduleService;
    
    @GetMapping("/today")
    @Operation(summary = "Lấy thời khóa biểu hôm nay")
    public ResponseEntity<List<ScheduleResponse>> getTodaySchedule(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(scheduleService.getTodaySchedule(user.getId()));
    }
    
    @GetMapping("/day/{dayOfWeek}")
    @Operation(summary = "Lấy thời khóa biểu theo ngày", description = "dayOfWeek: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY")
    public ResponseEntity<List<ScheduleResponse>> getScheduleByDay(
            @AuthenticationPrincipal User user,
            @PathVariable String dayOfWeek) {
        return ResponseEntity.ok(scheduleService.getScheduleByDay(user.getId(), dayOfWeek));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Lấy toàn bộ thời khóa biểu")
    public ResponseEntity<List<ScheduleResponse>> getAllSchedules(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(scheduleService.getAllSchedules(user.getId()));
    }
    
    @PostMapping
    @Operation(summary = "Tạo lịch học mới", description = "Được gọi bởi Agent sau khi scrape từ trang trường")
    public ResponseEntity<?> createSchedule(
            @AuthenticationPrincipal User user,
            @RequestBody ScheduleRequest request) {
        
        ScheduleResponse response = scheduleService.createSchedule(user.getId(), request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/all")
    @Operation(summary = "Xóa toàn bộ lịch học", description = "Xóa trước khi sync mới từ trang trường")
    public ResponseEntity<?> deleteAllSchedules(@AuthenticationPrincipal User user) {
        scheduleService.deleteAllSchedules(user.getId());
        return ResponseEntity.ok(Map.of("message", "Đã xóa toàn bộ lịch học"));
    }
}
