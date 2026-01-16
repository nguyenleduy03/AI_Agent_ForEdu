package aiagent.dacn.agentforedu.dto;

import aiagent.dacn.agentforedu.entity.QuizDifficulty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizResponse {
    private Long id;
    private Long courseId;
    private Long lessonId;
    private String title;
    private String description;
    private QuizDifficulty difficulty;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime deadline; // Hạn làm bài
    private Integer timeLimitMinutes; // Thời gian làm bài (phút)
    private Integer maxAttempts; // Số lần làm bài tối đa
    private Boolean shuffleQuestions; // Xáo trộn câu hỏi
    private Boolean shuffleOptions; // Xáo trộn đáp án
    private Boolean isExpired; // Quiz đã hết hạn chưa
    private Integer attemptCount; // Số lần đã làm (cho sinh viên)
    private Boolean canAttempt; // Còn được làm không
    private List<QuizQuestionResponse> questions;
}
