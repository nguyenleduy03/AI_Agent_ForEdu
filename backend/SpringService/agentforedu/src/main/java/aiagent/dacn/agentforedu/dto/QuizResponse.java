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
    private QuizDifficulty difficulty;
    private Long createdBy;
    private LocalDateTime createdAt;
    private List<QuizQuestionResponse> questions;
}
