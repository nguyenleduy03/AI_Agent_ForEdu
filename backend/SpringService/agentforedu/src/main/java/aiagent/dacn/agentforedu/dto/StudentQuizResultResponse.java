package aiagent.dacn.agentforedu.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentQuizResultResponse {
    private Long resultId;
    private Long quizId;
    private String quizTitle;
    private Long lessonId;
    private String lessonTitle;
    private Double score;
    private Integer totalQuestions;
    private Double percentage;
    private LocalDateTime completedAt;
    private Integer attemptNumber;
}
