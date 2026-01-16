package aiagent.dacn.agentforedu.dto;

import aiagent.dacn.agentforedu.entity.QuizDifficulty;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QuizListResponse {
    private Long id;
    private Long lessonId;
    private String title;
    private String description;
    private QuizDifficulty difficulty;
    private Integer totalQuestions;
    private Long createdBy; // ID người tạo quiz
    private String creatorName;
    private LocalDateTime createdAt;
    private LocalDateTime deadline; // Hạn làm bài
    private Integer timeLimitMinutes; // Thời gian làm bài (phút)
    private Integer maxAttempts; // Số lần làm bài tối đa
    private Boolean isExpired; // Quiz đã hết hạn chưa
    private Boolean isPublic; // Quiz công khai hay riêng tư
    private Boolean isCompleted; // Sinh viên đã làm chưa
    private Double lastScore; // Điểm lần làm gần nhất
    private Integer attemptCount; // Số lần đã làm
    private Boolean canAttempt; // Còn được làm không
}
