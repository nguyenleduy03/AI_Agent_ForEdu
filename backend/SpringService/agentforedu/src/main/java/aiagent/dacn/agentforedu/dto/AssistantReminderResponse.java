package aiagent.dacn.agentforedu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantReminderResponse {
    
    private List<Reminder> reminders;
    private int totalCount;
    private int urgentCount; // Số nhắc nhở khẩn cấp
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Reminder {
        private String id;
        private ReminderType type;
        private ReminderPriority priority;
        private String title;
        private String message;
        private String icon;
        private String actionUrl; // Link để điều hướng
        private LocalDateTime deadline; // Nếu có
        private Object metadata; // Dữ liệu bổ sung
    }
    
    public enum ReminderType {
        QUIZ_DEADLINE,      // Quiz sắp hết hạn
        FLASHCARD_DUE,      // Flashcard cần ôn
        LESSON_INCOMPLETE,  // Bài học chưa hoàn thành
        COURSE_PROGRESS,    // Tiến độ khóa học thấp
        SCHEDULE_TODAY,     // Lịch học hôm nay
        QUIZ_NO_ATTEMPT,    // Quiz chưa có ai làm (Teacher)
        LOW_SCORE_ALERT     // Cảnh báo điểm thấp (Teacher)
    }
    
    public enum ReminderPriority {
        URGENT,   // Đỏ - Cần làm ngay
        HIGH,     // Cam - Quan trọng
        MEDIUM,   // Vàng - Bình thường
        LOW       // Xanh - Thông tin
    }
}
