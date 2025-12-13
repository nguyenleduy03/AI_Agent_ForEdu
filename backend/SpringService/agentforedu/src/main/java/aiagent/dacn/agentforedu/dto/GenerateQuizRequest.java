package aiagent.dacn.agentforedu.dto;

import aiagent.dacn.agentforedu.entity.QuizDifficulty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GenerateQuizRequest {
    @NotNull(message = "Lesson ID không được để trống")
    private Long lessonId;
    
    @NotNull(message = "Độ khó không được để trống")
    private QuizDifficulty difficulty;
    
    @Min(value = 1, message = "Số câu hỏi phải >= 1")
    @Max(value = 50, message = "Số câu hỏi phải <= 50")
    private Integer numQuestions = 10;
}
